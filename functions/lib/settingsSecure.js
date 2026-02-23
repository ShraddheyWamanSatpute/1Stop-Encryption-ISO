"use strict";
/**
 * Settings Secure Functions
 *
 * Server-side encryption for user personal settings (bank details, NI, tax code).
 * Uses withUserScopedGuard - user can ONLY access their own settings.
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.fetchPersonalSettingsSecure = exports.updatePersonalSettingsSecure = void 0;
const params_1 = require("firebase-functions/params");
const admin = __importStar(require("firebase-admin"));
const secureRequestGuard_1 = require("./guards/secureRequestGuard");
const SensitiveDataService_1 = require("./encryption/SensitiveDataService");
const db = admin.database();
const userSettingsKey = (0, params_1.defineSecret)('USER_SETTINGS_KEY');
exports.updatePersonalSettingsSecure = (0, secureRequestGuard_1.withUserScopedGuard)(userSettingsKey, async (data, _context, encryptionKey) => {
    const { uid, personalSettings } = data;
    if (!uid || !personalSettings)
        throw new Error('uid and personalSettings required');
    const encrypted = await (0, SensitiveDataService_1.encryptUserPersonalData)(personalSettings, encryptionKey);
    const ref = db.ref(`users/${uid}/settings/personal`);
    await ref.update(encrypted);
    return { success: true };
}, { domain: 'SETTINGS', uidParamKey: 'uid' });
exports.fetchPersonalSettingsSecure = (0, secureRequestGuard_1.withUserScopedGuard)(userSettingsKey, async (data, _context, encryptionKey) => {
    const { uid } = data;
    if (!uid)
        throw new Error('uid required');
    const ref = db.ref(`users/${uid}/settings/personal`);
    const snapshot = await ref.once('value');
    const raw = snapshot.val();
    if (!raw)
        return {};
    const decrypted = await (0, SensitiveDataService_1.decryptUserPersonalData)(raw, encryptionKey);
    return decrypted;
}, { domain: 'SETTINGS', uidParamKey: 'uid' });
//# sourceMappingURL=settingsSecure.js.map