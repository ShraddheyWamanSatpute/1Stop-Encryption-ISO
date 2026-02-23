"use strict";
/**
 * Encryption Service (Node.js / Firebase Functions)
 *
 * AES-256-GCM encryption for sensitive data at rest.
 * Matches client-side EncryptionService format for compatibility.
 *
 * Uses Node.js global crypto (available in Node 18+).
 * Keys from Firebase Secrets only - never from env or code.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.isEncryptedValue = exports.decryptWithMarker = exports.encryptWithMarker = exports.decrypt = exports.encrypt = void 0;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;
const ENCRYPTION_VERSION = 2;
const LEGACY_SALT = 'hmrc-compliance-salt-v1';
const ENCRYPTED_MARKER = 'ENC:';
/**
 * Encrypt plaintext with AES-256-GCM
 * Format (v2): [version(1)] + [salt(16)] + [IV(12)] + [ciphertext]
 */
async function encrypt(plaintext, key) {
    if (!plaintext || !key)
        throw new Error('Plaintext and key are required');
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const cryptoKey = await deriveKey(key, salt);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cryptoKey, encoder.encode(plaintext));
    const combined = new Uint8Array(1 + SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
    combined[0] = ENCRYPTION_VERSION;
    combined.set(salt, 1);
    combined.set(iv, 1 + SALT_LENGTH);
    combined.set(new Uint8Array(encrypted), 1 + SALT_LENGTH + IV_LENGTH);
    return Buffer.from(combined).toString('base64');
}
exports.encrypt = encrypt;
/**
 * Decrypt ciphertext - supports v2 and legacy v1 format
 */
async function decrypt(ciphertext, key) {
    if (!ciphertext || !key)
        throw new Error('Ciphertext and key are required');
    const combined = new Uint8Array(Buffer.from(ciphertext, 'base64'));
    const version = combined[0];
    if (version === ENCRYPTION_VERSION) {
        const salt = combined.slice(1, 1 + SALT_LENGTH);
        const iv = combined.slice(1 + SALT_LENGTH, 1 + SALT_LENGTH + IV_LENGTH);
        const encrypted = combined.slice(1 + SALT_LENGTH + IV_LENGTH);
        const cryptoKey = await deriveKey(key, salt);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);
        return new TextDecoder().decode(decrypted);
    }
    else {
        // Legacy v1
        const iv = combined.slice(0, IV_LENGTH);
        const encrypted = combined.slice(IV_LENGTH);
        const cryptoKey = await deriveKeyLegacy(key);
        const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, encrypted);
        return new TextDecoder().decode(decrypted);
    }
}
exports.decrypt = decrypt;
async function deriveKey(password, salt) {
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
    return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt']);
}
async function deriveKeyLegacy(password) {
    const salt = new TextEncoder().encode(LEGACY_SALT);
    return deriveKey(password, salt);
}
/**
 * Encrypt and add marker (for compatibility with client-side format)
 */
async function encryptWithMarker(plaintext, key) {
    const encrypted = await encrypt(plaintext, key);
    return `${ENCRYPTED_MARKER}${encrypted}`;
}
exports.encryptWithMarker = encryptWithMarker;
/**
 * Decrypt - handles both ENC: prefix and raw base64
 */
async function decryptWithMarker(value, key) {
    if (!value)
        return value;
    const ciphertext = value.startsWith(ENCRYPTED_MARKER)
        ? value.slice(ENCRYPTED_MARKER.length)
        : value.startsWith('__encrypted__')
            ? value.slice('__encrypted__'.length)
            : value;
    return decrypt(ciphertext, key);
}
exports.decryptWithMarker = decryptWithMarker;
function isEncryptedValue(value) {
    return typeof value === 'string' && (value.startsWith(ENCRYPTED_MARKER) || value.startsWith('__encrypted__'));
}
exports.isEncryptedValue = isEncryptedValue;
//# sourceMappingURL=EncryptionService.js.map