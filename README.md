# 🚀 Prevalentware - Sistema de Gestión de Movimientos Financieros

Un sistema completo para la gestión de movimientos financieros con autenticación, roles y reportes avanzados, construido con Next.js Page Router.

## 📋 Descripción del Proyecto

**Prevalentware** es un sistema web desarrollado con **Next.js** que permite a los usuarios gestionar sus movimientos financieros (ingresos y egresos) con un sistema completo de autenticación, roles administrativos y generación de reportes.

### ✨ Características Principales

- **🔐 Autenticación segura** con Better Auth y GitHub OAuth
- **👥 Sistema de roles** (USER/ADMIN) con permisos granularizados
- **💰 Gestión de movimientos** financieros (ingresos/egresos)
- **📊 Reportes avanzados** con gráficos y exportación a CSV
- **🛡️ Validación robusta** de datos en frontend y backend
- **📚 API documentada** con Swagger
- **⚡ Alto rendimiento** con Bun runtime

## 🛠️ Stack Tecnológico

### Frontend
- **Next.js 14** con Page Router
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilización
- **React Hook Form** - Manejo de formularios

### Backend
- **Next.js API Routes** - Endpoints API
- **Prisma ORM** - Base de datos y migraciones
- **PostgreSQL** - Base de datos (via Supabase)
- **Better Auth** - Autenticación y sesiones
- **Zod** - Validación de esquemas

### Runtime & Tools
- **Bun** - Runtime y package manager
- **Supabase** - Base de datos PostgreSQL
- **GitHub OAuth** - Autenticación social

## 📁 Estructura del Proyecto

```
├── components/           # Componentes React reutilizables
│   ├── layout/          # Layout (Header, Sidebar, AuthGuard)
│   └── ui/              # UI base (Button, Input, Card, Badge)
├── hooks/               # Custom React hooks
│   └── useAuth.ts       # Hook para autenticación
├── lib/                 # Utilidades y configuraciones
│   ├── auth/            # Configuración de Better Auth
│   ├── auth-utils.ts    # Utilidades de autenticación y roles
│   ├── balance-calculator.ts # Cálculos financieros
│   ├── validation.ts    # Esquemas de validación Zod
│   └── prisma.ts        # Cliente de Prisma
├── pages/               # Páginas y endpoints API
│   ├── admin/           # Páginas de administración
│   │   ├── docs.tsx     # Documentación API
│   │   ├── reports.tsx  # Reportes y gráficos
│   │   └── users.tsx    # Gestión de usuarios
│   ├── api/             # Endpoints API
│   │   ├── auth/        # Autenticación Better Auth
│   │   ├── movements/   # Gestión de movimientos
│   │   ├── reports/     # Reportes y exportación
│   │   └── users/       # Gestión de usuarios
│   ├── movements/       # Páginas de movimientos
│   │   ├── index.tsx    # Lista de movimientos
│   │   └── new.tsx      # Crear movimiento
│   ├── dashboard.tsx    # Dashboard principal
│   └── index.tsx        # Página de inicio
├── prisma/              # Esquema de base de datos
│   └── schema.prisma    # Modelos de datos
├── public/              # Archivos estáticos
└── types/               # Definiciones TypeScript
```

## 🚀 Instalación y Despliegue Local

### Prerrequisitos
- **Bun** (runtime requerido)
- **Cuenta de GitHub** (para OAuth)
- **Supabase** (base de datos)

### 1. Clonar y Configurar

```bash
# Clonar el repositorio
git clone <repository-url>
cd prevalentware

# Instalar dependencias con Bun
bun install
```

### 2. Configurar Variables de Entorno

El archivo `.env.local` ya debe contener:

```env
# 🌐 Configuración general
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NODE_ENV=development
PORT=3000

# 🧱 App info
APP_NAME="Prevalentware"
LOG_LEVEL=debug

# 🗄️ Base de datos Supabase
DATABASE_URL="postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres"

# 🔐 Better Auth
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET="tu-clave-secreta"

# 🔑 GitHub OAuth
GITHUB_CLIENT_ID="tu-client-id"
GITHUB_CLIENT_SECRET="tu-client-secret"
```

### 3. Configurar Base de Datos

```bash
# Generar cliente Prisma
bunx prisma generate

# Ejecutar migraciones
bunx prisma db push

# (Opcional) Abrir Prisma Studio para ver datos
bunx prisma studio
```

### 4. Ejecutar la Aplicación

```bash
# Modo desarrollo
bun run dev

# La aplicación estará en http://localhost:3000
```

## Endpoints de la APP

- `/dashboard` - Página principal
- `/movements` - Movimientos
- `/movements/new` - Agregar movimientos (Sólo para Administrador)
- `/admin/users` - Usuarios (Sólo para Administrador)
- `/admin/reports` - Reportes gráficos (Sólo para Administrador)

## 📊 Endpoints de la API

