import { Router } from "express";
import { supabaseAdmin, supabaseAnon } from "../supabaseClient";

export const authRouter = Router();

// POST /auth/registro — crea el tenant (negocio) y su primer usuario.
// email_confirm: true evita depender de SMTP configurado para probar local.
authRouter.post("/registro", async (req, res) => {
  const { nombreNegocio, email, password } = req.body ?? {};
  if (!nombreNegocio || !email || !password) {
    return res.status(400).json({ error: "Faltan 'nombreNegocio', 'email' o 'password'." });
  }

  const { data: tenant, error: errorTenant } = await supabaseAdmin
    .from("tenants")
    .insert({ nombre: nombreNegocio, email })
    .select()
    .single();

  if (errorTenant) {
    return res.status(400).json({ error: `No se pudo crear el tenant: ${errorTenant.message}` });
  }

  const { data: usuario, error: errorUsuario } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { tenant_id: tenant.id },
  });

  if (errorUsuario) {
    // No dejar un tenant huerfano si la creacion del usuario falla.
    await supabaseAdmin.from("tenants").delete().eq("id", tenant.id);
    return res.status(400).json({ error: `No se pudo crear el usuario: ${errorUsuario.message}` });
  }

  return res.status(201).json({ tenantId: tenant.id, usuarioId: usuario.user.id });
});

// POST /auth/login — verifica credenciales y devuelve el JWT de sesion.
authRouter.post("/login", async (req, res) => {
  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ error: "Faltan 'email' o 'password'." });
  }

  const { data, error } = await supabaseAnon.auth.signInWithPassword({ email, password });
  if (error || !data.session) {
    return res.status(401).json({ error: "Credenciales invalidas." });
  }

  return res.json({
    token: data.session.access_token,
    tenantId: data.user.user_metadata?.tenant_id,
  });
});
