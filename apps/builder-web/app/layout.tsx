import type { ReactNode } from "react";

export const metadata = {
  title: "MicroApp Forge",
  description: "Genera micro-apps para tu negocio a partir de una descripcion en espanol.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body style={{ fontFamily: "system-ui, sans-serif", maxWidth: 720, margin: "0 auto", padding: 24 }}>
        {children}
      </body>
    </html>
  );
}
