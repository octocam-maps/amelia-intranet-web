# Amelia Intranet — Frontend

React + Vite + TypeScript (strict), feature-sliced (espejo de
`frontend-amelia-solar-V2`), gestor de paquetes **pnpm**. Ver
`../amelia-intranet/CLAUDE.md` y `../amelia-intranet/docs/` para el contrato
funcional completo.

**Fase 1 (actual):** Login con Google (split-screen + One Tap híbrido) +
Shell (Sidebar/Topbar por rol) + Dashboard placeholder. El resto de módulos
del navbar aparecen pero están deshabilitados ("Disponible en una fase
posterior") — llegan en Fase 2+.

## Stack

- React 18 + Vite + TypeScript strict
- **CSS Modules + Radix** (mirror de `frontend-amelia-solar-V2` — NO
  Tailwind, NO shadcn-Tailwind): tokens de marca como variables CSS en
  `src/index.css`, `cn` helper (`src/lib/utils.ts`) para componer nombres de
  clase, primitivas Radix con comportamiento + `.module.css` con estilo en
  `src/components/ui/` (solo lo necesario en Fase 1: Button, Avatar,
  DropdownMenu, Separator)
- react-router-dom · TanStack Query (server state) · Zustand + immer (client
  state) · lucide-react (iconos) · Manrope (tipografía, CDN de Google Fonts)
- Auth: Google Identity Services (`id_token` + One Tap) contra
  `amelia-intranet-back`

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
pnpm test    # vitest run
pnpm build   # tsc -b (typecheck estricto) + vite build
```

## Estructura (Fase 1)

```
src/
├── App.tsx, main.tsx          # bootstrap: QueryClientProvider, BrowserRouter, silent refresh
├── routes/                    # react-router — LoginPage pública, resto detrás de ProtectedRoute
├── layouts/AppLayout/         # Sidebar (navbar por rol) + Topbar (avatar/logout), CSS Modules
├── features/auth/             # domain (models/ports) · application (hooks) · infrastructure (adapter/dtos)
│                               # · store (zustand slice) · components (login, CSS Modules) · pages
├── features/dashboard/        # placeholder de Fase 1
├── components/ui/             # primitivas Radix + CSS Modules (Button, Avatar, DropdownMenu, Separator)
├── components/PageLoader/     # spinner de pantalla completa
├── lib/http/api-client.ts     # fetch wrapper único (credentials: include, 401 -> clearSession)
├── lib/google/                # tipos de Google Identity Services (incluye One Tap / prompt)
├── lib/utils.ts               # cn() — sin tailwind-merge, solo filtra falsy y concatena
├── test/setup.ts              # jest-dom para vitest
└── store/                     # store raíz (combina slices con zustand/immer)
```

Cada componente de `components/ui/` y de `layouts/AppLayout/` sigue el
patrón `Componente.tsx` + `Componente.module.css` + `index.ts`, igual que
`frontend-amelia-solar-V2`.

## Login (split-screen + Google One Tap híbrido)

`LoginPage` sigue el boceto de Fase 1 · Acceso: panel izquierdo de marca
(`LoginBrandPanel`, navy con glow de marca y bullets de valor) + panel
derecho de acción (`GoogleAuthPanel`). En móvil el panel de marca se
colapsa a una banda compacta (logo + titular) para no empujar el login
fuera de la primera pantalla.

Auth híbrida (`useGoogleOneTap`, en `application/`):
1. Al montar, inicializa Google Identity Services con **One Tap +
   `auto_select: true`** y `use_fedcm_for_prompt: true` — si el usuario ya
   dio su consentimiento y tiene una única sesión de Google, entra **sin
   clic**.
2. Si Google no puede mostrarlo (`isNotDisplayed`/`isSkippedMoment`/
   `isDismissedMoment`), cae al **botón oficial de Google** como respaldo
   visible (`renderButton`), montado en el mismo contenedor pero oculto
   hasta que hace falta — para no parpadear un botón que casi siempre va a
   desaparecer solo.
3. Ambos caminos comparten el mismo `callback` de GIS → mismo
   `useLoginWithGoogle` → mismo `POST /auth/login` de siempre. No se tocó
   el backend ni `auth-api.adapter.ts`.

## Testing

```bash
pnpm test    # vitest run
```

Primer test de componente del proyecto: `LoginPage.test.tsx` monta la
página (con `MemoryRouter` + `QueryClientProvider`) y verifica que cae al
aviso de "falta configurar Google" cuando `VITE_GOOGLE_CLIENT_ID` no está
seteado — usa `vi.stubEnv` para no depender del `.env` real. El flujo
completo de One Tap/FedCM no es testeable en unit (necesita el SDK real de
Google y un navegador); eso lo valida quien tenga credenciales reales en
un navegador.

## Decisiones de auth (Fase 1)

- **Access token SOLO en memoria** (Zustand, sin persist/localStorage) — cumple
  la instrucción explícita de la Fase 1. Tras un F5 no hay nada que
  rehidratar: `useAuthBootstrap` llama a `POST /auth/refresh` (cookie
  HttpOnly) al montar la app y, si hay sesión, trae el perfil con `GET /auth/me`.
- **Single-flight en el refresh** (`src/features/auth/infrastructure/refresh-single-flight.ts`):
  `useAuthBootstrap` NO llama a `authApiAdapter.refresh()` directo, sino a
  `refreshSessionSingleFlight()`, que comparte una única promesa entre
  llamadores concurrentes. Bug real encontrado en el E2E: React StrictMode
  (dev) monta el efecto de bootstrap dos veces, y sin esto cada montaje
  disparaba su propio `POST /auth/refresh` con el MISMO refresh token —
  el backend terminaba con sesiones duplicadas o, peor, con la detección de
  reuso revocando la sesión por error. El backend tiene su propia defensa en
  profundidad (revocación de familia ante reuso de `jti`), pero la corrección
  primaria es esta: que nunca se disparen dos refresh concurrentes desde el
  mismo cliente.
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

- **Login real de Google (One Tap y botón de respaldo) no se pudo probar**
  sin credenciales ni navegador real — verificado por lectura de código,
  `pnpm build`/`pnpm lint`/`pnpm test`, y el test de `LoginPage` que cubre la
  rama sin `VITE_GOOGLE_CLIENT_ID`. Falta validar en navegador: auto-login
  real con una sola sesión de Google, y que el fallback se muestre
  correctamente cuando One Tap no aparece.
- Módulos con `comingSoon: true` en `nav-config.ts` no tienen página ni ruta
  todavía — se muestran deshabilitados a propósito (no ocultos del todo) para
  que el mapa de navegación completo sea visible desde Fase 1.
- Cobertura de tests todavía mínima (1 test de render) — se amplía cuando
  entren los módulos con lógica real (Fase 2+).
- Migración de Tailwind a CSS Modules verificada con `pnpm lint`/`test`/`build`
  y revisión visual del CSS generado (opacidades `hsl(var(--x) / N)` se
  resuelven nativas, sin el problema de los modificadores de opacidad de
  Tailwind sobre tokens sin `<alpha-value>` que tuvimos antes) — sin
  screenshot/QA visual en navegador real todavía.
