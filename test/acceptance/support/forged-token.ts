import { createSign, generateKeyPairSync } from 'crypto';

const base64url = (value: object): string => Buffer.from(JSON.stringify(value)).toString('base64url');

/**
 * A token that looks right in every way but its signature: RS256, the expected
 * issuer, not expired, and signed by a key made here and thrown away.
 */
export function forgedToken(): string {
  const { privateKey, } = generateKeyPairSync('rsa', { modulusLength: 2048, });

  const header = base64url({ alg: 'RS256', typ: 'JWT', });
  const payload = base64url({
    sessionId: 'forged',
    userId: 'forged',
    username: 'forged',
    iss: 'feral-auth',
    exp: Math.floor(Date.now() / 1000) + 600,
  });
  const signature = createSign('RSA-SHA256').update(`${header}.${payload}`).sign(privateKey, 'base64url');

  return `${header}.${payload}.${signature}`;
}
