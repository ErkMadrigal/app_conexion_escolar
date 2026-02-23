export type Hijo = {
  id: number;
  nombres: string;
  apellidos: string;
  grado?: string;
  grupo?: string;
  matricula?: string;
};

const KEY = "ce_selected_hijo";

export function setSelectedHijo(hijo: Hijo) {
  localStorage.setItem(KEY, JSON.stringify(hijo));
}

export function getSelectedHijo(): Hijo | null {
  const raw = localStorage.getItem(KEY);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export function clearSelectedHijo() {
  localStorage.removeItem(KEY);
}