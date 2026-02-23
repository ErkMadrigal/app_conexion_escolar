const API = import.meta.env.VITE_API_URL;

function getToken() {
  return localStorage.getItem("session_token") || "";
}

export async function apiGet(path: string) {
  const resp = await fetch(API + path, {
    headers: {
      "Authorization": `Bearer ${getToken()}`,
    },
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