// Initialize admin first (lazy initialization)
import './admin';

// Export all OAuth functions
export { oauthGoogle, oauthCallbackGmail } from './oauthGoogle';
export { oauthOutlook, oauthCallbackOutlook } from './oauthOutlook';
export { checkOAuthStatus, disconnectOAuth } from './checkOAuthStatus';
export { sendTestEmail } from './sendTestEmail';
export { sendEmailWithGmail } from './sendEmailWithGmail';

// Auth event logging (ISO 27001 A.12, SOC 2 CC7)
export { logAuthEvent, logAuthEventPublic } from './logAuthEvent';
export { getAuthEvents } from './getAuthEvents';
export { cleanupExpiredLogs } from './cleanupExpiredLogs';
export { gdprRetentionCleanup } from './gdprRetentionCleanup';
export { onAuthEventCreated } from './alertSuspiciousActivity';

// HMRC OAuth (token exchange and refresh)
export { exchangeHMRCToken, refreshHMRCToken } from './hmrcOAuth';

// HMRC RTI Submissions (server-side proxy for HMRC API)
// Required because HMRC APIs do not support CORS
export { submitRTI, checkRTIStatus, getHMRCAuthUrl } from './hmrcRTISubmission';

// Secure Functions - server-side encryption (Option B)
// All use withSecureGuard: auth → company access → role → handler
export {
  createEmployeeSecure,
  updateEmployeeSecure,
  fetchEmployeesSecure,
  fetchEmployeeDetailSecure,
} from './hrSecure';
export {
  createBankAccountSecure,
  updateBankAccountSecure,
  fetchBankAccountsSecure,
  fetchBankAccountDetailSecure,
  deleteBankAccountSecure,
} from './financeSecure';
export {
  updatePersonalSettingsSecure,
  fetchPersonalSettingsSecure,
} from './settingsSecure';
export {
  fetchPayrollSecure,
  fetchPayrollDetailSecure,
} from './payrollSecure';

// Backups, Resilience & Availability (ISO 27001 A.17, SOC 2 Availability)
export { dailyBackup } from './backupService';
export { backupRetentionCleanup } from './backupRetentionCleanup';
export { healthCheck, ping } from './healthCheck';
export { restoreFromBackup, listAvailableBackups } from './backupRestore';