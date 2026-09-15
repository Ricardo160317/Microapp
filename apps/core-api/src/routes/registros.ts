import { Router } from "express";
import { crearRegistro, listarRegistros } from "@microapp-forge/runtime-engine";
import { RequestConTenant, requireAuth } from "../middleware/auth";

export const registrosRouter = Router();

registrosRouter.use(requireAuth);

// POST /registros/:tablaNombre — crea un registro para esa tabla logica del
// Blueprint. El body es el objeto "datos" tal cual (los campos definidos
// por el Blueprint para esa tabla).
registrosRouter.post("/:tablaNombre", async (req: RequestConTenant, res) => {
  const { tablaNombre } = req.params;
  const datos = req.body ?? {};

  const resultado = await crearRegistro(req.tenantId!, tablaNombre, datos, req.supabase);
  if (!resultado.exito) return res.status(400).json({ error: resultado.errores });

  return res.status(201).json(resultado.registro);
});

// GET /registros/:tablaNombre — lista los registros de esa tabla logica.
registrosRouter.get("/:tablaNombre", async (req: RequestConTenant, res) => {
  const { tablaNombre } = req.params;

  const resultado = await listarRegistros(req.tenantId!, tablaNombre, req.supabase);
  if (!resultado.exito) return res.status(400).json({ error: resultado.errores });

  return res.json(resultado.registros);
});
