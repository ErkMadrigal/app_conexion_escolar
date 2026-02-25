// src/config/api.ts
const PROD = "https://conexionescolar.com.mx/api";
const DEV  = "http://localhost/conexionescolar/public/api";

// Vite (Ionic Vue usa Vite normalmente)
const envUrl = (import.meta as any).env?.VITE_API_URL;

export const API_URL = (envUrl && envUrl !== "undefined")
  ? envUrl.replace(/\/$/, "")
  : (import.meta.env.PROD ? PROD : DEV);