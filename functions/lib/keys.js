"use strict";
// Server-side centralized keys for Functions
// Prefer environment variables for secrets on Cloud Functions.
Object.defineProperty(exports, "__esModule", { value: true });
exports.FUNCTION_KEYS = void 0;
exports.FUNCTION_KEYS = {
    stripe: {
        secret: process.env.STRIPE_SECRET || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    mail: {
        provider: process.env.MAIL_PROVIDER || 'custom',
        from: process.env.MAIL_FROM || '',
        user: process.env.MAIL_USER || '',
        pass: process.env.MAIL_PASS || '',
        host: process.env.MAIL_HOST || '',
        port: Number(process.env.MAIL_PORT || 587),
        secure: String(process.env.MAIL_SECURE || 'false') === 'true',
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || '',
    },
    outlook: {
        clientId: process.env.OUTLOOK_CLIENT_ID || '',
        clientSecret: process.env.OUTLOOK_CLIENT_SECRET || '',
        redirectUri: process.env.OUTLOOK_REDIRECT_URI || '',
    }
};
exports.default = exports.FUNCTION_KEYS;
//# sourceMappingURL=keys.js.map