import format from "pg-format";

// Decisión de ejecución: se usa supabaseClient.rpc('exec_sql', { sql }) en vez
// de una conexión pg directa. Motivo: la firma de esta función solo recibe un
// supabaseClient (no credenciales de conexión Postgres separadas), y ese
// cliente ya trae el rol service_role necesario para bypassar RLS al crear
// tablas. Usar pg directo obligaría a manejar una segunda fuente de
// credenciales fuera de la firma pedida.
//
// PRERREQUISITO pendiente (fuera de alcance aquí, "no crear funciones SQL
// custom todavía"): en Supabase debe existir una función Postgres
// exec_sql(sql text) que haga `execute sql`, marcada security definer con
// rol service_role. Sin ella, esta llamada rpc fallará en producción. Queda
// documentado para un paso posterior.

const MAPA_TIPOS: Record<string, string> = {
  texto: "text",
  numero: "numeric",
  booleano: "boolean",
  fecha: "date",
  telefono: "text",
  moneda: "numeric",
  identificador: "uuid",
  fecha_hora: "timestamptz",
};

interface ResultadoProvision {
  exito: boolean;
  tablaCreada?: string;
  errores?: string[];
}

// tabla.campos ya incluye 'id' (primero) y 'creado_en' (ultimo) por contrato
// del Blueprint (validado por validateBlueprint), asi que no se duplican: se
// especial-casan con su definicion completa (primary key / default now()) y
// los campos intermedios se mapean genericamente via MAPA_TIPOS.
function columnaSistemaId(nombreCampo: string): string {
  return format("%I uuid primary key default gen_random_uuid()", nombreCampo);
}

function columnaSistemaCreadoEn(nombreCampo: string): string {
  return format("%I timestamptz default now()", nombreCampo);
}

function columnaUsuario(campo: any): string {
  const tipoSQL = MAPA_TIPOS[campo.tipo];
  const restriccion = campo.obligatorio ? " not null" : "";
  return format("%I %s", campo.nombre, tipoSQL) + restriccion;
}

function generarSentencias(tabla: any): string[] {
  const campos = tabla.campos;
  const columnas = [columnaSistemaId(campos[0].nombre)];
  for (let i = 1; i < campos.length - 1; i++) {
    columnas.push(columnaUsuario(campos[i]));
  }
  columnas.push(columnaSistemaCreadoEn(campos[campos.length - 1].nombre));
  columnas.push("tenant_id uuid references tenants(id)");

  const nombreTabla = tabla.nombre;
  const nombreIndice = `idx_${nombreTabla}_tenant_id`;

  return [
    format("create table %I (%s)", nombreTabla, columnas.join(", ")),
    format("alter table %I enable row level security", nombreTabla),
    format(
      "create policy tenant_isolation_policy on %I using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)",
      nombreTabla
    ),
    format("create index %I on %I (tenant_id)", nombreIndice, nombreTabla),
  ];
}

export async function provisionTenant(
  tenantId: string,
  blueprint: any,
  supabaseClient: any
): Promise<ResultadoProvision> {
  const errores: string[] = [];
  let tablaCreada: string | undefined;

  for (const tabla of blueprint.tablas) {
    const sentencias = generarSentencias(tabla);
    let tablaOk = true;

    for (const sql of sentencias) {
      const { error } = await supabaseClient.rpc("exec_sql", { sql });
      if (error) {
        errores.push(`Tabla '${tabla.nombre}': ${error.message}`);
        tablaOk = false;
        break;
      }
    }

    if (tablaOk && !tablaCreada) tablaCreada = tabla.nombre;
  }

  return { exito: errores.length === 0, tablaCreada, errores };
}
