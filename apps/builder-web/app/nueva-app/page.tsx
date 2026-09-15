"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../lib/api";

export default function NuevaAppPage() {
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      await api.crearBlueprint(descripcion);
      router.push("/blueprint");
    } catch (err: any) {
      setError(err.message ?? "Error desconocido.");
    } finally {
      setCargando(false);
    }
  }

  return (
    <main>
      <h1>Describe tu negocio</h1>
      <p>Cuentale a la IA que necesitas registrar, en tus propias palabras.</p>
      <form onSubmit={enviar}>
        <textarea
          rows={8}
          style={{ width: "100%" }}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          placeholder="Ej: Tengo una panaderia en Surquillo y quiero anotar los pedidos de mis clientas..."
          required
        />
        {error && <p style={{ color: "red" }}>{error}</p>}
        <button type="submit" disabled={cargando}>
          {cargando ? "Generando..." : "Generar mi app"}
        </button>
      </form>
    </main>
  );
}
