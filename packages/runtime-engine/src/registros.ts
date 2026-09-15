// Opción C: no hay tablas físicas por Blueprint. Todo registro (de
// cualquier tabla lógica de cualquier tenant) vive en la tabla única
// "registros" (ver supabase/migrations/0002_registros.sql), diferenciado
// por tenant_id + tabla_nombre. RLS aísla los datos por tenant; el filtro
// explícito por tenant_id aquí es defensa en profundidad y, en el insert,
// necesario para que la política WITH CHECK tenga algo que comparar.

interface ResultadoCrearRegistro {
  exito: boolean;
  registro?: Record<string, any>;
  errores?: string[];
}

interface ResultadoListarRegistros {
  exito: boolean;
  registros?: Record<string, any>[];
  errores?: string[];
}

export async function crearRegistro(
  tenantId: string,
  tablaNombre: string,
  datos: Record<string, any>,
  supabaseClient: any,
  blueprintId?: string
): Promise<ResultadoCrearRegistro> {
  const { data, error } = await supabaseClient
    .from("registros")
    .insert({
      tenant_id: tenantId,
      tabla_nombre: tablaNombre,
      datos,
      blueprint_id: blueprintId ?? null,
    })
    .select()
    .single();

  if (error) return { exito: false, errores: [error.message] };
  return { exito: true, registro: data };
}

export async function listarRegistros(
  tenantId: string,
  tablaNombre: string,
  supabaseClient: any
): Promise<ResultadoListarRegistros> {
  const { data, error } = await supabaseClient
    .from("registros")
    .select("*")
    .eq("tenant_id", tenantId)
    .eq("tabla_nombre", tablaNombre)
    .order("creado_en", { ascending: false });

  if (error) return { exito: false, errores: [error.message] };
  return { exito: true, registros: data };
}
