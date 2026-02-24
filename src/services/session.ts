// src/services/session.ts
export type Estudiante = {
  id: number;
  id_escuela: number;
  nombres: string;
  apellidos: string;
  curp: string;
  matricula?: string;
  grado?: string;
  grupo?: string;
};

const TOKEN_KEY = "session_token";
const STUDENT_KEY = "session_student";

export function setSession(token: string, estudiante: Estudiante) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(STUDENT_KEY, JSON.stringify(estudiante));
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getStudent(): Estudiante | null {
  const raw = localStorage.getItem(STUDENT_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(STUDENT_KEY);
}

export function isLoggedIn(): boolean {
  return getToken().length > 0;
}