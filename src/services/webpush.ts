// src/services/webpush.ts
import { apiPost } from "@/api";

type BackendResponse = any;

function getOrCreateWebDeviceId(): string {
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

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

async function getServiceWorkerRegistration() {
  if (!("serviceWorker" in navigator)) throw new Error("Service Worker no soportado");
  return navigator.serviceWorker.ready;
}

export async function canWebPush(): Promise<boolean> {
  return "Notification" in window && "serviceWorker" in navigator && "PushManager" in window;
}

/**
 * Detecta si está instalada como PWA (clave para iOS Push).
 * - iOS: navigator.standalone
 * - otros: display-mode: standalone
 */
export function isInstalledPwa(): boolean {
  const iosStandalone = (navigator as any).standalone === true;
  const displayModeStandalone =
    !!window.matchMedia && window.matchMedia("(display-mode: standalone)").matches;
  return iosStandalone || displayModeStandalone;
}

export async function getWebPushStatus(): Promise<{
  supported: boolean;
  installed?: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  subscription: PushSubscriptionJSON | null;
}> {
  const supported = await canWebPush();
  if (!supported) {
    return {
      supported: false,
      permission: "default",
      subscribed: false,
      subscription: null,
    };
  }

  const perm = Notification.permission;
  const reg = await getServiceWorkerRegistration();
  const sub = await reg.pushManager.getSubscription();

  return {
    supported: true,
    installed: isInstalledPwa(),
    permission: perm,
    subscribed: !!sub,
    subscription: sub ? sub.toJSON() : null,
  };
}

/**
 * iOS: Llama esto DESDE un click del usuario.
 *
 * Registra la subscription en el backend:
 * POST /api/push/register-webpush
 *
 * Body esperado:
 * {
 *   platform: "web" | "ios_pwa",
 *   device_id: "...",
 *   alumno_id: 123,
 *   tutor_id: 10,
 *   subscription: { endpoint, keys: {p256dh, auth} }
 * }
 */
export async function enableWebPush(params: {
  alumno_id: number;
  tutor_id?: number;
  platform?: string; // default "web" o "ios_pwa"
}): Promise<{ status: "ok"; subscription: PushSubscriptionJSON; backend: BackendResponse }> {
  if (!(await canWebPush())) throw new Error("Este navegador no soporta Web Push");

  const { alumno_id, tutor_id, platform } = params;

  if (!alumno_id || alumno_id <= 0) {
    throw new Error("alumno_id requerido para registrar Web Push");
  }

  const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY as string | undefined;
  if (!vapidPublicKey) throw new Error("Falta VITE_VAPID_PUBLIC_KEY en .env");

  // iOS exige que esto se dispare por un evento de usuario (click)
  const perm = await Notification.requestPermission();
  if (perm !== "granted") throw new Error("Permiso de notificación NO concedido");

  const reg = await getServiceWorkerRegistration();

  // Reusar si ya existe
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey),
    });
  }

  const device_id = getOrCreateWebDeviceId();
  const subscriptionJson = sub.toJSON();

  const backend = await apiPost("/api/push/register-webpush", {
    platform: platform ?? "web", // o "ios_pwa"
    device_id,
    alumno_id,
    tutor_id: tutor_id ?? null,
    subscription: subscriptionJson,
  });

  return { status: "ok", subscription: subscriptionJson, backend };
}

/**
 * Re-registra en backend usando la subscription actual (por si cambió endpoint/keys).
 * No pide permiso; solo funciona si ya está concedido y ya hay subscription.
 */
export async function refreshWebPushRegistration(params: {
  alumno_id: number;
  tutor_id?: number;
  platform?: string;
}): Promise<{ status: "ok"; subscription: PushSubscriptionJSON; backend: BackendResponse }> {
  if (!(await canWebPush())) throw new Error("Este navegador no soporta Web Push");

  const { alumno_id, tutor_id, platform } = params;

  if (!alumno_id || alumno_id <= 0) {
    throw new Error("alumno_id requerido para refrescar Web Push");
  }

  if (Notification.permission !== "granted") {
    throw new Error("Permiso no concedido (granted) para refrescar Web Push");
  }

  const reg = await getServiceWorkerRegistration();
  const sub = await reg.pushManager.getSubscription();

  if (!sub) {
    // si no hay sub, mejor usa enableWebPush desde click
    throw new Error("No hay subscription existente. Usa enableWebPush() desde un click.");
  }

  const device_id = getOrCreateWebDeviceId();
  const subscriptionJson = sub.toJSON();

  const backend = await apiPost("/api/push/register-webpush", {
    platform: platform ?? "web",
    device_id,
    alumno_id,
    tutor_id: tutor_id ?? null,
    subscription: subscriptionJson,
  });

  return { status: "ok", subscription: subscriptionJson, backend };
}

/**
 * Desuscribe del navegador.
 * Opcional: también podrías notificar al backend para marcar device como inactivo.
 */
export async function disableWebPush(): Promise<{ status: "ok"; removed: boolean }> {
  if (!("serviceWorker" in navigator)) return { status: "ok", removed: false };

  const reg = await getServiceWorkerRegistration();
  const sub = await reg.pushManager.getSubscription();
  if (!sub) return { status: "ok", removed: false };

  const ok = await sub.unsubscribe();
  return { status: "ok", removed: ok };
}