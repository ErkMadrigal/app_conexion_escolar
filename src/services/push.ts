// src/services/push.ts
import { PushNotifications } from "@capacitor/push-notifications";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { apiPost } from "@/api";

let listenersReady = false;

export async function initPushAndRegister() {
  const platform = Capacitor.getPlatform();
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
  // En Android 13+ también lo pide.
  const localPerm = await LocalNotifications.requestPermissions();
  if (localPerm.display !== "granted") {
    console.log("LocalNotifications permiso NO concedido");
    // no hacemos return, porque en background igual pueden llegar las push del sistema
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

    // ⚠️ En foreground a veces NO se muestra banner del sistema.
    // ✅ Forzamos una notificación LOCAL con title/body.
    const title =
      (notification as any)?.title ||
      (notification as any)?.notification?.title ||
      "Conexión Escolar";

    const body =
      (notification as any)?.body ||
      (notification as any)?.notification?.body ||
      "";

    // Si viene vacío, al menos no truena
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now() % 2147483647,
            title,
            body,
            // data extra para navegar después si quieres
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
    // action.notification.data -> aquí puedes navegar por tipo/alumno_id/asistencia_id
  });

  // ✅ Cuando el usuario toca una LOCAL notification
  LocalNotifications.addListener("localNotificationActionPerformed", (event) => {
    console.log("👉 Local action:", event);
    // event.notification.extra -> navegar
  });
}