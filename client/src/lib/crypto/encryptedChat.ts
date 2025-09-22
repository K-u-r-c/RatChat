const KEY_STORAGE_PREFIX = "encrypted-chat-key:";

function textEncoder() {
  return new TextEncoder();
}

function textDecoder() {
  return new TextDecoder();
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

const AES_GCM_IV_LENGTH = 12;

async function encryptString(key: CryptoKey, plaintext: string) {
  const encoder = textEncoder();
  const data = encoder.encode(plaintext);
  const iv = crypto.getRandomValues(new Uint8Array(AES_GCM_IV_LENGTH));
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(encrypted), iv.length);
  return arrayBufferToBase64(combined.buffer);
}

async function decryptString(key: CryptoKey, payload: string) {
  const combined = new Uint8Array(base64ToArrayBuffer(payload));
  const iv = combined.slice(0, AES_GCM_IV_LENGTH);
  const ciphertextBytes = combined.slice(AES_GCM_IV_LENGTH);
  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertextBytes
  );
  return textDecoder().decode(decrypted);
}

export async function deriveChatKey(
  passphrase: string,
  chatId: string
): Promise<CryptoKey> {
  const passphraseBytes = textEncoder().encode(passphrase);
  const baseKey = await crypto.subtle.importKey(
    "raw",
    passphraseBytes,
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  const saltBytes = textEncoder().encode(chatId);

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: 120_000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToStorage(
  chatId: string,
  key: CryptoKey
): Promise<void> {
  const raw = await crypto.subtle.exportKey("raw", key);
  const base64 = arrayBufferToBase64(raw);
  localStorage.setItem(`${KEY_STORAGE_PREFIX}${chatId}`, base64);
}

export async function loadKeyFromStorage(
  chatId: string
): Promise<CryptoKey | null> {
  const stored = localStorage.getItem(`${KEY_STORAGE_PREFIX}${chatId}`);
  if (!stored) return null;
  try {
    const raw = base64ToArrayBuffer(stored);
    return crypto.subtle.importKey(
      "raw",
      raw,
      { name: "AES-GCM", length: 256 },
      true,
      ["encrypt", "decrypt"]
    );
  } catch {
    return null;
  }
}

export function clearStoredKey(chatId: string) {
  localStorage.removeItem(`${KEY_STORAGE_PREFIX}${chatId}`);
}

export async function encryptMessagePayload(
  key: CryptoKey,
  plaintext: string,
  metadataPlaintext?: string
): Promise<{ cipherText: string; metadata?: string }> {
  const cipherText = await encryptString(key, plaintext);
  let metadata: string | undefined;
  if (typeof metadataPlaintext === "string") {
    metadata = await encryptString(key, metadataPlaintext);
  }
  return { cipherText, metadata };
}

export async function decryptMessagePayload(
  key: CryptoKey,
  cipherText: string
): Promise<string> {
  return decryptString(key, cipherText);
}

export async function decryptMessageMetadata(
  key: CryptoKey,
  cipherTextMetadata: string
): Promise<string> {
  return decryptString(key, cipherTextMetadata);
}
