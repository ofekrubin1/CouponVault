// Face ID / fingerprint on opening the app, per person and device (optional). Uses the device's built-in
// biometric unlock through WebAuthn: a key is made on this device once, and opening the app asks the device to
// verify the person (Face ID, fingerprint or the phone's code). It's a privacy gate on this device, not a server
// login: the Google sign-in stays the real one. Settings live in this browser's storage, per user.

const KEY = (uid) => `cv-lock:${uid}`;
const ASKED = (uid) => `cv-lock-asked:${uid}`;

const read = (k) => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k, v) => {
  try {
    if (v === null) localStorage.removeItem(k);
    else localStorage.setItem(k, v);
  } catch {
    /* private mode: the lock simply isn't kept */
  }
};

const toB64 = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf)));
const fromB64 = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const challenge = () => crypto.getRandomValues(new Uint8Array(32));

/** Does this device have Face ID / fingerprint (a built-in authenticator that verifies the person)? */
export async function canUseBiometrics() {
  try {
    return !!window.PublicKeyCredential && (await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable());
  } catch {
    return false;
  }
}

export const lockEnabled = (uid) => !!read(KEY(uid));
export const wasOffered = (uid) => !!read(ASKED(uid));
export const markOffered = (uid) => write(ASKED(uid), '1');

/** Turn the lock on: the device makes a key for this person (it asks for Face ID / fingerprint once). Call from a tap. */
export async function enableLock(user) {
  const cred = await navigator.credentials.create({
    publicKey: {
      challenge: challenge(),
      rp: { name: 'CouponVault' },
      user: { id: new TextEncoder().encode(user.uid).slice(0, 64), name: user.email || user.uid, displayName: user.displayName || 'CouponVault' },
      pubKeyCredParams: [
        { type: 'public-key', alg: -7 },
        { type: 'public-key', alg: -257 },
      ],
      authenticatorSelection: { authenticatorAttachment: 'platform', userVerification: 'required', residentKey: 'discouraged' },
      attestation: 'none',
      timeout: 60_000,
    },
  });
  write(KEY(user.uid), toB64(cred.rawId));
  markOffered(user.uid);
}

/** Ask the device to verify the person. Resolves when it did; rejects when cancelled or not recognised. Call from a tap. */
export async function unlock(uid) {
  const id = read(KEY(uid));
  if (!id) return;
  await navigator.credentials.get({
    publicKey: { challenge: challenge(), allowCredentials: [{ type: 'public-key', id: fromB64(id) }], userVerification: 'required', timeout: 60_000 },
  });
}

export const disableLock = (uid) => write(KEY(uid), null);

/** On sign-out: forget this person's lock settings on this device. */
export function forgetLock(uid) {
  write(KEY(uid), null);
  write(ASKED(uid), null);
}
