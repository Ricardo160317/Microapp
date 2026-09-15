-- Migración inicial: esquema multi-inquilino con Row Level Security (RLS).
-- Cada inquilino (tenant) solo puede ver y modificar su propia data.
-- El tenant_id se compara contra el claim 'tenant_id' del JWT de Supabase Auth.

create extension if not exists pgcrypto;

-- =========================================================
-- Tablas
-- =========================================================

-- Inquilinos de MicroApp Forge (Rosa, Juan, etc.)
create table tenants (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text unique not null,
  creado_en timestamptz default now()
);

-- Un Blueprint por tenant: la definición completa de su micro-app
create table blueprints (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  app_nombre text not null,
  definicion jsonb not null, -- JSON completo del Blueprint
  creado_en timestamptz default now(),
  actualizado_en timestamptz default now()
);

-- Tabla de ejemplo: pedidos de la panadería de Rosa
create table pedidos (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id) on delete cascade,
  cliente_nombre text not null,
  cliente_telefono text,
  pedido_detalle text,
  pagado boolean default false,
  listo boolean default false,
  creado_en timestamptz default now()
);

-- =========================================================
-- Row Level Security
-- =========================================================

alter table tenants enable row level security;
alter table blueprints enable row level security;
alter table pedidos enable row level security;

-- Políticas: tenants (se aísla por su propio id, no tiene columna tenant_id)
create policy tenants_select on tenants
  for select using (id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenants_insert on tenants
  for insert with check (id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenants_update on tenants
  for update
  using (id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy tenants_delete on tenants
  for delete using (id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Políticas: blueprints
create policy blueprints_select on blueprints
  for select using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy blueprints_insert on blueprints
  for insert with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy blueprints_update on blueprints
  for update
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy blueprints_delete on blueprints
  for delete using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Políticas: pedidos
create policy pedidos_select on pedidos
  for select using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy pedidos_insert on pedidos
  for insert with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy pedidos_update on pedidos
  for update
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid)
  with check (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

create policy pedidos_delete on pedidos
  for delete using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- =========================================================
-- Índices para performance en consultas filtradas por tenant
-- (tenants.id ya es clave primaria, no necesita índice adicional)
-- =========================================================

create index idx_blueprints_tenant_id on blueprints(tenant_id);
create index idx_pedidos_tenant_id on pedidos(tenant_id);
