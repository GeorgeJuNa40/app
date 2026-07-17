# Move yA

**Plataforma integral de gestión de estudios de Pilates** — MVP SaaS multi-tenant.

WebApp responsive (React + TypeScript + Vite + Tailwind) con arquitectura
multirrol, gamificación, gestión de paquetes, white-label y verificación de pago.

## Stack

- **Frontend:** React 18 + TypeScript + Vite + React Router
- **Estilos:** Tailwind CSS (paleta *Zen Balance*, white-label en runtime)
- **Datos:** capa mock persistida en `localStorage` (seed en `src/lib/mockData.ts`)
- **DB (modelo):** Prisma / PostgreSQL — ver [`prisma/schema.prisma`](prisma/schema.prisma)

## Roles

| Rol | CEU demo | Acceso |
|---|---|---|
| Estudio (Admin) | `ZEN-2024` | Gestión total + suscripción $34 USD/mes |
| Coach | `ZEN-2024` | Calendario propio, alumnos, perfil |
| Alumno | `ZEN-2024` | Reservas, paquetes, gamificación, servicios, metas |

En el onboarding se ingresa el **Código de Estudio Único (CEU)** y luego se elige
el rol (en producción el rol proviene de la cuenta del usuario).

## Ejecutar

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # verificación de tipos + build de producción
```

## Documentación

Esquema de base de datos, rutas por rol y estructura de componentes:
👉 [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
