# Architecture — Single Point of Failure Analysis

**Standards:** ISO 27001 A.17, SOC 2 Availability
**Date:** March 2026

---

## Architecture Overview

1Stop uses Firebase (Google Cloud) as its primary infrastructure platform. The application consists of:

- **Frontend:** React SPA deployed on Firebase Hosting / Vercel
- **Backend:** Firebase Cloud Functions (serverless)
- **Database:** Firebase Realtime Database
- **Storage:** Google Cloud Storage (backups, file uploads)
- **Authentication:** Firebase Authentication
- **Customer App (YourStop):** Next.js on Vercel + Express.js backend

---

## SPOF Analysis by Component

| Component | SPOF Risk | Mitigation | Residual Risk |
|-----------|-----------|------------|---------------|
| **Firebase Hosting** | Low | Google-managed CDN, multi-region by default | Google Cloud regional outage |
| **Vercel (YourStop)** | Low | Vercel edge network, multi-region | Vercel platform outage |
| **Cloud Functions** | Low | Auto-scaling, Google-managed; multiple instances | Regional outage if single-region |
| **Realtime Database** | Medium | Google-managed replication within region; single project | Single-region deployment (see below) |
| **Firebase Auth** | Low | Google-managed, globally distributed | Google Auth service outage (rare) |
| **Cloud Storage** | Low | Google-managed, multi-region option available | Depends on bucket location |
| **HMRC API** | External | Retry logic in `HMRCAPIClient.ts`; queued submissions | HMRC maintenance windows |
| **Stripe** | External | Webhook retry (Stripe handles); mock fallback in dev | Stripe outage |
| **DNS** | Low | Managed by registrar/Cloudflare | DNS provider outage |

---

## Key Risk: Firebase Realtime Database Region

**Current state:** The Firebase project runs in a single region. If that region experiences an outage, the database becomes unavailable.

**Mitigation options:**
1. **Multi-region database:** Firebase RTDB does not natively support multi-region. Consider Firestore (which supports multi-region) for new features.
2. **Automated backups:** `backupService.ts` creates regular backups to GCS. Cross-region GCS bucket can be configured.
3. **RTO/RPO documented:** `DISASTER_RECOVERY_PLAN.md` defines RTO 4h, RPO 24h.
4. **Risk acceptance:** For current scale, single-region with automated backups and documented DR is acceptable. Revisit when scaling to multi-region customers.

---

## Risk Acceptance Statement

The following residual risks are acknowledged:

1. **Single-region Firebase RTDB:** Accepted with automated backups (24h RPO, 4h RTO). To be revisited when business requires multi-region availability.
2. **External service dependencies (HMRC, Stripe):** Mitigated by retry logic, queued processing, and mock fallbacks for development. No control over third-party uptime.
3. **Single Firebase project for production:** Production and staging use separate Firebase projects (per CI/CD). Production project uses Google Cloud's SLA (99.95% for Cloud Functions).

---

## Recommendations

1. Enable **Google Cloud Storage multi-region** for backup buckets (if not already)
2. Configure **Cloud Monitoring uptime checks** (see `UPTIME_MONITORING_SETUP.md`)
3. Review this analysis annually or after significant infrastructure changes
4. Consider **Firestore** for new data models that require multi-region support

---

## References

- `DISASTER_RECOVERY_PLAN.md` — DR procedures, RTO/RPO targets
- `BACKUPS_RESILIENCE_AVAILABILITY_IMPLEMENTATION.md` — Backup architecture
- `docs/UPTIME_MONITORING_SETUP.md` — Monitoring configuration
- `functions/src/healthCheck.ts` — Health check implementation
