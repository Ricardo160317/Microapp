// Cliente HTTP minimo para hablar con apps/core-api. Guarda el JWT de
// sesion en localStorage (alcance MVP: sin refresh automatico ni
// manejo de expiracion mas alla de que la request falle con 401).

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

function obtenerToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function guardarToken(token: string) {
  localStorage.setItem("token", token);
}

async function pedido(path: string, opciones: RequestInit = {}) {
  const token = obtenerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(opciones.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const respuesta = await fetch(`${API_URL}${path}`, { ...opciones, headers });
  const cuerpo = await respuesta.json().catch(() => null);

  if (!respuesta.ok) {
    const mensaje = cuerpo?.error ? JSON.stringify(cuerpo.error) : `Error ${respuesta.status}`;
    throw new Error(mensaje);
  }
  return cuerpo;
}

export const api = {
  registro: (nombreNegocio: string, email: string, password: string) =>
    pedido("/auth/registro", {
      method: "POST",
      body: JSON.stringify({ nombreNegocio, email, password }),
    }),

  login: (email: string, password: string) =>
    pedido("/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),

  crearBlueprint: (descripcion: string) =>
    pedido("/blueprints", { method: "POST", body: JSON.stringify({ descripcion }) }),

  listarBlueprints: () => pedido("/blueprints"),

  crearRegistro: (tablaNombre: string, datos: object) =>
    pedido(`/registros/${tablaNombre}`, { method: "POST", body: JSON.stringify(datos) }),

  listarRegistros: (tablaNombre: string) => pedido(`/registros/${tablaNombre}`),
};
