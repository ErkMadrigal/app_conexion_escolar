// src/services/device.ts
export function getOrCreateWebDeviceId(): string {
  const key = "web_device_id";
  const existing = localStorage.getItem(key);
  if (existing) return existing;

  const id =
    globalThis.crypto && "randomUUID" in globalThis.crypto
      ? (globalThis.crypto as any).randomUUID()
      : `web-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  localStorage.setItem(key, id);
  return id;
}