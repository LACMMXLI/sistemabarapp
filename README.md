# Bar POS — Sistema POS para bar y mesas de billar

Monorepo con:

- `apps/web` — React + Vite + TypeScript, PWA instalable. Interfaz operativa (venta rápida, mesas, billar, caja, administración).
- `apps/api` — NestJS + TypeScript. API REST bajo `/api`, exclusivamente backend (no sirve pantallas).
- `packages/contracts` — Esquemas Zod y tipos compartidos entre frontend y backend.
- `packages/config` — Constantes compartidas (zona horaria, matriz de permisos por rol, intervalos de polling).

Autoridad del servidor: precios, permisos, totales, promociones e inventario siempre se validan y calculan en el backend. El frontend nunca decide stock, precios ni totales.

## Requisitos

- Node.js 20 o 22 (LTS recomendado).
- pnpm 10 (`corepack enable` lo activa automáticamente según `packageManager` en `package.json`).
- PostgreSQL 14+ (local, o vía Docker Compose).
- Docker y Docker Compose (opcional, para desarrollo con Postgres en contenedor o para producción).

## Instalación

```bash
pnpm install
```

## Variables de entorno

Cada app tiene su propio `.env.example`:

- [`apps/api/.env.example`](apps/api/.env.example) → copiar a `apps/api/.env`.
- [`apps/web/.env.example`](apps/web/.env.example) → copiar a `apps/web/.env`.
- [`.env.example`](.env.example) (raíz) → usado por `docker-compose.yml`; copiar a `.env` si se despliega con Docker.

Variables clave del backend:

| Variable | Descripción |
|---|---|
| `DATABASE_URL` | Cadena de conexión a PostgreSQL. |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Secretos JWT, mínimo 32 caracteres, distintos entre sí. |
| `CORS_ORIGIN` | Orígenes permitidos, separados por coma. |
| `COOKIE_DOMAIN` | Dominio de la cookie de refresh (vacío en desarrollo local). |
| `BOOTSTRAP_ADMIN_USERNAME` / `BOOTSTRAP_ADMIN_PASSWORD` / `BOOTSTRAP_ADMIN_FULLNAME` | Solo se usan una vez, al ejecutar el script de creación del primer administrador. |

## Desarrollo local (sin Docker)

1. Levanta PostgreSQL localmente y crea una base de datos vacía.
2. Configura `apps/api/.env` con tu `DATABASE_URL`.
3. Compila los paquetes compartidos (requerido antes de `dev`, ya que `@barapp/contracts` y `@barapp/config` se compilan a CommonJS para que Nest pueda `require`los):

   ```bash
   pnpm build:packages
   ```

4. Migraciones:

   ```bash
   pnpm --filter @barapp/api prisma:migrate
   ```

5. Crear el primer administrador (usa las variables `BOOTSTRAP_ADMIN_*` de `apps/api/.env`):

   ```bash
   pnpm --filter @barapp/api bootstrap:admin
   ```

6. Backend:

   ```bash
   pnpm dev:api
   ```

7. Frontend (en otra terminal), con `apps/web/.env` apuntando a `VITE_API_URL=http://localhost:4000/api`:

   ```bash
   pnpm dev:web
   ```

La API queda en `http://localhost:4000/api` y el frontend en `http://localhost:5173`.

## Desarrollo con Docker Compose (solo PostgreSQL)

Si prefieres no instalar PostgreSQL localmente:

```bash
docker compose up -d postgres
```

Y sigue los mismos pasos de migraciones/administrador/dev de arriba, apuntando `DATABASE_URL` a `localhost:5432`.

## Migraciones

```bash
pnpm --filter @barapp/api prisma:migrate          # desarrollo (crea y aplica)
pnpm --filter @barapp/api prisma:migrate:deploy    # producción (solo aplica migraciones existentes)
```

Las restricciones que PostgreSQL exige y Prisma no puede expresar de forma nativa (una orden `OPEN` por mesa, un turno `OPEN` por caja, una sesión de billar activa/pausada por mesa) están en la migración `partial_unique_constraints` como índices únicos parciales (`CREATE UNIQUE INDEX ... WHERE ...`).

## Creación del administrador

```bash
pnpm --filter @barapp/api bootstrap:admin
```

Es seguro ejecutarlo varias veces: si el usuario ya existe, no lo modifica. No hay credenciales hardcodeadas en el código; todo viene de variables de entorno.

## Ejecución de pruebas

```bash
pnpm test
```

Corre las pruebas unitarias de `packages/config` y `apps/api` (cálculo de billar, redondeo de minutos, conversión de tarifa, efectivo esperado, cambio, promociones, estado de inventario, matriz de permisos).

