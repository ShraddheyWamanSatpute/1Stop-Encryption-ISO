import { onRequest } from 'firebase-functions/v2/https';
import { db } from './admin';
import * as nodemailer from 'nodemailer';
import { requireFirebaseAuthAndCompanyAccess } from './utils/verifyFirebaseAuth';

/**
 * Check if email is marketing-related (simple keyword detection)
 */
function isMarketingEmail(subject: string, body: string): boolean {
  const marketingKeywords = [
    'promotion', 'promo', 'offer', 'discount', 'sale', 'deal',
    'newsletter', 'subscribe', 'unsubscribe', 'marketing',
    'advertisement', 'ad', 'campaign', 'special', 'limited time',
    'exclusive', 'new product', 'announcement', 'event', 'webinar',
  ];
  const combined = `${subject.toLowerCase()} ${body.toLowerCase()}`;
  return marketingKeywords.some(keyword => combined.includes(keyword));
}

export const sendEmailWithGmail = onRequest({ cors: true }, async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, error: 'Method not allowed' });
    return;
  }

  try {
    const { recipientEmail, subject, body, companyId, siteId, subsiteId } = req.body;

    if (!recipientEmail || !subject || !body) {
      res.status(400).json({ 
        success: false, 
        error: 'recipientEmail, subject, and body are required' 
      });
      return;
    }

    if (!companyId) {
      res.status(400).json({ 
        success: false, 
        error: 'Company ID is required' 
      });
      return;
    }

    // Tenant verification: require auth + company access (ISO 27001 / SOC 2)
    const decoded = await requireFirebaseAuthAndCompanyAccess(req, res, companyId);
    if (!decoded) return;

    // Consent enforcement: Check marketing consent if email is marketing-related (GDPR Art. 6(1)(a))
    const isMarketing = isMarketingEmail(subject, body);
    if (isMarketing) {
      // Check consent for marketing emails
      const consentRef = db.ref(`compliance/consent/${companyId}`);
      const consentSnapshot = await consentRef
        .orderByChild('userId')
        .equalTo(decoded.uid)
        .once('value');
      
      let hasMarketingConsent = false;
      if (consentSnapshot.exists()) {
        consentSnapshot.forEach((child) => {
          const consent = child.val();
          if (
            consent.purpose === 'marketing' &&
            consent.consentGiven === true &&
            !consent.withdrawnTimestamp &&
            (!consent.expiresAt || consent.expiresAt > Date.now())
          ) {
            hasMarketingConsent = true;
          }
        });
      }

      if (!hasMarketingConsent) {
        res.status(403).json({
          success: false,
          error: 'Marketing consent required. Recipient must opt-in to marketing emails. Please check Settings → Preferences → Marketing Notifications.',
        });
        return;
      }
    }

    // Get email configuration from database
    const configPath = `companies/${companyId}/sites/${siteId || 'default'}/subsites/${subsiteId || 'default'}/emailConfig`;
    const configSnapshot = await db.ref(configPath).once('value');
    const emailConfig = configSnapshot.val();

    if (!emailConfig || !emailConfig.email || !emailConfig.appPassword) {
      res.status(404).json({ 
        success: false, 
        error: 'Email not configured. Please configure your Gmail and App Password in Bookings Settings.' 
      });
      return;
    }

    // Create transporter using Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: emailConfig.email,
        pass: emailConfig.appPassword
      }
    });

    // Send email
    const info = await transporter.sendMail({
      from: `"${emailConfig.senderName || '1Stop System'}" <${emailConfig.email}>`,
      to: recipientEmail,
      subject: subject,
      text: body,
      html: body.replace(/\n/g, '<br>')
    });

    console.log('Email sent:', info.messageId);

    res.status(200).json({ 
      success: true, 
      message: `Email sent successfully to ${recipientEmail}`,
      messageId: info.messageId
    });

  } catch (error) {
    console.error('Error sending email:', error);
    
    let errorMessage = 'Failed to send email';
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 'EAUTH') {
      errorMessage = 'Authentication failed. Please check your Gmail App Password.';
    } else if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    res.status(500).json({ 
      success: false, 
      error: errorMessage 
    });
  }
});

