/**
 * AES-256-CBC encryption/decryption for sensitive user fields.
 *
 * Format: "<16-byte IV in hex>:<encrypted data in hex>"
 * Each call to encrypt() generates a random IV — safe against frequency attacks.
 *
 * Detection: an encrypted value always matches /^[0-9a-f]{32}:[0-9a-f]+$/i
 * A plain string like "+57 3001234567" never matches this pattern.
 */
import crypto from 'crypto';
import { config } from '../config/env';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16; // AES block size

function getKey(): Buffer {
  const hex = config.encryptionKey;
  if (!hex || hex.length !== 64) {
    throw new Error('ENCRYPTION_KEY must be a 64-char hex string (32 bytes). Set it in .env');
  }
  return Buffer.from(hex, 'hex');
}

/** Returns true if the value looks like an AES-encrypted string. */
export function isEncrypted(value: string): boolean {
  return /^[0-9a-f]{32}:[0-9a-f]+$/i.test(value);
}

/** Encrypt a plaintext string. Returns an empty string if input is empty. */
export function encrypt(plaintext: string): string {
  if (!plaintext) return plaintext;
  if (isEncrypted(plaintext)) return plaintext; // already encrypted, skip
  const key = getKey();
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Decrypt an AES-encrypted string. Returns the value as-is if not encrypted. */
export function decrypt(value: string): string {
  if (!value) return value;
  if (!isEncrypted(value)) return value; // plaintext (not yet migrated), return as-is
  const [ivHex, encHex] = value.split(':');
  const key = getKey();
  const iv = Buffer.from(ivHex, 'hex');
  const encBuffer = Buffer.from(encHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  return Buffer.concat([decipher.update(encBuffer), decipher.final()]).toString('utf8');
}

/** Encrypt only if value is truthy, otherwise return null. */
export function encryptNullable(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return encrypt(value);
}

/** Decrypt only if value is truthy, otherwise return null/undefined. */
export function decryptNullable(value: string | null | undefined): string | null {
  if (value == null || value === '') return null;
  return decrypt(value);
}
