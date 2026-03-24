# CmrArena ERP/CRM — Guía de Instalación SuperPRO

## Requisitos previos
- Node.js 20+
- PostgreSQL 16+ (local o en servidor)
- npm 10+

## 1. Configurar la base de datos

Instala PostgreSQL y crea la base de datos:
```sql
CREATE DATABASE cmrarena_dev;
CREATE USER cmrarena WITH PASSWORD 'CmrArena2024!';
GRANT ALL PRIVILEGES ON DATABASE cmrarena_dev TO cmrarena;
```

## 2. Configurar el Backend

```bash
cd backend

# Copiar variables de entorno
cp .env.example .env
# Editar .env con tus datos (DB, mail, etc.)

# Instalar dependencias
npm install

# Generar Prisma Client
npx prisma generate

# Crear tablas en la base de datos
npx prisma migrate dev --name init

# Cargar datos de TerraBlinds (opcional pero recomendado)
npx ts-node prisma/seed.ts

# Iniciar servidor de desarrollo
npm run start:dev
```

El backend estará en: http://localhost:3000
Swagger docs: http://localhost:3000/api/docs

## 3. Configurar el Frontend

```bash
cd ..  # Raíz del proyecto

# Instalar dependencias (si no están ya)
npm install

# Iniciar servidor de desarrollo
npm run dev
```

El frontend estará en: http://localhost:5173

## 4. Acceso al sistema

**Empresa:** terrablinds
**Admin:** admin@terrablinds.cl / TerraBlinds2024!
**Gerente:** gerente@terrablinds.cl / Gerente2024!
**Ventas:** ventas@terrablinds.cl / Ventas2024!

## 5. Con Docker (alternativo)

```bash
# Desde la raíz del proyecto
docker compose up -d

# Primera vez, ejecutar migraciones y seed:
docker compose exec backend npx prisma migrate deploy
docker compose exec backend npx ts-node prisma/seed.ts
```

## 6. Variables de entorno importantes

Editar `backend/.env`:
- `DATABASE_URL`: URL de tu PostgreSQL
- `JWT_SECRET`: Cambia por un string aleatorio de 64+ caracteres
- `JWT_REFRESH_SECRET`: Diferente al anterior
- `MAIL_HOST`: mail.conectaai.cl
- `MAIL_USER`: tu usuario SMTP
- `MAIL_PASS`: tu contraseña SMTP

## 7. Integración con terrablinds.cl

Para integrar con el sitio web:
1. Configurar subdominio: `erp.terrablinds.cl` → servidor VPS
2. Nginx reverse proxy: puerto 80/443 → backend:3000
3. Frontend build: `npm run build` → servir dist/ con Nginx
4. Actualizar CORS_ORIGINS en .env

## Módulos Premium incluidos

- JWT Auth + Refresh Token + Brute Force Protection
- Multi-tenant con aislamiento por row-level
- SII Chile: XML builder + firma digital + envío real
- Email SMTP (mail.conectaai.cl): cotizaciones, alertas, bienvenida
- WebSockets: notificaciones en tiempo real
- Audit Log: trazabilidad completa
- Analytics: KPIs reales desde PostgreSQL
- Exports: Excel para ventas, clientes, inventario
- PDF server-side: cotizaciones profesionales
- RBAC: 6 roles (SuperAdmin, Admin, Manager, Sales, Inventory, Accountant)
- Swagger API docs
