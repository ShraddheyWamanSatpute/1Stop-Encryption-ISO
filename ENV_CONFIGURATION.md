# Environment Configuration Guide

This document describes how to configure environment variables for the 1Stop application. All sensitive values must be provided via environment variables—**never hardcode credentials in source code**.

---

## Quick Start

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in your values in `.env` (see sections below).

3. Ensure `.env` is in `.gitignore` (it is by default—**never commit `.env`**).

---

## Main 1Stop App (Vite / Client-Side)

The main app uses Vite. Only variables prefixed with `VITE_` are exposed to the client. These are read by `src/config/keys.ts`.

### Required Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_FIREBASE_API_KEY` | Firebase Web API Key | Firebase Console → Project Settings → General |
| `VITE_FIREBASE_AUTH_DOMAIN` | Auth domain (e.g. `your-project.firebaseapp.com`) | Same as above |
| `VITE_FIREBASE_DATABASE_URL` | Realtime Database URL | Firebase Console → Realtime Database |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project ID | Firebase Console |
| `VITE_FIREBASE_STORAGE_BUCKET` | Storage bucket (e.g. `your-project.appspot.com`) | Firebase Console |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Cloud Messaging sender ID | Firebase Console |
| `VITE_FIREBASE_APP_ID` | Firebase app ID | Firebase Console |

### Optional Variables

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics measurement ID | Firebase Console |
| `VITE_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (for payments) | Stripe Dashboard → API Keys |

### Where Values Are Loaded

- **Local development:** Vite loads `.env` from the project root when you run `npm run dev` or `vite`.
- **Production build:** Set env vars in your CI/CD or hosting platform before the build step.
- **Docker:** Pass via `docker-compose` or build args.

---

## Deployment Platforms

### Vercel

Add variables in **Project Settings → Environment Variables**:
- Set each `VITE_*` variable.
- Ensure they are available for the build environment.

### Firebase Hosting

Use Firebase Hosting with a build step. Set env vars in your CI (e.g. GitHub Actions) before running the build:

```yaml
env:
  VITE_FIREBASE_API_KEY: ${{ secrets.VITE_FIREBASE_API_KEY }}
  VITE_FIREBASE_PROJECT_ID: ${{ secrets.VITE_FIREBASE_PROJECT_ID }}
  # ... etc
```

### Docker

In `docker-compose.yml`:

```yaml
main-app:
  build: .
  environment:
    - VITE_FIREBASE_API_KEY=${VITE_FIREBASE_API_KEY}
    - VITE_FIREBASE_PROJECT_ID=${VITE_FIREBASE_PROJECT_ID}
    # ... etc
```

Or use an `.env` file in the same directory as `docker-compose.yml` (Docker Compose loads it automatically).

---

## Firebase Functions (Server-Side)

Firebase Functions use **Firebase Secrets** for sensitive credentials (HMRC client ID/secret, encryption keys). See `functions/env.example` and:

- [HMRC_OAUTH_SECURITY.md](./HMRC_OAUTH_SECURITY.md)
- [DATA_SECURITY_ENCRYPTION_GUIDE.md](./DATA_SECURITY_ENCRYPTION_GUIDE.md)

---

## Compliance Notes (ISO 27001, SOC 2, PCI DSS)

- **No hardcoded secrets:** All config comes from env or secrets.
- **Secrets in vault:** Server-side secrets use Firebase Secrets (Google Cloud Secret Manager).
- **Client config:** Firebase client config (API key, project ID) is designed for client exposure and is restricted by Firebase security rules and domain restrictions. Still, it must be supplied via env, not hardcoded.

---

## Troubleshooting

### "Firebase project ID not configured"
Set `VITE_FIREBASE_PROJECT_ID` in `.env` and ensure the file is in the project root. Restart the dev server after changing `.env`.

### Firebase initialization fails
Verify all required `VITE_FIREBASE_*` variables are set. Check the browser console for specific errors.

### Values not updating after .env change
Vite loads `.env` at startup. Restart `npm run dev` after editing `.env`.
