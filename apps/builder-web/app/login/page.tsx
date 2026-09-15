"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api, guardarToken } from "../../lib/api";

export default function LoginPage() {
  const [modo, setModo] = useState<"login" | "registro">("login");
  const [nombreNegocio, setNombreNegocio] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      if (modo === "registro") {
        await api.registro(nombreNegocio, email, password);
      }
      const sesion = await api.login(email, password);
      guardarToken(sesion.token);
      router.push("/nueva-app");
    } catch (err: any) {
      setError(err.message ?? "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>
      <h1>{modo === "login" ? "Iniciar sesion" : "Crear cuenta"}</h1>
      <form onSubmit={enviar}>
        {modo === "registro" && (
          <div>
            <label>Nombre del negocio</label>
            <br />
            <input value={nombreNegocio} onChange={(e) => setNombreNegocio(e.target.value)} required />
          </div>
        )}
        <div>
          <label>Email</label>
          <br />
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div>
          <label>Contrasena</label>
          <br />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? "Enviando..." : modo === "login" ? "Entrar" : "Crear cuenta"}
        </button>
      </form>
      <p>
        <button type="button" onClick={() => setModo(modo === "login" ? "registro" : "login")}>
          {modo === "login" ? "No tengo cuenta, quiero crearla" : "Ya tengo cuenta, quiero entrar"}
        </button>
      </p>
    </main>
  );
}
