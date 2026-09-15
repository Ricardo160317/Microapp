const TIPOS_VALIDOS = ["texto", "numero", "booleano", "fecha", "telefono", "moneda", "identificador", "fecha_hora"];
const TIPOS_VISTA_VALIDOS = ["lista", "formulario"];
const EVENTOS_VALIDOS = ["registro_creado", "registro_actualizado", "campo_cambiado"];

const PROPS_RAIZ = ["app_nombre", "descripcion", "tablas", "vistas", "alertas_whatsapp"];
const PROPS_TABLA = ["nombre", "campos", "etiqueta"];
const PROPS_CAMPO = ["nombre", "tipo", "obligatorio", "etiqueta"];
const PROPS_VISTA = ["nombre", "tipo", "tabla", "campos_visibles"];
const PROPS_ALERTA = ["evento", "condicion", "destinatario", "mensaje", "campo"];

function esSnakeCase(str: any): boolean {
  return typeof str === "string" && /^[a-z][a-z0-9_]*$/.test(str);
}

function validarPropiedadesExtra(obj: any, permitidas: string[], etiqueta: string, errores: string[]): void {
  Object.keys(obj).forEach((clave) => {
    if (!permitidas.includes(clave)) errores.push(`${etiqueta}: propiedad no permitida '${clave}'.`);
  });
}

function validarCampo(campo: any, i: number, j: number, errores: string[]): void {
  if (!campo || typeof campo !== "object") {
    errores.push(`Tabla ${i}, campo ${j}: debe ser un objeto.`);
    return;
  }
  validarPropiedadesExtra(campo, PROPS_CAMPO, `Tabla ${i}, campo ${j}`, errores);
  if (!campo.nombre) {
    errores.push(`Tabla ${i}, campo ${j}: falta 'nombre'.`);
  } else if (!esSnakeCase(campo.nombre)) {
    errores.push(`Tabla ${i}, campo '${campo.nombre}': nombre no cumple snake_case.`);
  }
  if (!campo.tipo || !TIPOS_VALIDOS.includes(campo.tipo)) {
    errores.push(`Tabla ${i}, campo ${j}: falta 'tipo' o es invalido.`);
  }
  if (campo.obligatorio === undefined) errores.push(`Tabla ${i}, campo ${j}: falta 'obligatorio'.`);
}

function validarTabla(tabla: any, i: number, errores: string[]): void {
  if (!tabla || typeof tabla !== "object") {
    errores.push(`Tabla ${i}: debe ser un objeto.`);
    return;
  }
  validarPropiedadesExtra(tabla, PROPS_TABLA, `Tabla ${i}`, errores);
  if (!tabla.nombre) {
    errores.push(`Tabla ${i}: falta 'nombre'.`);
  } else if (!esSnakeCase(tabla.nombre)) {
    errores.push(`Tabla '${tabla.nombre}': nombre no cumple snake_case.`);
  }

  if (!Array.isArray(tabla.campos)) {
    errores.push(`Tabla ${i}: falta 'campos' o no es un arreglo.`);
    return;
  }
  const etiquetaTabla = tabla.nombre || `#${i}`;
  if (tabla.campos.length < 3) {
    errores.push(`Tabla '${etiquetaTabla}': debe tener al menos 3 campos (id, uno o mas del usuario, creado_en).`);
  }
  tabla.campos.forEach((campo: any, j: number) => validarCampo(campo, i, j, errores));

  const primero = tabla.campos[0];
  const ultimo = tabla.campos[tabla.campos.length - 1];
  if (!primero || primero.nombre !== "id" || primero.tipo !== "identificador") {
    errores.push(`Tabla '${etiquetaTabla}': el primer campo debe ser 'id' de tipo 'identificador'.`);
  }
  if (!ultimo || ultimo.nombre !== "creado_en" || ultimo.tipo !== "fecha_hora") {
    errores.push(`Tabla '${etiquetaTabla}': el ultimo campo debe ser 'creado_en' de tipo 'fecha_hora'.`);
  }
}

function validarVista(vista: any, i: number, nombresTablas: string[], errores: string[]): void {
  if (!vista || typeof vista !== "object") {
    errores.push(`Vista ${i}: debe ser un objeto.`);
    return;
  }
  validarPropiedadesExtra(vista, PROPS_VISTA, `Vista ${i}`, errores);
  if (!vista.nombre) errores.push(`Vista ${i}: falta 'nombre'.`);
  if (!vista.tipo || !TIPOS_VISTA_VALIDOS.includes(vista.tipo)) {
    errores.push(`Vista ${i}: 'tipo' debe ser 'lista' o 'formulario'.`);
  }
  if (!vista.tabla) {
    errores.push(`Vista ${i}: falta 'tabla'.`);
  } else if (!nombresTablas.includes(vista.tabla)) {
    errores.push(`Vista ${i}: 'tabla' ('${vista.tabla}') no coincide con ninguna tabla existente.`);
  }
}

function validarAlerta(alerta: any, i: number, errores: string[]): void {
  if (!alerta || typeof alerta !== "object") {
    errores.push(`Alerta ${i}: debe ser un objeto.`);
    return;
  }
  validarPropiedadesExtra(alerta, PROPS_ALERTA, `Alerta ${i}`, errores);
  if (!alerta.evento || !EVENTOS_VALIDOS.includes(alerta.evento)) {
    errores.push(`Alerta ${i}: 'evento' debe ser uno de ${EVENTOS_VALIDOS.join(", ")}.`);
  }
  ["condicion", "destinatario", "mensaje"].forEach((campo) => {
    if (!alerta[campo]) errores.push(`Alerta ${i}: falta '${campo}'.`);
  });
}

export function validateBlueprint(blueprint: any): { valido: boolean; errores: string[] } {
  const errores: string[] = [];

  if (!blueprint || typeof blueprint !== "object") {
    return { valido: false, errores: ["El blueprint debe ser un objeto."] };
  }

  validarPropiedadesExtra(blueprint, PROPS_RAIZ, "Blueprint", errores);

  if (!blueprint.app_nombre) errores.push("Falta el campo 'app_nombre'.");

  if (!blueprint.tablas) {
    errores.push("Falta el campo 'tablas'.");
  } else if (!Array.isArray(blueprint.tablas) || blueprint.tablas.length === 0) {
    errores.push("'tablas' debe ser un arreglo con al menos un elemento.");
  } else {
    blueprint.tablas.forEach((tabla: any, i: number) => validarTabla(tabla, i, errores));
  }

  const nombresTablas = Array.isArray(blueprint.tablas)
    ? blueprint.tablas.filter((t: any) => t && typeof t === "object").map((t: any) => t.nombre)
    : [];

  if (!blueprint.vistas) {
    errores.push("Falta el campo 'vistas'.");
  } else if (!Array.isArray(blueprint.vistas) || blueprint.vistas.length === 0) {
    errores.push("'vistas' debe ser un arreglo con al menos un elemento.");
  } else {
    blueprint.vistas.forEach((vista: any, i: number) => validarVista(vista, i, nombresTablas, errores));
  }

  if (blueprint.alertas_whatsapp !== undefined) {
    if (!Array.isArray(blueprint.alertas_whatsapp)) {
      errores.push("'alertas_whatsapp' debe ser un arreglo.");
    } else {
      blueprint.alertas_whatsapp.forEach((alerta: any, i: number) => validarAlerta(alerta, i, errores));
    }
  }

  return { valido: errores.length === 0, errores };
}
