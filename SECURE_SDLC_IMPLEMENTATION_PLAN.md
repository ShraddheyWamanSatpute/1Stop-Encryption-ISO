# Secure Development Practices (SDLC) – Implementation Plan

**Standards:** ISO 27001 A.14, SOC 2 CC8  
**Date:** Feb 2025  
**Focus:** Mandatory (risk reduction) first; optional later

---

## Current State Summary

| Control | Status | Notes |
|--------|--------|-------|
| Code reviews before merge | ⚠️ Informal | Branches used; no enforced PR review |
| Static analysis / linting in CI | ✅ Done | ESLint, `tsc --noEmit`, build in `.github/workflows/ci-cd.yml` |
| Dependency vulnerability scanning | ⚠️ Partial | `npm audit`, Snyk, OWASP in CI – but Snyk needs token; OWASP can be slow |
| Secrets scanning | ⚠️ Manual | `.gitignore` for `.env`; no automated scan in CI |
| Prod vs non-prod separation | ⚠️ Partial | Same DB; separate API creds (sandbox vs prod) |
| Feature flags for risky changes | ❌ None | Want gradual rollout (5% → monitor → full) |

---

## 1. Code Reviews Before Merge (Mandatory)

**Current:** Developers push to branches; plan to add review+approve later.  
**Gap:** No enforcement that someone else approves before merge.

**Action:** Enable branch protection in GitHub (no code change needed).

### Steps

1. Go to **GitHub → Repository → Settings → Branches**
2. Add branch protection rule for `main` (and optionally `develop`):
   - **Require a pull request before merging** ✓
   - **Require approvals** = 1 (or 2 for stricter)
   - **Dismiss stale pull request approvals when new commits are pushed** ✓
   - **Require status checks to pass** ✓ → select: `build` (or equivalent)
   - **Do not allow bypassing** (if you have admin access)

**Result:** Merges to main only via approved PR.

---

## 2. Static Analysis / Linting in CI (Already Done ✅)

**Current:** CI already runs:

- `npm run lint` (ESLint)
- `npx tsc --noEmit`
- `npm run build:main`

**Optional enhancement:** Add `functions/` to the pipeline:

```yaml
- name: Lint and build Firebase Functions
  run: |
    cd functions && npm ci && npm run build
```

---

## 3. Dependency Vulnerability Scanning (Mandatory – Simplify)

**Current:** CI has `npm audit`, Snyk, OWASP. Snyk needs `SNYK_TOKEN`; OWASP can be heavy.

**Recommendation:** Use **`npm audit` only** (no setup, native npm). Enforce failures on high/critical.

### Action

Update `.github/workflows/ci-cd.yml` security job:

- Remove or make optional: Snyk, OWASP (they need setup / can fail).
- Keep `npm audit` and make it **fail** the job on high/critical (drop `continue-on-error` for that step).
- Add `npm audit` for `functions/` too.

**Example change:**

```yaml
- name: Run npm audit (root)
  run: npm audit --audit-level=high

- name: Run npm audit (functions)
  run: cd functions && npm audit --audit-level=high
```

Remove `continue-on-error: true` on the audit step so high-severity issues block merge.

---

## 4. Secrets Scanning in Repos (Mandatory)

**Current:** `.gitignore` excludes `.env*`; you don’t commit keys.

**Gaps:**

- No automated scan in CI.
- GitHub secret scanning: check if it’s enabled (repo settings / org policy).
- No protection against accidental commits.

**Actions**

### 4a. Check GitHub Secret Scanning

- **Public repos:** GitHub secret scanning is usually on by default.
- **Private repos:** Check **Settings → Security → Code security and analysis**:
  - **Secret scanning** – enable if available.
  - **Push protection** – enable to block pushes that contain known secret patterns.

### 4b. Add Gitleaks to CI (Free, No Token)

Add a step to run [Gitleaks](https://github.com/gitleaks/gitleaks) in CI:

```yaml
- name: Gitleaks - Scan for secrets
  uses: gitleaks/gitleaks-action@v2
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

This scans commits for leaked secrets and fails the run if found.

---

## 5. Prod vs Non-Prod Separation (Known Limitation)

**Current:** Same Firebase DB and hosting; different API credentials (sandbox vs prod).

**Risk:** Dev/testing can affect production data; mistakes impact real users.

**Audit-friendly approach:**

1. **Document the decision** – e.g. in a short “Environment strategy” note:
   - Single DB due to cost/complexity.
   - Mitigations: separate API credentials, careful use of sandbox, credential rotation before prod.
2. **Plan a future split** – “We will introduce a separate staging DB when [trigger].”

For immediate compliance, documenting the risk and mitigations is often acceptable. A full dev DB can be a later phase.

---

## 6. Feature Flags for Risky Changes (Budget-Friendly)

**Current:** No formal feature flags; features gated by payment.

**Goal:** Deploy silently → enable for 5% → monitor → gradual rollout.

**Recommendation:** Use **Firebase Remote Config** (free tier):

- No extra cost.
- Already in Firebase ecosystem.
- Supports percentage rollout (e.g. 5% of users).
- Can target by user ID, custom claims, etc.

### Implementation Outline

1. Add Firebase Remote Config to the project.
2. Define feature flags, e.g. `new_risky_feature` (boolean) or `new_feature_rollout_percent` (0–100).
3. In the app, fetch config and gate the feature:

   ```ts
   const config = await getRemoteConfig().getValue('new_risky_feature');
   if (config.asBoolean()) { /* show feature */ }
   ```

4. In Firebase Console: start at 0% → 5% → 25% → 100% as you monitor.

**Alternative:** Simple env-based flags (`VITE_FEATURE_X=true`) – less flexible but zero setup.

---

## Implementation Priority

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 1 | Branch protection (code review) | ~10 min | High |
| 2 | npm audit enforced (no continue-on-error) | ~15 min | High |
| 3 | Gitleaks in CI | ~15 min | High |
| 4 | GitHub secret scanning (verify/enable) | ~5 min | High |
| 5 | npm audit for functions/ | ~5 min | Medium |
| 6 | Document prod/non-prod strategy | ~30 min | Medium (audit) |
| 7 | Firebase Remote Config for feature flags | 1–2 hrs | Medium |

---

## Checklist for Audit

After implementation, you can confirm:

- [ ] Code reviews required before merge (branch protection)
- [ ] Static analysis / linting in CI (ESLint, tsc, build)
- [ ] Dependency vulnerability scanning (npm audit, fails on high)
- [ ] Secrets scanning (Gitleaks in CI; GitHub secret scanning if available)
- [ ] Prod and non-prod strategy documented (DB shared by design, with mitigations)
- [ ] Feature flags available for risky changes (Firebase Remote Config)

---

## Next Step

Tell me which items you want implemented first. Recommended order:

1. **Branch protection** – you configure in GitHub; I can provide exact settings.
2. **CI updates** – enforce `npm audit`, add Gitleaks, add `functions/` audit.
3. **Documentation** – short environment strategy for prod/non-prod.
4. **Feature flags** – minimal Firebase Remote Config integration.
