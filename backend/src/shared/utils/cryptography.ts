import crypto from 'crypto';
import { env } from '../../infra/config/configs';

const ALGORITHM = 'aes-256-cbc';
const IV_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * Validates and prepares the encryption key.
 */
function getEncryptionKey(): Buffer {
  // Use type assertion since we know it exists after our configs.ts update
  const security = (env as any).security;
  const rawKey = security?.encryptionKey || process.env.ENCRYPTION_KEY;

  if (!rawKey) {
    if (env.isProduction()) {
      throw new Error('FATAL: ENCRYPTION_KEY is not defined in production environment.');
    }
    return crypto.createHash('sha256').update('DEVELOPMENT_FALLBACK_KEY_SECURE').digest();
  }

  return crypto.createHash('sha256').update(rawKey).digest();
}

/**
 * Encrypts a string using AES-256-CBC.
 */
export function encrypt(text: string | null | undefined): string {
  if (text === null || text === undefined || text === '') return '';

  const iv = crypto.randomBytes(IV_LENGTH);
  const key = getEncryptionKey();
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return `${iv.toString('hex')}:${encrypted}`;
}

/**
 * Decrypts a string using AES-256-CBC.
 */
export function decrypt(encryptedText: string | null | undefined): string {
  if (!encryptedText) return '';
  if (!encryptedText.includes(':')) {
    return encryptedText;
  }

  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 2) return encryptedText;

    const ivHex = parts[0];
    const encryptedData = parts[1];

    if (!ivHex || !encryptedData) return encryptedText;

    const iv = Buffer.from(ivHex, 'hex');
    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    console.error('Decryption failed:', error);
    return encryptedText;
  }
}
