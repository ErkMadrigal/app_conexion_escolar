// src/services/push.ts
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { apiPost } from "@/api";
import { enableWebPush } from "@/services/webpush";

let listenersReady = false;

export async function initPushAndRegister() {
  const platform = Capacitor.getPlatform();
  // ✅ En web (PWA), el push es Web Push (no Capacitor PushNotifications)
  if (platform === "web") return;

  // ✅ device_id real del dispositivo
  const { identifier } = await Device.getId();
  const device_id = identifier;

  // ✅ permisos PUSH
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    console.log("Push permiso NO concedido");
    return;
  }

  // ✅ permisos LOCAL (para mostrar notificación cuando está en foreground)
  const localPerm = await LocalNotifications.requestPermissions();
  if (localPerm.display !== "granted") {
    console.log("LocalNotifications permiso NO concedido");
  }

  // ✅ registra con FCM/APNs
  await PushNotifications.register();

  // ✅ evita listeners duplicados si llamas esto más de una vez
  if (listenersReady) return;
  listenersReady = true;

  // ✅ Token FCM entregado
  PushNotifications.addListener("registration", async (t) => {
    try {
      await apiPost("/devices/register", {
        token: t.value,
        platform,
        device_id,
      });
      console.log("✅ FCM token registrado en BD");
    } catch (e) {
      console.log("❌ Error registrando FCM token:", e);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.log("❌ Push registration error:", err);
  });

  // ✅ Cuando llega una notificación en FOREGROUND (app abierta)
  PushNotifications.addListener("pushNotificationReceived", async (notification) => {
    console.log("🔔 Push recibido:", notification);

    const title =
      (notification as any)?.title ||
      (notification as any)?.notification?.title ||
      "Conexión Escolar";

    const body =
      (notification as any)?.body ||
      (notification as any)?.notification?.body ||
      "";

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title,
            body,
            extra: (notification as any)?.data || {},
          },
        ],
      });
    } catch (e) {
      console.log("❌ Error mostrando LocalNotification:", e);
    }
  });

  // ✅ Cuando el usuario toca la notificación (push o local)
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("👉 Push action:", action);
  });

  // ✅ Cuando el usuario toca una LOCAL notification
  LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
    console.log("👉 Local action:", event);
  });
}

// ✅ Para PWA (iPhone): llama esto desde un botón 'Activar notificaciones'
export async function enablePwaPush(alumno_id: number, tutor_id?: number) {
  return enableWebPush({
    alumno_id,
    tutor_id,
    platform: "ios_pwa",
  });
}