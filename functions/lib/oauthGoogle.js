"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthCallbackGmail = exports.oauthGoogle = void 0;
const https_1 = require("firebase-functions/v2/https");
const googleapis_1 = require("googleapis");
const admin_1 = require("./admin");
exports.oauthGoogle = (0, https_1.onRequest)(async (req, res) => {
    try {
        // Get OAuth credentials from environment variables
        const clientId = process.env.GOOGLE_CLIENT_ID || '';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        const redirectUri = `${req.protocol}://${req.get('host')}/oauthCallbackGmail`;
        console.log('OAuth Google function called with:', { clientId, redirectUri });
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: ['https://www.googleapis.com/auth/gmail.send'],
            state: `gmail_oauth_${Date.now()}`,
            prompt: 'consent'
        });
        res.redirect(authUrl);
    }
    catch (error) {
        console.error('Gmail OAuth error:', error);
        res.status(500).send('OAuth initialization failed');
    }
});
exports.oauthCallbackGmail = (0, https_1.onRequest)(async (req, res) => {
    try {
        const { code, state, error } = req.query;
        const returnPath = req.query.return_path || '/bookings/settings';
        if (error) {
            console.error('Gmail OAuth error:', error);
            res.redirect(`${returnPath}?error=oauth_failed&message=${encodeURIComponent(error)}`);
            return;
        }
        if (!code || !state) {
            res.redirect(`${returnPath}?error=missing_parameters`);
            return;
        }
        // Get OAuth credentials from environment variables
        const clientId = process.env.GOOGLE_CLIENT_ID || '';
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
        const redirectUri = `${req.protocol}://${req.get('host')}/oauthCallbackGmail`;
        const oauth2Client = new googleapis_1.google.auth.OAuth2(clientId, clientSecret, redirectUri);
        // Exchange code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        oauth2Client.setCredentials(tokens);
        // Get user info
        const oauth2 = googleapis_1.google.oauth2({ version: 'v2', auth: oauth2Client });
        const userInfo = await oauth2.userinfo.get();
        // Get company/site/subsite context from request headers or query params
        const companyId = req.headers['x-company-id'] || req.query.company_id;
        const siteId = req.headers['x-site-id'] || req.query.site_id;
        const subsiteId = req.headers['x-subsite-id'] || req.query.subsite_id;
        const userId = req.headers['x-user-id'] || req.query.user_id;
        if (!companyId) {
            throw new Error('Company ID is required for OAuth token storage');
        }
        // Store tokens in Firestore with proper company/site/subsite association
        const tokenDocId = `${companyId}_${siteId || 'default'}_${subsiteId || 'default'}_gmail`;
        await admin_1.firestore.collection('oauth_tokens').doc(tokenDocId).set({
            provider: 'gmail',
            email: userInfo.data.email,
            tokens: tokens,
            companyId: companyId,
            siteId: siteId || 'default',
            subsiteId: subsiteId || 'default',
            userId: userId || 'anonymous',
            connectedAt: new Date(),
            lastUsed: new Date()
        });
        // Redirect back to settings with success
        res.redirect(`${returnPath}?success=true&provider=gmail&email=${encodeURIComponent(userInfo.data.email || '')}`);
    }
    catch (error) {
        console.error('Gmail OAuth callback error:', error);
        const returnPath = req.query.return_path || '/bookings/settings';
        res.redirect(`${returnPath}?error=oauth_callback_failed`);
    }
});
//# sourceMappingURL=oauthGoogle.js.map