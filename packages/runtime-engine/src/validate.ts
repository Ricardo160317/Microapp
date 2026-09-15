const TIPOS_VALIDOS = ["texto", "numero", "booleano", "fecha", "telefono", "moneda"];

export function validateBlueprint(blueprint: any): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!blueprint || typeof blueprint !== "object") {
    return { valido: false, errores: ["El blueprint debe ser un objeto."] };
  }

  if (!blueprint.app_nombre) errores.push("Falta el campo 'app_nombre'.");
  if (!blueprint.vistas) errores.push("Falta el campo 'vistas'.");

  if (!blueprint.tablas) {
    errores.push("Falta el campo 'tablas'.");
  } else if (!Array.isArray(blueprint.tablas) || blueprint.tablas.length === 0) {
    errores.push("'tablas' debe ser un arreglo con al menos un elemento.");
  } else {
    blueprint.tablas.forEach((tabla: any, i: number) => {
      if (!tabla || typeof tabla !== "object") {
        errores.push(`Tabla ${i}: debe ser un objeto.`);
        return;
      }
      if (!tabla.nombre) errores.push(`Tabla ${i}: falta 'nombre'.`);
      if (!Array.isArray(tabla.campos)) {
        errores.push(`Tabla ${i}: falta 'campos' o no es un arreglo.`);
      } else {
        tabla.campos.forEach((campo: any, j: number) => {
          if (!campo || typeof campo !== "object") {
            errores.push(`Tabla ${i}, campo ${j}: debe ser un objeto.`);
            return;
          }
          if (!campo.nombre) errores.push(`Tabla ${i}, campo ${j}: falta 'nombre'.`);
          if (!campo.tipo || !TIPOS_VALIDOS.includes(campo.tipo)) {
            errores.push(`Tabla ${i}, campo ${j}: falta 'tipo' o es invalido.`);
          }
          if (campo.obligatorio === undefined) errores.push(`Tabla ${i}, campo ${j}: falta 'obligatorio'.`);
        });
      }
    });
  }

  if (blueprint.alertas_whatsapp !== undefined) {
    if (!Array.isArray(blueprint.alertas_whatsapp)) {
      errores.push("'alertas_whatsapp' debe ser un arreglo.");
    } else {
      blueprint.alertas_whatsapp.forEach((alerta: any, i: number) => {
        if (!alerta || typeof alerta !== "object") {
          errores.push(`Alerta ${i}: debe ser un objeto.`);
          return;
        }
        ["evento", "condicion", "destinatario", "mensaje"].forEach((campo) => {
          if (!alerta[campo]) errores.push(`Alerta ${i}: falta '${campo}'.`);
        });
      });
    }
  }

  return { valido: errores.length === 0, errores };
}
