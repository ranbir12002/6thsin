// Minimal HS256 JWT sign/verify using Web Crypto (SubtleCrypto), which runs
// natively in the Workers runtime with no node:crypto shim required.
// Tokens produced here are standard JWTs and remain verifiable by the
// `jsonwebtoken` package used in the Express server, as long as JWT_SECRET matches.

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(str) {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/').padEnd(str.length + ((4 - (str.length % 4)) % 4), '=');
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function encodeJson(obj) {
  return bytesToBase64Url(encoder.encode(JSON.stringify(obj)));
}

async function importHmacKey(secret) {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Parses simple duration strings ("7d", "12h", "30m", "45s") into seconds.
 * Falls back to 7 days if unset/unparseable.
 */
export function parseExpiry(value) {
  if (!value) return 7 * 24 * 60 * 60;
  if (typeof value === 'number') return value;
  const match = /^(\d+)\s*(s|m|h|d)?$/i.exec(value.trim());
  if (!match) return 7 * 24 * 60 * 60;
  const amount = Number(match[1]);
  const unit = (match[2] || 's').toLowerCase();
  const multiplier = { s: 1, m: 60, h: 3600, d: 86400 }[unit];
  return amount * multiplier;
}

export async function signJwt(payload, secret, expiresIn) {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload = { ...payload, iat: now, exp: now + parseExpiry(expiresIn) };
  const data = `${encodeJson({ alg: 'HS256', typ: 'JWT' })}.${encodeJson(fullPayload)}`;
  const key = await importHmacKey(secret);
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return `${data}.${bytesToBase64Url(new Uint8Array(signature))}`;
}

export async function verifyJwt(token, secret) {
  const parts = typeof token === 'string' ? token.split('.') : [];
  if (parts.length !== 3) {
    const err = new Error('Malformed token');
    err.name = 'JsonWebTokenError';
    throw err;
  }
  const [encodedHeader, encodedPayload, encodedSignature] = parts;
  const key = await importHmacKey(secret);
  const valid = await crypto.subtle.verify(
    'HMAC',
    key,
    base64UrlToBytes(encodedSignature),
    encoder.encode(`${encodedHeader}.${encodedPayload}`)
  );
  if (!valid) {
    const err = new Error('Invalid signature');
    err.name = 'JsonWebTokenError';
    throw err;
  }

  const payload = JSON.parse(decoder.decode(base64UrlToBytes(encodedPayload)));
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
    const err = new Error('Token expired');
    err.name = 'TokenExpiredError';
    throw err;
  }
  return payload;
}
