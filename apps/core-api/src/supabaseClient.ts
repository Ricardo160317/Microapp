import { createClient } from "@supabase/supabase-js";

// Cliente con privilegios de servidor (service_role): bypassa RLS.
// Se usa SOLO para operaciones administrativas (crear tenant + usuario en
// /auth/registro). Nunca se expone al frontend.
export const supabaseAdmin = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_SERVICE_ROLE_KEY as string
);

// Cliente "anon": para operaciones que no requieren bypass de RLS (login).
export const supabaseAnon = createClient(
  process.env.SUPABASE_URL as string,
  process.env.SUPABASE_ANON_KEY as string
);

// Cliente autenticado con el JWT del usuario que hizo la request. Las
// llamadas a Postgres via PostgREST llevan ese Bearer token, y RLS filtra
// automaticamente por tenant_id (ver supabase/migrations/0002_registros.sql).
export function clienteConToken(token: string) {
  return createClient(process.env.SUPABASE_URL as string, process.env.SUPABASE_ANON_KEY as string, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}
