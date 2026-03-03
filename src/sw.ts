/// <reference lib="webworker" />

// Workbox (injectManifest): esto permite que se inyecte el precache
import { precacheAndRoute, cleanupOutdatedCaches } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// ✅ Limpia caches viejos cuando actualizas
cleanupOutdatedCaches();

// ✅ Workbox inyecta aquí el precache (NO QUITAR)
precacheAndRoute(self.__WB_MANIFEST || []);

self.addEventListener("install", (event: ExtendableEvent) => {
  // activa SW nuevo sin esperar
  self.skipWaiting();
});

self.addEventListener("activate", (event: ExtendableEvent) => {
  // toma control inmediato
  event.waitUntil(self.clients.claim());
});

// Helpers
function safeParsePayload(event: PushEvent): any {
  // iOS/otros: a veces llega como json(), a veces text()
  try {
    if (event.data) {
      try {
        return event.data.json();
      } catch {
        const txt = event.data.text();
        try {
          return JSON.parse(txt);
        } catch {
          return { body: txt };
        }
      }
    }
  } catch {}
  return {};
}

function buildNotificationOptions(data: any) {
  const url = data?.url ?? "/";
  const extra = data?.data ?? {};

  return {
    body: data?.body ?? "",
    icon: data?.icon ?? "/pwa-192x192.png",
    badge: data?.badge ?? "/pwa-192x192.png",
    data: { url, ...extra },

    // ✅ evita duplicados si mandas el mismo id (opcional)
    tag: data?.tag ?? (data?.data?.asistencia_id ? `asistencia-${data.data.asistencia_id}` : undefined),
    renotify: !!data?.tag,

    // ✅ acciones opcionales (puedes mandar actions desde backend si quieres)
    actions: Array.isArray(data?.actions) ? data.actions : undefined,
  } as NotificationOptions;
}

self.addEventListener("push", (event: PushEvent) => {
  const data = safeParsePayload(event);

  const title = data?.title ?? "Conexión Escolar";
  const options = buildNotificationOptions(data);

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event: NotificationEvent) => {
  event.notification.close();

  const url = (event.notification?.data as any)?.url ?? "/";

  event.waitUntil(
    (async () => {
      const allClients = await self.clients.matchAll({
        type: "window",
        includeUncontrolled: true,
      });

      // 1) si ya hay una ventana abierta, enfocarla y navegar
      for (const client of allClients) {
        try {
          // @ts-ignore
          if ("focus" in client) await client.focus();
          // @ts-ignore
          if ("navigate" in client) {
            // @ts-ignore
            await client.navigate(url);
            return;
          }
        } catch {
          // si falla, seguimos
        }
      }

      // 2) si no hay, abrir una nueva
      await self.clients.openWindow(url);
    })()
  );
});

// (Opcional) si quieres reaccionar a botones de acción
self.addEventListener("notificationclose", () => {
  // aquí podrías loguear cierres si quieres
});