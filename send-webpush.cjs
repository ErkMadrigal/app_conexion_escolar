const webpush = require("web-push");

const VAPID_PUBLIC_KEY =
  "BF79wIXKxdXQdrElsq02AMNomc6DPvzH6X1dzxgfmMQoucFkcR8HTuTbBV0YXaArcwVkKwKSDBovmv1Dm99w7Zw";

const VAPID_PRIVATE_KEY =
  "Z9D6LroSF3jyrxQ5Jf7Kbfjt40hs13opsPgbFlw3PbU";

const subscription = {
  endpoint:
    "https://fcm.googleapis.com/fcm/send/ck6gPQcWLJM:APA91bEDAtMdOeOfM6_GPb-j5RMA1RhUyUr6C1RKqer9MFizzNBs1qHer8mDHZNXlmkRjolOkdyzNFgzSWlyUtsmAwvgteg08g4x66U62AIK7FMGkcVlhhHj4UXcX1Qp3fiUHmmxsif9",
  expirationTime: null,
  keys: {
    p256dh:
      "BFd2Cfln2XOVWatwytBexTDRuWkg0Eq55mGTF5MsFu6WJew_0u4GVJPiy0xVywp5YJap_JyQjUqvrgNr-BwiNeY",
    auth: "xLxWbv0yKXNvXgjOLm9nrQ",
  },
};

webpush.setVapidDetails(
  "mailto:test@conexionescolar.com",
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

const payload = JSON.stringify({
  title: "Conexión Escolar",
  body: "🔔 Push WEB funcionando",
  url: "/tabs/historial",
  data: { asistencia_id: 111700 },
});

webpush
  .sendNotification(subscription, payload)
  .then(() => console.log("Push enviado correctamente"))
  .catch((err) => console.error("Error enviando push:", err));