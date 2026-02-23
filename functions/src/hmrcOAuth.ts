import { onRequest } from 'firebase-functions/v2/https';
import { defineSecret } from 'firebase-functions/params';
import { requireFirebaseAuth } from './utils/verifyFirebaseAuth';

// Define Firebase Secrets
const hmrcClientId = defineSecret('HMRC_CLIENT_ID');
const hmrcClientSecret = defineSecret('HMRC_CLIENT_SECRET');

interface HMRCTokenExchangeRequest {
  code: string;
  redirectUri: string;
  environment: 'sandbox' | 'production';
}

interface HMRCRefreshTokenRequest {
  refreshToken: string;
  environment: 'sandbox' | 'production';
}

interface HMRCTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
}

/**
 * Exchange HMRC OAuth authorization code for tokens
 * This must be done server-side because HMRC's token endpoint doesn't support CORS
 * SECURITY: Credentials are stored in Firebase Secrets, never accepted from client
 */
export const exchangeHMRCToken = onRequest(
  {
    cors: true,
    secrets: [hmrcClientId, hmrcClientSecret],
  },
  async (req, res) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed. Use POST.' });
      return;
    }

    // SECURITY: Verify Firebase ID token - only authenticated users can exchange OAuth codes
    const decoded = await requireFirebaseAuth(req, res);
    if (!decoded) return;

      // SECURITY: Reject any request containing credentials
      if (req.body.clientId || req.body.clientSecret) {
        console.error('SECURITY VIOLATION: Client attempted to send credentials');
        res.status(400).json({
          error: 'Security violation',
          message: 'Client must not send credentials. Credentials are stored server-side only.',
        });
        return;
      }

      const { code, redirectUri, environment = 'sandbox' }: HMRCTokenExchangeRequest = req.body;

      // Get credentials from Firebase Secrets
      const clientId = hmrcClientId.value();
      const clientSecret = hmrcClientSecret.value();

      // Validate secrets are configured
      if (!clientId || !clientSecret) {
        console.error('HMRC credentials not configured in Firebase Secrets');
        res.status(500).json({
          error: 'Configuration error',
          message: 'HMRC OAuth credentials are not configured on the server. Please contact the platform administrator.',
        });
        return;
      }

      // Debug logging (don't log actual secrets)
      console.log('Exchange request received:', {
        hasCode: !!code,
        hasRedirectUri: !!redirectUri,
        hasClientIdFromSecret: !!clientId,
        hasClientSecretFromSecret: !!clientSecret,
        environment
      });

      // Validate required fields
      if (!code || !redirectUri) {
        const missingFields = [];
        if (!code) missingFields.push('code');
        if (!redirectUri) missingFields.push('redirectUri');
        
        console.error('Missing required fields:', missingFields);
        res.status(400).json({ 
          error: 'Missing required fields',
          message: `Missing required fields: ${missingFields.join(', ')}`,
          required: ['code', 'redirectUri'],
          missing: missingFields
        });
        return;
      }

      // Determine base URL based on environment
      const baseUrl = environment === 'sandbox'
        ? 'https://test-api.service.hmrc.gov.uk'
        : 'https://api.service.hmrc.gov.uk';

      const tokenUrl = `${baseUrl}/oauth/token`;

      // Exchange code for tokens
      // HMRC OAuth uses Basic Auth with client_id:client_secret encoded in base64
      // Some OAuth providers require both Basic Auth AND client credentials in the body
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code: code,
          redirect_uri: redirectUri
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'unknown_error', error_description: errorText || response.statusText };
        }

        console.error('HMRC token exchange error:', errorData);
        res.status(response.status).json({
          error: 'HMRC token exchange failed',
          message: errorData.error_description || errorData.error || response.statusText,
          details: errorData
        });
        return;
      }

      const tokenData: HMRCTokenResponse = await response.json();

      // Return tokens to client (client will store them)
      res.status(200).json({
        success: true,
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope
        }
      });
    } catch (error) {
      console.error('Error in exchangeHMRCToken:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      res.status(500).json({
        error: 'Internal server error',
        message: errorMessage
      });
    }
  }
);

/**
 * Refresh HMRC OAuth access token using refresh token
 * SECURITY: Credentials are stored in Firebase Secrets, never accepted from client
 */
export const refreshHMRCToken = onRequest(
  {
    cors: true,
    secrets: [hmrcClientId, hmrcClientSecret],
  },
  async (req, res) => {
    try {
      // Only allow POST requests
      if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed. Use POST.' });
        return;
      }

      // SECURITY: Verify Firebase ID token - only authenticated users can refresh HMRC tokens
      const decoded = await requireFirebaseAuth(req, res);
      if (!decoded) return;

      // SECURITY: Reject any request containing credentials
      if (req.body.clientId || req.body.clientSecret) {
        console.error('SECURITY VIOLATION: Client attempted to send credentials');
        res.status(400).json({
          error: 'Security violation',
          message: 'Client must not send credentials. Credentials are stored server-side only.',
        });
        return;
      }

      const { refreshToken, environment = 'sandbox' }: HMRCRefreshTokenRequest = req.body;

      // Get credentials from Firebase Secrets
      const clientId = hmrcClientId.value();
      const clientSecret = hmrcClientSecret.value();

      // Validate secrets are configured
      if (!clientId || !clientSecret) {
        console.error('HMRC credentials not configured in Firebase Secrets');
        res.status(500).json({
          error: 'Configuration error',
          message: 'HMRC OAuth credentials are not configured on the server. Please contact the platform administrator.',
        });
        return;
      }

      // Validate required fields
      if (!refreshToken) {
        res.status(400).json({
          error: 'Missing required fields',
          message: 'Missing required field: refreshToken',
          required: ['refreshToken'],
        });
        return;
      }

      // Determine base URL based on environment
      const baseUrl = environment === 'sandbox'
        ? 'https://test-api.service.hmrc.gov.uk'
        : 'https://api.service.hmrc.gov.uk';

      const tokenUrl = `${baseUrl}/oauth/token`;

      // Refresh token
      const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
      
      const response = await fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`,
          'Accept': 'application/json'
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        }).toString()
      });

      if (!response.ok) {
        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { error: 'unknown_error', error_description: errorText || response.statusText };
        }

        console.error('HMRC token refresh error:', errorData);
        res.status(response.status).json({
          error: 'HMRC token refresh failed',
          message: errorData.error_description || errorData.error || response.statusText,
          details: errorData
        });
        return;
      }

      const tokenData: HMRCTokenResponse = await response.json();

      // Return new tokens to client
      res.status(200).json({
        success: true,
        tokens: {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          token_type: tokenData.token_type,
          scope: tokenData.scope
        }
      });
    } catch (error) {
      console.error('Error in refreshHMRCToken:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      res.status(500).json({
        error: 'Internal server error',
        message: errorMessage
      });
    }
  }
);
