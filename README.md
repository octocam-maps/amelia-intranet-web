# Amelia Intranet — Frontend

React + Vite + TypeScript (strict), feature-sliced (espejo de
`frontend-amelia-solar-V2`), gestor de paquetes **pnpm**. Ver
`../amelia-intranet/CLAUDE.md` y `../amelia-intranet/docs/` para el contrato
funcional completo.

**Fase 1 (actual):** Login con Google + Shell (Sidebar/Topbar por rol) +
Dashboard placeholder. El resto de módulos del navbar aparecen pero están
deshabilitados ("Disponible en una fase posterior") — llegan en Fase 2+.

## Stack

- React 18 + Vite + TypeScript strict
- Tailwind CSS + tokens de marca (`tailwind.config.ts` / `src/index.css`) +
  primitivas Radix (shadcn-ui, solo las necesarias para el Shell en Fase 1:
  Button, Avatar, DropdownMenu, Separator)
- react-router-dom · TanStack Query (server state) · Zustand + immer (client
  state) · lucide-react (iconos) · Hanken Grotesk (tipografía)
- Auth: Google Identity Services (`id_token`) contra `amelia-intranet-back`

## Arrancar en local

### 1. Google Cloud Console

Ver el paso a paso completo en `../amelia-intranet-back/README.md`. Resumen:
crear un OAuth 2.0 Client ID de tipo "Web application" con
`http://localhost:5173` como origen autorizado, y copiar el Client ID a
`VITE_GOOGLE_CLIENT_ID`.

### 2. Instalar y arrancar

```bash
cp .env.example .env   # VITE_API_BASE_URL + VITE_GOOGLE_CLIENT_ID
pnpm install
pnpm dev
```

Requiere `amelia-intranet-back` corriendo en `VITE_API_BASE_URL`
(por defecto `http://localhost:8000`).

### Calidad

```bash
pnpm lint    # ESLint (flat config, eslint 9 + typescript-eslint)
pnpm build   # tsc -b (typecheck estricto) + vite build
```

## Estructura (Fase 1)

```
src/
├── App.tsx, main.tsx          # bootstrap: QueryClientProvider, BrowserRouter, silent refresh
├── routes/                    # react-router — LoginPage pública, resto detrás de ProtectedRoute
├── layouts/AppLayout/         # Sidebar (navbar por rol) + Topbar (avatar/logout)
├── features/auth/             # domain (models/ports) · application (hooks) · infrastructure (adapter/dtos)
│                               # · store (zustand slice) · components · pages
├── features/dashboard/        # placeholder de Fase 1
├── components/ui/             # primitivas shadcn/Radix (Button, Avatar, DropdownMenu, Separator)
├── lib/http/api-client.ts     # fetch wrapper único (credentials: include, 401 -> clearSession)
├── lib/google/                # tipos de Google Identity Services
└── store/                     # store raíz (combina slices con zustand/immer)
```

## Decisiones de auth (Fase 1)

- **Access token SOLO en memoria** (Zustand, sin persist/localStorage) — cumple
  la instrucción explícita de la Fase 1. Tras un F5 no hay nada que
  rehidratar: `useAuthBootstrap` llama a `POST /auth/refresh` (cookie
  HttpOnly) al montar la app y, si hay sesión, trae el perfil con `GET /auth/me`.
- **`credentials: 'include'`** en todas las llamadas (`src/lib/http/api-client.ts`)
  — imprescindible para que la cookie HttpOnly del refresh token viaje.
- **Navbar por rol es SOLO visual** (`layouts/AppLayout/nav-config.ts`, según
  `docs/permisos-roles.md`). La protección real de cada módulo vive en el
  backend (`require_role`) — el frontend nunca es la última línea de defensa.
- **Sesiones revocables server-side** (ver `amelia-intranet-back/README.md`):
  el backend ahora persiste cada refresh token (`auth_sessions` + `jti`) y
  expone `POST /auth/logout-all` para cerrar sesión en todos los
  dispositivos. El contrato de `/auth/login`, `/auth/refresh` y
  `/auth/logout` que ya consume este frontend no cambió — no hizo falta
  tocar `auth-api.adapter.ts`. `logout-all` todavía no tiene botón en el
  Topbar (no se pidió para esta ronda); añadirlo es una llamada más al
  adapter cuando se decida dónde exponerlo (¿"Mi perfil"? ¿ajustes de
  seguridad?).

## Pendiente / sin verificar (honesto)

- **Login real de Google no se pudo probar** sin credenciales — `GoogleSignInButton`
  se verificó por lectura de código e inspección visual del render (botón +
  mensaje de `VITE_GOOGLE_CLIENT_ID` ausente), no con un login real end-to-end.
- Módulos con `comingSoon: true` en `nav-config.ts` no tienen página ni ruta
  todavía — se muestran deshabilitados a propósito (no ocultos del todo) para
  que el mapa de navegación completo sea visible desde Fase 1.
- No hay tests automatizados de componentes todavía (Vitest/Testing Library)
  — Fase 1 se verificó con `pnpm lint` + `pnpm build` (typecheck). Añadir
  cuando entren los módulos con lógica real (Fase 2+).
