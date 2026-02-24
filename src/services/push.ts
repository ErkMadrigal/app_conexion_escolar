// src/services/push.ts
import { PushNotifications } from "@capacitor/push-notifications";
import { Capacitor } from "@capacitor/core";
import { apiPost } from "@/api";

export async function initPushAndRegister() {
  // Push real solo en Android/iOS (no web)
  const platform = Capacitor.getPlatform();
  if (platform === "web") return;

  let perm = await PushNotifications.checkPermissions();
  if (perm.receive !== "granted") {
    perm = await PushNotifications.requestPermissions();
  }
  if (perm.receive !== "granted") {
    console.log("Push permiso NO concedido");
    return;
  }

  await PushNotifications.register();

  // Cuando Firebase/Apple entrega el token
  PushNotifications.addListener("registration", async (token) => {
    try {
      // tu endpoint actual Devices::register espera { token, platform, device_id }
      await apiPost("/devices/register", {
        token: token.value,      // FCM token
        platform: platform,
        device_id: "ionic-capacitor",
      });
      console.log("✅ FCM token registrado en BD");
    } catch (e) {
      console.log("❌ Error registrando FCM token:", e);
    }
  });

  PushNotifications.addListener("registrationError", (err) => {
    console.log("❌ Push registration error:", err);
  });
}