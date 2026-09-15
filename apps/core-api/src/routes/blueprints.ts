import { Router } from "express";
import { generateBlueprint } from "@microapp-forge/runtime-engine";
import { RequestConTenant, requireAuth } from "../middleware/auth";

export const blueprintsRouter = Router();

blueprintsRouter.use(requireAuth);

// POST /blueprints — recibe una descripcion en espanol, genera el Blueprint
// via IA (generateBlueprint ya valida el resultado), y lo guarda si es
// valido.
blueprintsRouter.post("/", async (req: RequestConTenant, res) => {
  const { descripcion } = req.body ?? {};
  if (!descripcion) return res.status(400).json({ error: "Falta 'descripcion'." });

  const resultado = await generateBlueprint(descripcion);
  if (!resultado.exito) {
    return res.status(422).json({
      error: "No se pudo generar un Blueprint valido.",
      detalles: resultado.errores,
      raw: resultado.raw,
    });
  }

  const blueprint = resultado.blueprint as any;
  const { data, error } = await req.supabase!
    .from("blueprints")
    .insert({
      tenant_id: req.tenantId,
      app_nombre: blueprint.app_nombre,
      definicion: blueprint,
    })
    .select()
    .single();

  if (error) return res.status(400).json({ error: error.message });

  return res.status(201).json(data);
});

// GET /blueprints — lista los Blueprints del tenant autenticado (RLS ya
// filtra por tenant_id via el JWT del cliente).
blueprintsRouter.get("/", async (req: RequestConTenant, res) => {
  const { data, error } = await req.supabase!
    .from("blueprints")
    .select("*")
    .order("creado_en", { ascending: false });

  if (error) return res.status(400).json({ error: error.message });
  return res.json(data);
});
