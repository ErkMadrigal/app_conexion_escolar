// src/api.ts
import { getToken, setSession } from "@/services/session";
import { API_URL } from "@/config/api";
import { Device } from "@capacitor/device";

const API = API_URL;

// ✅ Siempre regresa Record<string,string> para que TS no haga unión rara
function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiGet(path: string) {
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...authHeaders(),
  };

  const resp = await fetch(API + path, { headers });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${txt || resp.statusText}`);
  }
  return resp.json();
}

export async function apiPost(path: string, body: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...authHeaders(),
  };

  const resp = await fetch(API + path, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${txt || resp.statusText}`);
  }
  return resp.json();
}

/**
 * Login mobile
 * POST /api/auth/login-mobile
 */
export async function loginMobile(curp: string, password: string) {
  // device_id real del dispositivo
  const { identifier } = await Device.getId();
  const device_id = identifier;

  localStorage.setItem("device_id", device_id);
  // por ahora vacío hasta que metas FCM real
  const fcm_token = "";

  // si luego quieres detectar ios/android, lo ajustamos
  const platform = "android";

  const resp = await fetch(API + "/auth/login-mobile", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ curp, password, fcm_token, platform, device_id }),
  });

  const text = await resp.text().catch(() => "");
  let data: any = {};
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!resp.ok || data?.status !== "ok") {
    throw new Error(data?.message || `Login falló (${resp.status})`);
  }

  // Guardar sesión
  setSession(data.token, data.estudiante);

  return data as {
    status: "ok";
    token: string;
    must_change_password: number;
    estudiante: any;
    message: string;
    device?: any;
  };
}