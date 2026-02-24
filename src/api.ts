// src/api.ts
import { getToken, setSession } from "@/services/session";

const API = import.meta.env.VITE_API_URL;

export async function apiGet(path: string) {
  const resp = await fetch(API + path, {
    headers: { "Authorization": `Bearer ${getToken()}` },
  });

  if (!resp.ok) {
    const txt = await resp.text().catch(() => "");
    throw new Error(`API ${resp.status}: ${txt || resp.statusText}`);
  }
  return resp.json();
}

export async function apiPost(path: string, body: any) {
  const resp = await fetch(API + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${getToken()}`,
    },
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
  const resp = await fetch(API + "/auth/login-mobile", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ curp, password }),
  });

  const data = await resp.json().catch(() => ({}));

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
  };
}