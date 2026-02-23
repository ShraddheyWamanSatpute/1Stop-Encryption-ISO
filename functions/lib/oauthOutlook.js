"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.oauthCallbackOutlook = exports.oauthOutlook = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("./admin");
exports.oauthOutlook = (0, https_1.onRequest)(async (req, res) => {
    try {
        // Get OAuth credentials from environment variables
        const clientId = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
        const redirectUri = `${req.protocol}://${req.get('host')}/oauthCallbackOutlook`;
        const authUrl = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?` +
            `client_id=${clientId}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent('https://graph.microsoft.com/Mail.Send')}&` +
            `response_type=code&` +
            `response_mode=query&` +
            `state=outlook_oauth_${Date.now()}&` +
            `prompt=consent`;
        res.redirect(authUrl);
    }
    catch (error) {
        console.error('Outlook OAuth error:', error);
        res.status(500).send('OAuth initialization failed');
    }
});
exports.oauthCallbackOutlook = (0, https_1.onRequest)(async (req, res) => {
    try {
        const { code, state, error } = req.query;
        const returnPath = req.query.return_path || '/bookings/settings';
        if (error) {
            console.error('Outlook OAuth error:', error);
            res.redirect(`${returnPath}?error=oauth_failed&message=${encodeURIComponent(error)}`);
            return;
        }
        if (!code || !state) {
            res.redirect(`${returnPath}?error=missing_parameters`);
            return;
        }
        // Get OAuth credentials
        const clientId = process.env.MICROSOFT_CLIENT_ID || 'your-microsoft-client-id';
        const clientSecret = process.env.MICROSOFT_CLIENT_SECRET || 'your-microsoft-client-secret';
        const redirectUri = `${req.protocol}://${req.get('host')}/oauthCallbackOutlook`;
        // Exchange code for tokens using Microsoft Graph API
        const tokenResponse = await fetch('https://login.microsoftonline.com/common/oauth2/v2.0/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                client_id: clientId,
                client_secret: clientSecret,
                code: code,
                redirect_uri: redirectUri,
                grant_type: 'authorization_code',
                scope: 'https://graph.microsoft.com/Mail.Send'
            })
        });
        if (!tokenResponse.ok) {
            throw new Error('Failed to exchange code for tokens');
        }
        const tokens = await tokenResponse.json();
        // Get user info from Microsoft Graph
        const userResponse = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${tokens.access_token}`
            }
        });
        if (!userResponse.ok) {
            throw new Error('Failed to get user info');
        }
        const userInfo = await userResponse.json();
        // Get company/site/subsite context from request headers or query params
        const companyId = req.headers['x-company-id'] || req.query.company_id;
        const siteId = req.headers['x-site-id'] || req.query.site_id;
        const subsiteId = req.headers['x-subsite-id'] || req.query.subsite_id;
        const userId = req.headers['x-user-id'] || req.query.user_id;
        if (!companyId) {
            throw new Error('Company ID is required for OAuth token storage');
        }
        // Store tokens in Firestore with proper company/site/subsite association
        const tokenDocId = `${companyId}_${siteId || 'default'}_${subsiteId || 'default'}_outlook`;
        await admin_1.firestore.collection('oauth_tokens').doc(tokenDocId).set({
            provider: 'outlook',
            email: userInfo.mail || userInfo.userPrincipalName,
            tokens: tokens,
            companyId: companyId,
            siteId: siteId || 'default',
            subsiteId: subsiteId || 'default',
            userId: userId || 'anonymous',
            connectedAt: new Date(),
            lastUsed: new Date()
        });
        // Redirect back to settings with success
        res.redirect(`${returnPath}?success=true&provider=outlook&email=${encodeURIComponent(userInfo.mail || userInfo.userPrincipalName || '')}`);
    }
    catch (error) {
        console.error('Outlook OAuth callback error:', error);
        const returnPath = req.query.return_path || '/bookings/settings';
        res.redirect(`${returnPath}?error=oauth_callback_failed`);
    }
});
//# sourceMappingURL=oauthOutlook.js.map