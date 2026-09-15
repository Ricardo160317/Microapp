"use client";

import { Suspense, useEffect, useState, FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { api } from "../../lib/api";

export default function RegistrosPage() {
  return (
    <Suspense fallback={<main>Cargando...</main>}>
      <RegistrosContenido />
    </Suspense>
  );
}

function RegistrosContenido() {
  const params = useSearchParams();
  const tabla = params.get("tabla") ?? "";
  const [registros, setRegistros] = useState<any[]>([]);
  const [datosJson, setDatosJson] = useState("{}");
  const [error, setError] = useState<string | null>(null);

  async function cargar() {
    if (!tabla) return;
    try {
      setRegistros(await api.listarRegistros(tabla));
    } catch (err: any) {
      setError(err.message);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabla]);

  async function crear(e: FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const datos = JSON.parse(datosJson);
      await api.crearRegistro(tabla, datos);
      setDatosJson("{}");
      await cargar();
    } catch (err: any) {
      setError(err.message ?? "JSON invalido.");
    }
  }

  if (!tabla) {
    return (
      <main>
        <p>Falta el parametro ?tabla=nombre_tabla en la URL.</p>
      </main>
    );
  }

  return (
    <main>
      <h1>Registros de &quot;{tabla}&quot;</h1>
      <form onSubmit={crear}>
        <p>Datos del nuevo registro (JSON, segun los campos definidos en el Blueprint):</p>
        <textarea
          rows={4}
          style={{ width: "100%" }}
          value={datosJson}
          onChange={(e) => setDatosJson(e.target.value)}
        />
        <br />
        <button type="submit">Crear registro</button>
      </form>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <ul>
        {registros.map((r) => (
          <li key={r.id}>
            <pre style={{ whiteSpace: "pre-wrap" }}>{JSON.stringify(r.datos)}</pre>
          </li>
        ))}
      </ul>
    </main>
  );
}
