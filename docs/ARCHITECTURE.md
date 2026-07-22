# Move yA — Arquitectura del MVP

Plataforma SaaS multi-tenant para la gestión integral de estudios de Pilates.
WebApp responsive (React + TypeScript) pensada para escalar a app nativa.

---

## 1. Esquema de Base de Datos

El modelo relacional completo vive en [`prisma/schema.prisma`](../prisma/schema.prisma)
(PostgreSQL en producción; SQLite para desarrollo local). Relación central:

```
Studio (tenant, CEU)
  ├── StudioBranding        (white-label: colores, tipografía, logo, video)
  ├── StudioServiceConfig   (toggles: Nutrición / Kinesiología / Med. Deportiva)
  ├── Subscription ──── Payment[]     ($34 USD/mes, verificación de pago)
  ├── User (Role: STUDIO_ADMIN | COACH | STUDENT)
  │     ├── CoachProfile (bio)                     [COACH]
  │     ├── UserPackage[] ── Booking[]             [STUDENT]
  │     ├── StarLedger[] / RewardRedemption[]      [STUDENT: gamificación]
  │     └── Goal[] / ServiceBooking[]              [STUDENT]
  ├── Package ──< PackageEligibleClasses >── ClassTemplate
  │     └── UserPackage[]  (créditos, vigencia)
  ├── ClassTemplate ── ClassSession[] (calendario, capacity → "Quedan X lugares")
  │     └── Booking[]
  └── Reward[]  (catálogo canjeable por estrellas)
```

**Cadena pedida** `Estudios <-> Paquetes <-> Usuarios <-> Reservas <-> Gamificación`:

| Relación | Modelos | Tipo |
|---|---|---|
| Estudio → Paquetes | `Studio` → `Package` | 1:N |
| Paquete ↔ Usuario | `Package` → `UserPackage` → `User` | N:M (instanciado) |
| Usuario → Reserva | `User` → `Booking` → `ClassSession` | 1:N |
| Reserva → Gamificación | `Booking` → `StarLedger` (+1★ por asistencia) | 1:1 |
| Gamificación → Recompensa | `StarLedger` (−★) ← `RewardRedemption` → `Reward` | N:1 |

La **disponibilidad en tiempo real** se calcula como
`ClassSession.capacity − count(Booking where status != CANCELED)`.

---

## 2. Rutas de Navegación por Rol

Onboarding común en `/` (video de marca + input CEU). Al autenticarse, el rol
determina el _home_ y las rutas accesibles (guardas en `src/App.tsx`).

### Estudio / Admin — `/admin/*`  · protegido por verificación de pago
| Ruta | Pantalla |
|---|---|
| `/admin` | Dashboard (KPIs, próximas clases) |
| `/admin/calendar` | Calendario completo del estudio |
| `/admin/packages` | **Gestión de Paquetes** (precio, vigencia, clases) |
| `/admin/coaches` | Coaches y perfiles |
| `/admin/services` | Toggles de servicios opcionales |
| `/admin/branding` | White-label (colores, tipografía, logo) |
| `/admin/reports` | Reportes y métricas |
| `/admin/subscription` | Suscripción $34/mes (única ruta siempre accesible) |

> Si `Subscription` no está vigente → `SubscriptionGate` bloquea todo `/admin/*`
> excepto `/admin/subscription`.

### Coach — `/coach/*` (acceso restringido)
| Ruta | Pantalla |
|---|---|
| `/coach` | Dashboard (agenda y alumnos) |
| `/coach/calendar` | Solo sus clases + roster de inscritos |
| `/coach/profile` | Perfil / bio editable |

### Usuario / Alumno — `/app/*`
| Ruta | Pantalla |
|---|---|
| `/app` | Dashboard (estrellas, créditos, reservas) |
| `/app/book` | Reserva de clases (disponibilidad en vivo) |
| `/app/packages` | Mis paquetes + catálogo / compra |
| `/app/rewards` | Gamificación: estrellas y canje |
| `/app/services` | Servicios opcionales activos |
| `/app/goals` | Historial de metas |

---

## 3. Estructura de Componentes

```
src/
├── main.tsx / App.tsx           # bootstrap + enrutado con guardas de rol
├── lib/
│   ├── types.ts                 # tipos del dominio (espejo de Prisma)
│   ├── mockData.ts              # seed (estudio demo, CEU ZEN-2024)
│   ├── store.tsx                # estado + acciones + isSubscriptionActive()
│   └── format.ts                # helpers de fecha/moneda
├── components/
│   ├── ui/index.tsx             # Button, Card, Badge, StatCard, Toggle, PageHeader
│   ├── layout/AppShell.tsx      # sidebar/nav responsive por rol
│   └── WeekCalendar.tsx         # calendario semanal reutilizable
└── features/
    ├── onboarding/OnboardingScreen.tsx
    ├── admin/                   # Dashboard, PackageManagement, CalendarAdmin,
    │                            # CoachesAdmin, ServicesConfig, BrandingSettings,
    │                            # Reports, SubscriptionScreen, SubscriptionGate
    ├── coach/                   # CoachDashboard, CoachCalendar, CoachProfile
    └── student/                 # StudentDashboard, BookClasses, MyPackages,
                                 # Rewards, OptionalServices, Goals
```

### Anatomía de las pantallas clave

- **Dashboard** (`*/Dashboard`): `PageHeader` + fila de `StatCard` + `Card`s de
  contenido (próximas clases, accesos rápidos, paquete activo).
- **Calendario** (`WeekCalendar`): sesiones agrupadas por día; cada tarjeta lleva
  un `Badge` de disponibilidad ("Quedan X") y un _slot_ de acción inyectable
  (`renderAction`) — reservar (alumno) o ver alumnos (coach).
- **Gestión de Paquetes** (`admin/PackageManagement`): grid de `Card`s + modal
  editor con precio, créditos, vigencia y selector de clases participantes.

---

## 4. Branding & White-Label

La paleta **Zen Balance** (`#2D5A4C` bosque / `#F4F1EA` crema / `#333333` gris)
se define en `tailwind.config.js` como valores por defecto y se expone como CSS
custom properties (`--brand-*`). El `StoreProvider` reescribe esas variables en
runtime según `StudioBranding`, de modo que cada estudio ve su propia identidad
sin recompilar. Las utilidades `.bg-brand`, `.text-brand`, etc. leen esos tokens.

---

## 5. Verificación de Pago

`isSubscriptionActive(studio)` (en `lib/store.tsx`) valida `status` +
`currentPeriodEnd`. En producción, un webhook de Stripe actualiza
`Subscription.status`; el componente `SubscriptionGate` envuelve todas las rutas
`/admin/*` y bloquea el panel si el pago mensual venció.

---

## 6. Ejecutar

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # type-check + build de producción
```

**Demo:** CEU `ZEN-2024` → elige rol (Estudio / Coach / Alumno). Los datos se
persisten en `localStorage`; "Reiniciar datos de demostración" restaura el seed.
