import Link from "next/link";

export default function Home() {
  return (
    <main>
      <h1>MicroApp Forge</h1>
      <p>Genera una micro-app para tu negocio a partir de una descripcion en espanol.</p>
      <p>
        <Link href="/login">Entrar / Crear cuenta</Link>
      </p>
    </main>
  );
}
