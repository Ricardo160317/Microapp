import { Request, Response, NextFunction } from "express";
import type { SupabaseClient } from "@supabase/supabase-js";
import { supabaseAnon, clienteConToken } from "../supabaseClient";

export interface RequestConTenant extends Request {
  tenantId?: string;
  supabase?: SupabaseClient;
}

// Extrae el Bearer token, valida la sesion contra Supabase Auth, y adjunta
// tenantId (leido de user_metadata, ver 0002_registros.sql) + un cliente
// Supabase autenticado con ese mismo token a la request. Las rutas
// siguientes usan req.supabase, ya aislado por tenant via RLS.
export async function requireAuth(req: RequestConTenant, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;

  if (!token) {
    return res.status(401).json({ error: "Falta el header Authorization: Bearer <token>." });
  }

  const { data, error } = await supabaseAnon.auth.getUser(token);
  if (error || !data.user) {
    return res.status(401).json({ error: "Token invalido o expirado." });
  }

  const tenantId = data.user.user_metadata?.tenant_id;
  if (!tenantId) {
    return res.status(403).json({ error: "El usuario no tiene tenant_id asociado." });
  }

  req.tenantId = tenantId;
  req.supabase = clienteConToken(token);
  next();
}
