# CLAUDE.md — amelia-intranet-web

Guía para Claude Code (claude.ai/code) en este repositorio.

## Qué es

Frontend de la **intranet de RRHH y onboarding del grupo Amelia** (Hub / Lab / Ops). Sustituye a
Holded. **React 18 + Vite 5 + TypeScript + pnpm**, arquitectura feature-sliced.

Consume `amelia-intranet-back` (FastAPI + asyncpg). El backend es **el mismo** que usa
`amelia-intranet-mobile`: si cambias un contrato, mira si el móvil lo consume.

La documentación funcional vive en el repo hermano `amelia-intranet/`:
`docs/permisos-roles.md` (control de acceso), `docs/brief-diseno.md` (inventario de pantallas),
`docs/identidad-visual.md` (marca).

Es un proyecto **nuevo e independiente** de los frontends de inspección solar del grupo
(`frontend-amelia-solar-V2`, `amelia-admin`, `amelia-front`). De ellos solo se heredaron los tokens de
marca y las convenciones de arquitectura.

## Comandos

```bash
pnpm dev            # vite
pnpm build          # tsc -b && vite build   ← el build REAL, el que corre el despliegue
pnpm test           # vitest run — 71 ficheros, 441 tests
pnpm lint           # eslint .
pnpm e2e            # Playwright: auditoría de UI + regresión visual (necesita backend, ver abajo)
pnpm e2e:hallazgos  # agrupa el registro de la auditoría POR CAUSA
```

**`tsc --noEmit` no compila nada en este repo** — la config usa referencias de proyecto. Para
comprobar tipos usa `pnpm build`, que ejecuta `tsc -b`. Un error de tipos en un test rompe el build de
producción, y eso es intencionado.

## Arquitectura: feature-sliced

`src/features/<nombre>/` con cinco carpetas y una dirección de dependencia que no se invierte:

```
domain/          modelos y reglas. TypeScript puro, sin React ni fetch
application/     hooks de caso de uso (TanStack Query). Orquestan, no pintan
infrastructure/  adaptadores HTTP + mappers DTO→modelo
components/      piezas de la feature
pages/           la pantalla que monta la ruta
```

19 features: `absences`, `announcements`, `auth`, `dashboard`, `departments`, `documents`,
`email-templates`, `help`, `holidays`, `invitations`, `mailbox`, `manuals`, `notifications`,
`onboarding`, `profile`, `roles`, `staff`, `team`, `time-clock`.

Transversal: `components/ui/` (primitivos sobre Radix), `components/composites/`, `layouts/AppLayout/`
(Topbar + Sidebar), `routes/`, `store/` (Zustand), `lib/`, `hooks/`.

**Estado servidor con TanStack Query, estado de UI con Zustand.** No metas datos de servidor en
Zustand.

## Marca y color — donde más se falla

Los tokens viven en `src/index.css` como tripletes HSL. **Cambiar el token es la única forma de cambiar
el producto**: un literal `#00D170` escrito a mano en un `.module.css` se escapa del sistema y es
justamente el que está mal.

- Primario **verde `#00D170`**, navy `#0F1729` (header/sidebar/texto), fondo `#F9FAFB`.
- El azul de info es **`#1D4FD7`** (6,66:1 con blanco). NO uses `#3B82F6`: da 3,68:1 y falla AA, aunque
  aparezca "recomendado" en documentación antigua.

### La regla del `-on-tint`

Un color de estado **como color de TEXTO sobre fondo claro** nunca usa el token puro: usa su variante
`-on-tint`, que es el mismo tono con la luminosidad medida para leerse.

| Como texto sobre claro | Puro | Con `-on-tint` |
|---|---|---|
| verde `--success` / `--primary` | 1,83–2,03:1 ✗ | `--success-on-tint` `#007A42` → 4,91–5,44:1 ✓ |
| ámbar `--warning` | 2,13:1 ✗ | `--warning-on-tint` `#8E5C06` → 5,70:1 ✓ |
| rojo `--destructive` | 3,78:1 ✗ | `--destructive-on-tint` `#CA1111` → 5,83:1 ✓ |

El color PURO sí se queda en bordes, puntos, barras y fondos: la norma habla de texto, no de
decoración. Y sobre superficie navy el verde puro es correcto — no lo oscurezcas ahí (`LoginPage`,
`AnonymousMailboxPage`).

**Excepción aprobada por el team-lead:** texto **blanco sobre** el verde/ámbar/rojo sólidos incumple AA
(2,03:1 / 2,13:1 / 3,78:1) y se mantiene por criterio visual. Está documentada en el token,
`lib/a11y/palette.test.ts` afirma el ratio real como canario, y la auditoría E2E la lista como
excepción explícita. **No la "arregles"** — y si tocas el verde, ese test salta y hay que volver a
medir.

`src/lib/a11y/contrast.ts` es la utilidad de medición. Úsala antes de proponer un color; no estimes a
ojo.