### 💰 Movimientos
- `GET /api/movements` - Listar movimientos del usuario (con paginación y filtros)
- `POST /api/movements` - Crear nuevo movimiento
- `GET /api/movements/admin` - Listar todos los movimientos (solo admin)

### 👥 Usuarios
- `GET /api/users` - Listar usuarios (solo admin)
- `GET /api/users/[id]` - Obtener usuario específico (solo admin)
- `PUT /api/users/[id]` - Actualizar usuario (solo admin)

### 📈 Reportes
- `GET /api/reports/summary` - Datos para gráficos (solo admin)
- `GET /api/reports/export` - Exportar a CSV (solo admin)

### 📚 Documentación
- `GET /api/docs` - Documentación Swagger JSON
- Página: `/admin/docs` - UI de documentación

## 🎯 Flujos de Usuario

### Para Usuarios Regulares
1. **Iniciar sesión** con GitHub OAuth
2. **Ver dashboard** en `/dashboard` con resumen financiero
3. **Gestionar movimientos** en `/movements`
   - Ver listado con paginación
   - Crear nuevos ingresos/egresos
   - Filtrar por tipo (INCOME/EXPENSE)

### Para Administradores
1. **Acceder a panel admin** en rutas `/admin/*`
2. **Gestionar usuarios** en `/admin/users`
   - Ver todos los usuarios
   - Editar roles e información
   - Prevención de auto-edición de rol
3. **Generar reportes** en `/admin/reports`
   - Gráficos de ingresos/egresos
   - Filtros por usuarios y períodos
   - Exportación a CSV
4. **Ver documentación** en `/admin/docs`

## 🔧 Comandos Útiles

```bash
# Desarrollo
bun run dev           # Servidor desarrollo
bun run build         # Build producción
bun run start         # Servidor producción

# Base de datos
bunx prisma generate  # Generar cliente Prisma
bunx prisma db push   # Sincronizar esquema
bunx prisma studio    # Cliente visual BD

# Calidad de código
bun run lint          # ESLint

# Documentación
# Acceder a /admin/docs en el navegador
```

## 🗃️ Modelos de Base de Datos

### User
```prisma
model User {
  id            String    @id
  name          String
  email         String
  emailVerified Boolean
  role          String    @default("USER")
  image         String?
  createdAt     DateTime
  updatedAt     DateTime
  sessions      Session[]
  accounts      Account[]
  movements     Movement[]
}
```

### Movement
```prisma
model Movement {
  id          String   @id @default(cuid())
  amount      Float
  description String
  type        String   // "INCOME" o "EXPENSE"
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## 🔐 Sistema de Autenticación y Roles

### Better Auth + GitHub OAuth
- Autenticación segura con sesiones
- Integración con GitHub OAuth
- Manejo automático de tokens

### Sistema de Roles
- **USER**: 
  - Gestionar sus propios movimientos
  - Ver dashboard personal
- **ADMIN**:
  - Acceso completo al sistema
  - Gestión de todos los usuarios
  - Reportes globales
  - Exportación de datos

### Seguridad Implementada
- Validación de sesión en todos los endpoints
- Prevención de auto-edición de rol
- Protección de rutas por roles
- Validación robusta con Zod

## 📈 Sistema de Reportes

### Gráficos y Análisis
- **Evolución temporal** de ingresos vs egresos
- **Balance acumulado** histórico
- **Filtros avanzados**:
  - Períodos (día, semana, mes, año)
  - Usuarios específicos o todos
  - Fechas personalizadas

### Exportación CSV
- Formato compatible con Excel
- Montos formateados para español
- Encoding UTF-8
- Totales automáticos incluidos

## 🚀 Despliegue en Producción

### Preparación para Producción
```bash
# Build de producción
bun run build

# Verificar build
bun run start
```

### Variables de Entorno para Producción
```env
NODE_ENV=production
NEXT_PUBLIC_APP_URL=https://tudominio.com
DATABASE_URL="postgresql://..."
BETTER_AUTH_SECRET="clave-secreta-fuerte-produccion"
GITHUB_CLIENT_ID="prod-client-id"
GITHUB_CLIENT_SECRET="prod-client-secret"
```

### Plataformas Recomendadas
- **Vercel** (óptimo para Next.js)
- **Netlify**
- **Railway**
- **Digital Ocean App Platform**

## 🤝 Soporte y Contribución

Para reportar issues o contribuir:
1. Verificar la documentación en `/admin/docs`
2. Revisar los logs en desarrollo con `LOG_LEVEL=debug`
3. Utilizar Prisma Studio para diagnóstico de datos

## 📝 Notas Técnicas

- **Next.js Page Router**: La aplicación utiliza el Page Router tradicional
- **Bun Runtime**: Optimizado para el ecosistema Bun
- **Supabase**: Base de datos PostgreSQL con connection pooling
- **Better Auth**: Solución moderna de autenticación

---

**¿Problemas?** Revisa la documentación en `/admin/docs` o verifica los logs con `LOG_LEVEL=debug`.