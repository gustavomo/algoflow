export const ACCESS_COOKIE_NAME = 'algoflow_access';
const TOKEN_PURPOSE = 'algoflow-access-v1';

function toBase64Url(bytes: ArrayBuffer) {
  const binary = Array.from(new Uint8Array(bytes), (byte) =>
    String.fromCharCode(byte),
  ).join('');
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replaceAll('=', '');
}

export async function createAccessToken(secret: string) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(TOKEN_PURPOSE),
  );
  return toBase64Url(signature);
}

interface AccessEnvironment {
  NODE_ENV?: string;
  MOCK_ACCESS?: string;
  APP_ACCESS_CODE?: string;
}

export function isAccessBypassed(env: AccessEnvironment = process.env) {
  return (
    env.NODE_ENV !== 'production' &&
    (env.MOCK_ACCESS === '1' || !env.APP_ACCESS_CODE)
  );
}
