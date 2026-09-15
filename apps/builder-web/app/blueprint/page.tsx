"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../../lib/api";

export default function BlueprintPage() {
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listarBlueprints()
      .then(setBlueprints)
      .catch((err: any) => setError(err.message));
  }, []);

  return (
    <main>
      <h1>Tus Blueprints</h1>
      <p>
        <Link href="/nueva-app">+ Generar otra app</Link>
      </p>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {blueprints.map((bp) => (
        <div key={bp.id} style={{ border: "1px solid #ccc", padding: 12, marginBottom: 12 }}>
          <h2>{bp.app_nombre}</h2>
          <pre style={{ whiteSpace: "pre-wrap", overflowX: "auto" }}>
            {JSON.stringify(bp.definicion, null, 2)}
          </pre>
          {bp.definicion?.tablas?.map((t: any) => (
            <p key={t.nombre}>
              <Link href={`/registros?tabla=${t.nombre}`}>Ver registros de &quot;{t.nombre}&quot;</Link>
            </p>
          ))}
        </div>
      ))}
    </main>
  );
}
