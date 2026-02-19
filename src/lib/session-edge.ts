type TokenPayload = {
  userId: string;
  exp: number;
};

function getSessionSecret() {
  return process.env.AUTH_SESSION_SECRET ?? 'dev-session-secret-change-me';
}

function encodeUtf8(value: string) {
  return new TextEncoder().encode(value);
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

async function signPayload(encodedPayload: string) {
  const secretKey = await crypto.subtle.importKey(
    'raw',
    encodeUtf8(getSessionSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', secretKey, encodeUtf8(encodedPayload));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function getUserIdFromAuthTokenEdge(token: string | undefined) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split('.');
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signPayload(encodedPayload);
  if (expectedSignature !== signature) return null;

  try {
    const payloadBytes = base64UrlToBytes(encodedPayload);
    const parsed = JSON.parse(new TextDecoder().decode(payloadBytes)) as TokenPayload;

    if (!parsed.userId || !parsed.exp) {
      return null;
    }

    const now = Math.floor(Date.now() / 1000);
    if (parsed.exp <= now) {
      return null;
    }

    return parsed.userId;
  } catch {
    return null;
  }
}
