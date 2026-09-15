-- Migración 0002: Opción C (tabla única "registros" con JSONB).
-- El aprovisionamiento dinámico de tablas (una tabla física por cada tabla
-- del Blueprint) queda descartado: todos los datos de todas las tablas de
-- todos los tenants viven en una sola tabla "registros", diferenciados por
-- tabla_nombre. Esto evita colisiones de nombre entre tenants y elimina la
-- necesidad de DDL dinámico / pg-format / una función exec_sql.

-- =========================================================
-- Corrección de políticas RLS de 0001
-- =========================================================
-- auth.jwt() ->> 'tenant_id' asumía un claim de nivel superior. Supabase Auth
-- no agrega claims custom ahí por defecto: los pone dentro de user_metadata
-- (definido al crear el usuario). Se corrige la condición en las 3 tablas
-- ya creadas, sin editar 0001.

drop policy tenants_select on tenants;
drop policy tenants_insert on tenants;
drop policy tenants_update on tenants;
drop policy tenants_delete on tenants;

create policy tenants_select on tenants
  for select using (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy tenants_insert on tenants
  for insert with check (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy tenants_update on tenants
  for update
  using (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  with check (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy tenants_delete on tenants
  for delete using (id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

drop policy blueprints_select on blueprints;
drop policy blueprints_insert on blueprints;
drop policy blueprints_update on blueprints;
drop policy blueprints_delete on blueprints;

create policy blueprints_select on blueprints
  for select using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy blueprints_insert on blueprints
  for insert with check (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy blueprints_update on blueprints
  for update
  using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy blueprints_delete on blueprints
  for delete using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- =========================================================
-- Eliminar la tabla de ejemplo "pedidos" (superada por "registros")
-- =========================================================

drop table if exists pedidos;

-- =========================================================
-- Tabla única "registros"
-- =========================================================

create table registros (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  blueprint_id uuid references blueprints(id) on delete cascade,
  tabla_nombre text not null, -- nombre logico de la tabla del Blueprint (ej. 'pedidos')
  datos jsonb not null, -- campos del registro segun la definicion del Blueprint
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

alter table registros enable row level security;

create policy registros_select on registros
  for select using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy registros_insert on registros
  for insert with check (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy registros_update on registros
  for update
  using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

create policy registros_delete on registros
  for delete using (tenant_id = (auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid);

-- Índice compuesto: las consultas siempre filtran por tenant + tabla logica
create index idx_registros_tenant_tabla on registros(tenant_id, tabla_nombre);
