import { onRequest } from 'firebase-functions/v2/https';
import { firestore } from './admin';

export const checkOAuthStatus = onRequest(async (req, res) => {
  try {
    const { company_id, site_id, subsite_id, tokenDocId } = req.query;
    
    // If tokenDocId is provided, check specific token
    if (tokenDocId) {
      const doc = await firestore.collection('oauth_tokens').doc(tokenDocId as string).get();
      const exists = doc.exists;
      const valid = exists && doc.data()?.tokens?.access_token;
      
      res.json({
        exists,
        valid,
        email: doc.data()?.email || null,
        connectedAt: doc.data()?.connectedAt || null
      });
      return;
    }
    
    // Otherwise, check all tokens for the company/site/subsite
    if (!company_id) {
      res.status(400).json({ error: 'Company ID is required' });
      return;
    }

    const siteId = site_id as string || 'default';
    const subsiteId = subsite_id as string || 'default';
    
    // Check Gmail connection
    const gmailDocId = `${company_id}_${siteId}_${subsiteId}_gmail`;
    const gmailDoc = await firestore.collection('oauth_tokens').doc(gmailDocId).get();
    const gmailConnected = gmailDoc.exists && gmailDoc.data()?.tokens?.access_token;
    
    // Check Outlook connection
    const outlookDocId = `${company_id}_${siteId}_${subsiteId}_outlook`;
    const outlookDoc = await firestore.collection('oauth_tokens').doc(outlookDocId).get();
    const outlookConnected = outlookDoc.exists && outlookDoc.data()?.tokens?.access_token;

    res.json({
      gmail: {
        connected: gmailConnected,
        email: gmailDoc.data()?.email || null,
        connectedAt: gmailDoc.data()?.connectedAt || null
      },
      outlook: {
        connected: outlookConnected,
        email: outlookDoc.data()?.email || null,
        connectedAt: outlookDoc.data()?.connectedAt || null
      }
    });
  } catch (error) {
    console.error('Check OAuth status error:', error);
    res.status(500).json({ error: 'Failed to check OAuth status' });
  }
});

export const disconnectOAuth = onRequest(async (req, res) => {
  try {
    const { company_id, site_id, subsite_id, provider } = req.query;
    
    if (!company_id || !provider) {
      res.status(400).json({ error: 'Company ID and provider are required' });
      return;
    }

    const siteId = site_id as string || 'default';
    const subsiteId = subsite_id as string || 'default';
    const docId = `${company_id}_${siteId}_${subsiteId}_${provider}`;
    
    await firestore.collection('oauth_tokens').doc(docId).delete();
    
    res.json({ success: true, message: `${provider} account disconnected successfully` });
  } catch (error) {
    console.error('Disconnect OAuth error:', error);
    res.status(500).json({ error: 'Failed to disconnect OAuth account' });
  }
});
