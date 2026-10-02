import { randomBytes, randomUUID } from 'crypto';

/**
 * Generates a short, readable, URL-friendly room ID (e.g., 'wp-9f82ab').
 */
export function generateRoomId(): string {
  const chars = '23456789abcdefghjkmnpqrstuvwxyz'; // Removed ambiguous characters (0, O, 1, l, i)
  let code = '';
  const bytes = randomBytes(6);
  for (let i = 0; i < 6; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return `party-${code}`;
}

/**
 * Generates a unique participant ID.
 */
export function generateUserId(): string {
  return `usr_${randomUUID().replace(/-/g, '').slice(0, 12)}`;
}
