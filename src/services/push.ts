// src/services/push.ts
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { Device } from "@capacitor/device";
import { apiPost } from "@/api";

let listenersReady = false;

export async function initPushAndRegister() {
  // Push real solo en Android/iOS (no web)
  const platform = Capacitor.getPlatform();
  if (platform === "web") return;

  // ✅ device_id real del dispositivo
  const { identifier } = await Device.getId();
  const device_id = identifier;

  // ✅ permisos
  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    console.log("Push permiso NO concedido");
    return;
  }

  // ✅ registra con APNs/FCM
  await PushNotifications.register();

  // ✅ evita listeners duplicados si llamas esto más de una vez (ej. logout/login)
  if (listenersReady) return;
  listenersReady = true;

  // ✅ Cuando entrega el token (FCM en Android)
  PushNotifications.addListener("registration", async (t) => {
    try {
      await apiPost("/devices/register", {
        token: t.value,       // el controller espera "token"
        platform,             // android / ios
        device_id,            // id real
      });
      console.log("✅ FCM token registrado en BD");
    } catch (e) {
      console.log("❌ Error registrando FCM token:", e);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.log("❌ Push registration error:", err);
  });

  // (Opcional) cuando llega una notificación en foreground
  PushNotifications.addListener("pushNotificationReceived", (notification) => {
    console.log("🔔 Push recibido:", notification);
  });

  // (Opcional) cuando el usuario toca la notificación
  PushNotifications.addListener("pushNotificationActionPerformed", (action) => {
    console.log("👉 Push action:", action);
  });
}