## Iconografía

**`lucide-react` NO está instalado y no se va a instalar.** El patrón del proyecto es portar a mano el
glifo estilo-lucide como SVG propio en `src/components/icons/index.tsx` (30 iconos hoy), sin
dependencia en runtime. Para lo cubierto por `@radix-ui/react-icons`, usa ese paquete.

## Accesibilidad: lo aprendido a golpes

- **El `<h1>` es único y vive en el Topbar** (`layouts/AppLayout/Topbar.tsx`), y su texto sale de
  `pageTitleForPath`. Por debajo de 768 px pasa a `sr-only` **a propósito**: sigue en el árbol de
  accesibilidad sin ocupar ancho. `Topbar.a11y.test.tsx` protege esa decisión — no lo trates como un
  defecto visual.
- `CardTitle` renderiza `h3` por defecto y acepta `as="h2"`. Cuando una tarjeta cuelga directamente del
  `<h1>` sin sección intermedia, pásale `as="h2"` o dejas un salto de nivel.
- **Una tarjeta clicable no se marca con `role="button"`** si contiene controles dentro: el tabulador
  no puede alcanzarlos (axe: `nested-interactive`). El patrón correcto está en `AnnouncementsList` y
  `AbsenceTypesGrid`: el `<article>`/`<div>` conserva el `onClick` como atajo de ratón y el control
  accesible es un `<button>` en el título.
- **Todo contenedor con scroll necesita `tabIndex={0}` + `role="region"` + `aria-label`**, o quien no
  usa ratón no llega al contenido.
- **Contenido ancho (tablas) desplaza en su propio contenedor, nunca la página.** Y ojo: `overflow-x:
  auto` no funciona si el contenedor es hijo de un flex sin `min-width: 0` — por defecto `min-width` es
  `auto` y se ensancha hasta el contenido en vez de recortarlo. Ese fue el bug de
  `/administracion/onboarding` (583 px de documento en un viewport de 390).
- Los botones de icono llevan `flex-shrink: 0`. Sin él, el flex los aplasta a 16 px de ancho en móvil.
- No uses `Tabs` de Radix para NAVEGAR entre rutas: pone `aria-controls` apuntando a un panel que no
  existe. `ConfigTabsNav` es el ejemplo de cómo se hace — enlaces con `aria-current="page"`.

## Auditoría E2E con Playwright

`e2e/` contiene una suite de auditoría en tres capas: regresión visual, invariantes de UI computadas
(contraste, desbordamiento, texto recortado, área táctil, jerarquía de encabezados) y un agente
auditor. Cubre 21 pantallas × 3 anchos × 5 roles. Ver `e2e/README.md` y `e2e/AUDIT-PROTOCOL.md`.

- **Es una herramienta local: no hay puerta en CI.**
- Necesita el backend arrancado con `GOOGLE_OIDC_PROVIDER=fake` (el web no puede hacer login con
  Google sin intervención humana). Ese modo es un bypass de autenticación con dos guardas
  anti-producción en el backend.
- `e2e/screens.ts` es el catálogo de pantallas y **no puede quedarse obsoleto**:
  `src/test/e2e-screen-catalog.test.ts` lo compara con `NAV_BY_ROLE`, `ADMIN_SECTION_ITEMS` y
  `pageTitleForPath`. Si añades una ruta al navbar y no al catálogo, `pnpm test` falla.
- `e2e/.auth/` guarda cookies de refresco reales. Está en `.gitignore` **como credenciales**.
- Vitest excluye `e2e/**` (`vite.config.ts`): sin eso recogería los `*.spec.ts` de Playwright y
  reventarían en jsdom.

Los baselines visuales son `-darwin`: se generaron en macOS y no valen en Linux.

## Reglas de producto

- **Idioma: español de España**, exclusivamente. En toda la interfaz.
- **RGPD:** el filtrado por usuario ocurre en el BACKEND, no en la UI. Ocultar un ítem del navbar según
  el rol no protege nada: la ruta y el endpoint deben rechazar al rol no autorizado.
- **Cinco roles**: `administrador`, `empleado`, `socio`, `becario`, `externo_invitado`. Matriz completa
  en `amelia-intranet/docs/permisos-roles.md`.
- **Nunca recuadros de aviso genéricos.** El callout con borde de color y fondo teñido está retirado del
  proyecto: el aviso va como línea de texto en el encabezado. Hay un test E2E que lo vigila en el
  onboarding.
- **Onboarding secuencial**, orden vigente: 1 vídeo · 2 cuestionario · 3 manuales · 4 perfil ·
  5 documentación firmada. Máximo 2 intentos en el cuestionario; al fallar se señalan las preguntas
  erradas por su id, nunca la respuesta correcta.
- El organigrama de `Equipo` incrusta un diseño de Canva por iframe. Requiere el dominio de Canva en
  `frame-src` del CSP (`Dockerfile.prod`) antes de pasar el CSP a enforcing.
