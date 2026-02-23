"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPayrollDetailSecure = exports.fetchPayrollSecure = exports.fetchPersonalSettingsSecure = exports.updatePersonalSettingsSecure = exports.deleteBankAccountSecure = exports.fetchBankAccountDetailSecure = exports.fetchBankAccountsSecure = exports.updateBankAccountSecure = exports.createBankAccountSecure = exports.fetchEmployeeDetailSecure = exports.fetchEmployeesSecure = exports.updateEmployeeSecure = exports.createEmployeeSecure = exports.getHMRCAuthUrl = exports.checkRTIStatus = exports.submitRTI = exports.refreshHMRCToken = exports.exchangeHMRCToken = exports.onAuthEventCreated = exports.cleanupExpiredLogs = exports.getAuthEvents = exports.logAuthEventPublic = exports.logAuthEvent = exports.sendEmailWithGmail = exports.sendTestEmail = exports.disconnectOAuth = exports.checkOAuthStatus = exports.oauthCallbackOutlook = exports.oauthOutlook = exports.oauthCallbackGmail = exports.oauthGoogle = void 0;
// Initialize admin first (lazy initialization)
require("./admin");
// Export all OAuth functions
var oauthGoogle_1 = require("./oauthGoogle");
Object.defineProperty(exports, "oauthGoogle", { enumerable: true, get: function () { return oauthGoogle_1.oauthGoogle; } });
Object.defineProperty(exports, "oauthCallbackGmail", { enumerable: true, get: function () { return oauthGoogle_1.oauthCallbackGmail; } });
var oauthOutlook_1 = require("./oauthOutlook");
Object.defineProperty(exports, "oauthOutlook", { enumerable: true, get: function () { return oauthOutlook_1.oauthOutlook; } });
Object.defineProperty(exports, "oauthCallbackOutlook", { enumerable: true, get: function () { return oauthOutlook_1.oauthCallbackOutlook; } });
var checkOAuthStatus_1 = require("./checkOAuthStatus");
Object.defineProperty(exports, "checkOAuthStatus", { enumerable: true, get: function () { return checkOAuthStatus_1.checkOAuthStatus; } });
Object.defineProperty(exports, "disconnectOAuth", { enumerable: true, get: function () { return checkOAuthStatus_1.disconnectOAuth; } });
var sendTestEmail_1 = require("./sendTestEmail");
Object.defineProperty(exports, "sendTestEmail", { enumerable: true, get: function () { return sendTestEmail_1.sendTestEmail; } });
var sendEmailWithGmail_1 = require("./sendEmailWithGmail");
Object.defineProperty(exports, "sendEmailWithGmail", { enumerable: true, get: function () { return sendEmailWithGmail_1.sendEmailWithGmail; } });
// Auth event logging (ISO 27001 A.12, SOC 2 CC7)
var logAuthEvent_1 = require("./logAuthEvent");
Object.defineProperty(exports, "logAuthEvent", { enumerable: true, get: function () { return logAuthEvent_1.logAuthEvent; } });
Object.defineProperty(exports, "logAuthEventPublic", { enumerable: true, get: function () { return logAuthEvent_1.logAuthEventPublic; } });
var getAuthEvents_1 = require("./getAuthEvents");
Object.defineProperty(exports, "getAuthEvents", { enumerable: true, get: function () { return getAuthEvents_1.getAuthEvents; } });
var cleanupExpiredLogs_1 = require("./cleanupExpiredLogs");
Object.defineProperty(exports, "cleanupExpiredLogs", { enumerable: true, get: function () { return cleanupExpiredLogs_1.cleanupExpiredLogs; } });
var alertSuspiciousActivity_1 = require("./alertSuspiciousActivity");
Object.defineProperty(exports, "onAuthEventCreated", { enumerable: true, get: function () { return alertSuspiciousActivity_1.onAuthEventCreated; } });
// HMRC OAuth (token exchange and refresh)
var hmrcOAuth_1 = require("./hmrcOAuth");
Object.defineProperty(exports, "exchangeHMRCToken", { enumerable: true, get: function () { return hmrcOAuth_1.exchangeHMRCToken; } });
Object.defineProperty(exports, "refreshHMRCToken", { enumerable: true, get: function () { return hmrcOAuth_1.refreshHMRCToken; } });
// HMRC RTI Submissions (server-side proxy for HMRC API)
// Required because HMRC APIs do not support CORS
var hmrcRTISubmission_1 = require("./hmrcRTISubmission");
Object.defineProperty(exports, "submitRTI", { enumerable: true, get: function () { return hmrcRTISubmission_1.submitRTI; } });
Object.defineProperty(exports, "checkRTIStatus", { enumerable: true, get: function () { return hmrcRTISubmission_1.checkRTIStatus; } });
Object.defineProperty(exports, "getHMRCAuthUrl", { enumerable: true, get: function () { return hmrcRTISubmission_1.getHMRCAuthUrl; } });
// Secure Functions - server-side encryption (Option B)
// All use withSecureGuard: auth → company access → role → handler
var hrSecure_1 = require("./hrSecure");
Object.defineProperty(exports, "createEmployeeSecure", { enumerable: true, get: function () { return hrSecure_1.createEmployeeSecure; } });
Object.defineProperty(exports, "updateEmployeeSecure", { enumerable: true, get: function () { return hrSecure_1.updateEmployeeSecure; } });
Object.defineProperty(exports, "fetchEmployeesSecure", { enumerable: true, get: function () { return hrSecure_1.fetchEmployeesSecure; } });
Object.defineProperty(exports, "fetchEmployeeDetailSecure", { enumerable: true, get: function () { return hrSecure_1.fetchEmployeeDetailSecure; } });
var financeSecure_1 = require("./financeSecure");
Object.defineProperty(exports, "createBankAccountSecure", { enumerable: true, get: function () { return financeSecure_1.createBankAccountSecure; } });
Object.defineProperty(exports, "updateBankAccountSecure", { enumerable: true, get: function () { return financeSecure_1.updateBankAccountSecure; } });
Object.defineProperty(exports, "fetchBankAccountsSecure", { enumerable: true, get: function () { return financeSecure_1.fetchBankAccountsSecure; } });
Object.defineProperty(exports, "fetchBankAccountDetailSecure", { enumerable: true, get: function () { return financeSecure_1.fetchBankAccountDetailSecure; } });
Object.defineProperty(exports, "deleteBankAccountSecure", { enumerable: true, get: function () { return financeSecure_1.deleteBankAccountSecure; } });
var settingsSecure_1 = require("./settingsSecure");
Object.defineProperty(exports, "updatePersonalSettingsSecure", { enumerable: true, get: function () { return settingsSecure_1.updatePersonalSettingsSecure; } });
Object.defineProperty(exports, "fetchPersonalSettingsSecure", { enumerable: true, get: function () { return settingsSecure_1.fetchPersonalSettingsSecure; } });
var payrollSecure_1 = require("./payrollSecure");
Object.defineProperty(exports, "fetchPayrollSecure", { enumerable: true, get: function () { return payrollSecure_1.fetchPayrollSecure; } });
Object.defineProperty(exports, "fetchPayrollDetailSecure", { enumerable: true, get: function () { return payrollSecure_1.fetchPayrollDetailSecure; } });
//# sourceMappingURL=index.js.map