### Prueba end-to-end

```bash
pnpm --filter @barapp/api test:e2e
```

Ejercita contra una base de datos real (usa `DATABASE_URL` de `apps/api/.env`) el flujo: login administrador → crear categoría/producto/mesa → abrir mesa (dos toques concurrentes recuperan la misma orden) → agregar producto → verificar descuento de inventario → abrir caja → cobrar (reintento con la misma `Idempotency-Key` no duplica el pago) → verificar que la mesa quede libre → cerrar turno y verificar el corte. También verifica que un rol sin permiso reciba 403.

Como esta prueba escribe filas financieras reales y, por diseño, el sistema nunca las borra físicamente, **apunta `DATABASE_URL` a una base de datos de pruebas dedicada** al ejecutarla en CI — no a la base de producción.

## Construcción para producción

```bash
pnpm build:packages
pnpm --filter @barapp/api build     # -> apps/api/dist (Nest standalone)
pnpm --filter @barapp/web build     # -> apps/web/dist (estático)
```

## Despliegue con Docker

```bash
cp .env.example .env   # y edítalo
docker compose build
docker compose up -d
```

Esto levanta `postgres`, `api` (puerto 4000, con healthcheck en `/api/health`) y `web` (puerto 8080, servido por nginx). Después de levantar por primera vez:

```bash
docker compose exec api pnpm prisma:migrate:deploy
docker compose exec api pnpm bootstrap:admin
```

## Despliegue en servidor propio (Coolify)

El proyecto no está acoplado a Coolify: son tres servicios de contenedor independientes (`apps/api/Dockerfile`, `apps/web/Dockerfile`, PostgreSQL) con variables de entorno estándar. En Coolify:

1. Crea un recurso PostgreSQL administrado por Coolify (o usa uno externo) con volumen persistente.
2. Crea una app a partir de `apps/api/Dockerfile` (contexto de build = raíz del repo). Configura `DATABASE_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `CORS_ORIGIN`, `COOKIE_DOMAIN`, `PORT`. Configura el healthcheck en `/api/health`. Política de reinicio: `unless-stopped` o `always`.
3. Crea una app a partir de `apps/web/Dockerfile` (contexto = raíz del repo), con `VITE_API_URL` apuntando al dominio público de la API como build arg.
4. Ejecuta `prisma:migrate:deploy` y `bootstrap:admin` como tareas puntuales (Coolify permite ejecutar comandos dentro del contenedor, o hazlo antes del primer despliegue).
5. Configura logs estructurados y backups periódicos de PostgreSQL (ver abajo).

## Copias de seguridad de PostgreSQL

```bash
docker compose exec postgres pg_dump -U postgres -d barapp -F c -f /tmp/barapp.dump
docker compose cp postgres:/tmp/barapp.dump ./backups/barapp-$(date +%Y%m%d).dump
```

O sin Docker, directamente:

```bash
pg_dump -U postgres -h localhost -d barapp -F c -f barapp-$(date +%Y%m%d).dump
```

## Restauración de la base de datos

```bash
pg_restore -U postgres -h localhost -d barapp --clean --if-exists barapp-YYYYMMDD.dump
```

Restaura siempre contra una base de datos que puedas recrear/limpiar; nunca contra producción sin una copia previa fresca.

## Arquitectura y decisiones

- **Dinero**: siempre en centavos, enteros (`Int` en Prisma). Nunca punto flotante.
- **Tiempo**: `createdAt`/timestamps en UTC; promociones y visualización usan `America/Tijuana` calculado en el backend, nunca en el reloj del dispositivo.
- **Autenticación**: JWT de acceso de corta duración (15 min) + refresh token con rotación, almacenado en cookie `HttpOnly` (nunca en `localStorage`).
- **Permisos**: matriz central en `packages/config` (`PERMISSIONS`), validada en cada endpoint del backend vía `@RequirePermission` + `JwtAuthGuard`. El frontend solo la usa para ocultar UI (`usePermission`) — ocultar un botón no es una medida de seguridad.
- **Idempotencia**: operaciones críticas (agregar producto, cobrar, iniciar/finalizar billar, abrir/cerrar caja) requieren una `Idempotency-Key`; un reintento de red no duplica la operación.
- **Concurrencia**: abrir una mesa es atómico vía una restricción única parcial de PostgreSQL; si dos dispositivos tocan la misma mesa al mismo tiempo, uno crea la orden y el otro la recupera automáticamente.
- **Sincronización**: polling con TanStack Query (mesas y orden activa cada pocos segundos); el cronómetro de billar se calcula en el cliente a partir de un timestamp del servidor, sin consultar cada segundo.
