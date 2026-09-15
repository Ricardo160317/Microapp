# MicroApp Forge

Generador de micro-aplicaciones para PYMES peruanas: el dueño de un negocio
describe lo que necesita en español, una IA lo convierte en un **Blueprint**
(JSON validado) y la plataforma lo ejecuta como una app real con datos
aislados por negocio (multi-tenant).

## Arquitectura

```
BLUEPRINT_SCHEMA.md          Contrato de datos del Blueprint
SYSTEM_PROMPT.md             Prompt que convierte descripción → Blueprint JSON
TEST_BLUEPRINT.md            Caso de referencia (panadería de Rosa)

packages/runtime-engine/     Lógica de negocio compartida (paquete npm interno)
  src/validate.ts              validateBlueprint(): valida un Blueprint
  src/generate.ts               generateBlueprint(): llama a la IA y valida el resultado
  src/registros.ts             crearRegistro() / listarRegistros() (Opción C)
  src/index.ts                  punto de entrada del paquete

apps/core-api/                API HTTP (Express)
apps/builder-web/             Frontend (Next.js App Router)

supabase/migrations/          Esquema de Postgres + Row Level Security
```

### Modelo de datos (Opción C)

No se crean tablas físicas por cada Blueprint. Todos los registros de todos
los tenants viven en una única tabla `registros` (columna `datos jsonb`),
diferenciados por `tenant_id` + `tabla_nombre`. RLS aísla los datos por
tenant automáticamente. Ver `supabase/migrations/0002_registros.sql`.

### Autenticación

Se usa Supabase Auth (email + password). El `tenant_id` de cada usuario se
guarda en `user_metadata` al crear la cuenta, y las políticas RLS lo leen
desde ahí: `(auth.jwt() -> 'user_metadata' ->> 'tenant_id')::uuid`.

---

## Requisitos

- Node.js 20 o superior (usa `--env-file`, nativo desde Node 20.6).
- Una cuenta y proyecto de [Supabase](https://supabase.com) (plan gratuito alcanza).
- Una API key compatible con OpenAI (DeepSeek, Gemini vía proxy compatible, etc.) para generar Blueprints.

## 1. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com/dashboard).
2. En el **SQL Editor** del proyecto, ejecuta en orden:
   - `supabase/migrations/0001_init_multi_tenant.sql`
   - `supabase/migrations/0002_registros.sql`
3. En **Project Settings → API**, copia:
   - `Project URL` → `SUPABASE_URL`
   - `anon public` key → `SUPABASE_ANON_KEY`
   - `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (secreta, nunca al frontend)

## 2. Variables de entorno

Copia el archivo de ejemplo y complétalo con tus valores reales:

```bash
cp .env.example .env
```

Variables en `.env` (raíz del proyecto, un solo archivo para todo):

| Variable | Descripción |
|---|---|
| `IA_BASE_URL` | baseURL compatible con OpenAI (ej. `https://api.deepseek.com/v1`) |
| `IA_API_KEY` | API key del proveedor de IA |
| `IA_MODELO` | Modelo a usar (default `deepseek-chat`) |
| `SUPABASE_URL` | URL de tu proyecto Supabase |
| `SUPABASE_ANON_KEY` | Clave pública (anon) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clave de servidor (bypassa RLS, solo la usa `core-api`) |
| `CORE_API_PORT` | Puerto de la API (default `3001`) |
| `NEXT_PUBLIC_API_URL` | URL de la API que usa el frontend (default `http://localhost:3001`) |

## 3. Instalar dependencias

Desde la raíz del proyecto (un solo comando, es un npm workspace):

```bash
npm install
```

## 4. Ejecutar en local

Se necesitan **dos terminales** (API y frontend son procesos separados):

**Terminal 1 — API:**
```bash
cd apps/core-api
npm run dev
```
Queda escuchando en `http://localhost:3001`.

**Terminal 2 — Frontend:**
```bash
cd apps/builder-web
npm run dev
```
Queda escuchando en `http://localhost:3000`.

Abre `http://localhost:3000` en el navegador.

## 5. Flujo de uso

1. `/login` → "No tengo cuenta, quiero crearla" → crea el negocio (tenant) y el usuario.
2. Inicia sesión → redirige a `/nueva-app`.
3. Escribe la descripción del negocio en español (ej. el caso de Rosa en `TEST_BLUEPRINT.md`).
4. Se genera el Blueprint vía IA, se valida y se guarda → redirige a `/blueprint`.
5. Desde `/blueprint`, entra a "Ver registros" de cualquier tabla del Blueprint generado.
6. En `/registros?tabla=<nombre>`, crea registros pegando un JSON con los campos definidos por esa tabla.

## Otros comandos útiles

```bash
# Probar generateBlueprint() de forma aislada (sin API ni frontend)
npm run probar

# Validar el paquete runtime-engine y la API compilan sin errores de tipos
cd packages/runtime-engine && npx tsc --noEmit --target ES2022 --module CommonJS --moduleResolution Node --esModuleInterop --skipLibCheck --strict src/*.ts
cd apps/core-api && npx tsc --noEmit

# Build de producción del frontend
cd apps/builder-web && npm run build
```

---

## Qué funciona hoy

- Generación de Blueprint desde descripción en español (`generateBlueprint`), validado exhaustivamente (`validateBlueprint`: tipos, snake_case, `id`/`creado_en`, enums, referencias cruzadas, `additionalProperties`).
- Registro/login con Supabase Auth, `tenant_id` por usuario.
- API con los 6 endpoints pedidos, aislamiento multi-tenant vía RLS de extremo a extremo (nunca se filtra `tenant_id` a mano fuera de RLS en las lecturas).
- Frontend mínimo funcional: login/registro → descripción → Blueprint generado → crear y ver registros.
- `next build` y `tsc --noEmit` verificados sin errores; `core-api` probado en caliente (boot, 401 sin token, validación de body).

## Qué queda pendiente para producción

- **Alertas de WhatsApp**: el Blueprint ya modela `alertas_whatsapp`, pero no hay integración real con la API de WhatsApp (Meta Cloud API / Twilio) que dispare los mensajes cuando cambia un campo.
- **Pagos**: sin integración con Yape/Plin/pasarelas — hoy solo se documenta como convención de campo `tipo: "moneda"`.
- **Deploy**: todo pensado para correr local. Falta Dockerfile/hosting (Vercel para `builder-web`, un servicio tipo Render/Fly.io para `core-api`), variables de entorno por ambiente, y CORS restringido a un dominio real (hoy `cors()` abierto).
- **Formulario dinámico de registros**: `/registros` pide el JSON a mano en un textarea; falta generar un formulario real a partir de los campos del Blueprint (usando los `tipo` para inputs apropiados).
- **Refresh de sesión**: el frontend guarda el JWT en `localStorage` sin renovarlo ni manejar expiración más allá de que la request falle.
- **Tests automatizados**: no hay suite de tests en ningún paquete todavía (`"test"` es un placeholder en los 3 `package.json`).
- **Rate limiting / reintentos**: `generateBlueprint()` no reintenta ante fallos del proveedor de IA ni hay límite de uso por tenant.
