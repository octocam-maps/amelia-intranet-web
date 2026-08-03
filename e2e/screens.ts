import type { E2ERole } from './fixtures/users';

/**
 * Catálogo de TODAS las pantallas de la intranet, con el rol o roles que las
 * tienen en su navbar y el título que el Topbar debe mostrar.
 *
 * ## Por qué está escrito a mano y no importado de la app
 *
 * `src/layouts/AppLayout/nav-config.ts` es la fuente de verdad de la
 * navegación, pero importarlo aquí arrastraría los componentes de iconos
 * (JSX, `@radix-ui/react-icons`) y el alias `@` dentro del runner de
 * Playwright. En vez de eso, el catálogo se declara plano y hay un test de
 * Vitest —`src/test/e2e-screen-catalog.test.ts`— que comprueba que cubre
 * exactamente lo que `NAV_BY_ROLE` y `ADMIN_SECTION_ITEMS` exponen. Si alguien
 * añade una ruta al navbar y se olvida de este fichero, ese test falla.
 *
 * ## `title` es el `<h1>` real de la vista
 *
 * El Topbar es el único sitio de la app con `<h1>` (ver `Topbar.tsx`), y su
 * texto sale de `pageTitleForPath`. Sirve a la vez de señal de "la pantalla ya
 * cargó" y de prueba de que la ruta resolvió a la vista correcta: un `goto`
 * que redirige en silencio se delata porque el título no coincide.
 */

export interface Screen {
  /** Identificador estable — da nombre al fichero de baseline. */
  id: string;
  path: string;
  /** Texto esperado del `<h1>` del Topbar. */
  title: string;
  /** Roles que tienen esta pantalla en su navbar. */
  roles: E2ERole[];
  /**
   * Rol con el que se hace la captura visual. Sin esto, una pantalla visible
   * para cinco roles generaría cinco baselines casi idénticos.
   */
  visualRole?: E2ERole;
  /** Texto que debe desaparecer antes de capturar (estados de carga propios). */
  notes?: string;
}

const TODOS: E2ERole[] = [
  'administrador',
  'empleado',
  'socio',
  'becario',
  'externo_invitado',
];

/** Roles internos con jornada: `becario` queda fuera de Control horario (RF-A10). */
const CON_JORNADA: E2ERole[] = ['administrador', 'empleado', 'socio'];

/** El navbar de empleado, socio y becario; el admin también los tiene salvo el buzón. */
const PLANTILLA: E2ERole[] = ['administrador', 'empleado', 'socio', 'becario'];

export const SCREENS: Screen[] = [
  {
    id: 'inicio',
    path: '/',
    title: 'Inicio',
    roles: TODOS,
    /* El dashboard del admin y el del empleado son pantallas DISTINTAS (KPIs,
       filtros y bandejas frente al hero del empleado), y el del externo es un
       mini-dashboard recortado. Los tres se capturan por separado abajo. */
    visualRole: 'empleado',
    notes: 'Cargando…',
  },
  { id: 'onboarding', path: '/onboarding', title: 'Onboarding', roles: TODOS, visualRole: 'empleado' },
  { id: 'ausencias', path: '/ausencias', title: 'Ausencias', roles: PLANTILLA, visualRole: 'empleado' },
  {
    id: 'control-horario',
    path: '/control-horario',
    title: 'Control horario',
    roles: CON_JORNADA,
    visualRole: 'empleado',
  },
  { id: 'nominas', path: '/nominas', title: 'Nóminas', roles: PLANTILLA, visualRole: 'empleado' },
  { id: 'documentos', path: '/documentos', title: 'Documentos', roles: PLANTILLA, visualRole: 'empleado' },
  { id: 'equipo', path: '/equipo', title: 'Equipo', roles: TODOS, visualRole: 'empleado' },
  {
    id: 'buzon-anonimo',
    path: '/buzon-anonimo',
    title: 'Buzón anónimo',
    /* El admin NO lo tiene en su navbar: él recibe en
       `/administracion/buzon`. Enviar y recibir son roles opuestos aquí. */
    roles: ['empleado', 'socio', 'becario'],
    visualRole: 'empleado',
  },
  {
    id: 'buzon-seguimiento',
    path: '/buzon-anonimo/seguimiento',
    title: 'Buzón anónimo',
    roles: ['empleado', 'socio', 'becario'],
    visualRole: 'empleado',
  },
  { id: 'perfil', path: '/perfil', title: 'Mi perfil', roles: TODOS, visualRole: 'empleado' },
  { id: 'ayuda', path: '/ayuda', title: 'Ayuda', roles: TODOS, visualRole: 'empleado' },

  /* ── Calendario general: del admin Y del socio (misma ruta, mismo backend
     con `require_role("administrador", "socio")`), pero para el socio es un
     ítem suelto de su navbar y no la sección de Administración. ────────────── */
  {
    id: 'admin-calendario',
    path: '/administracion/calendario',
    title: 'Calendario general',
    roles: ['administrador', 'socio'],
    visualRole: 'administrador',
  },

  /* ── Sección Administración: exclusiva del administrador ─────────────────── */
  {
    id: 'admin-plantilla',
    path: '/administracion/plantilla',
    title: 'Plantilla',
    roles: ['administrador'],
  },
  {
    id: 'admin-documentos',
    path: '/administracion/documentos',
    title: 'Documentos',
    roles: ['administrador'],
  },
  {
    id: 'admin-anuncios',
    path: '/administracion/anuncios',
    title: 'Anuncios',
    roles: ['administrador'],
  },
  {
    id: 'admin-buzon',
    path: '/administracion/buzon',
    title: 'Buzón (recepción)',
    roles: ['administrador'],
  },
  {
    id: 'admin-onboarding',
    path: '/administracion/onboarding',
    title: 'Onboarding',
    roles: ['administrador'],
  },
  {
    id: 'admin-festivos',
    path: '/administracion/festivos',
    title: 'Festivos',
    roles: ['administrador'],
  },
  {
    id: 'admin-tipos-ausencia',
    path: '/administracion/tipos-ausencia',
    title: 'Tipos de ausencia',
    roles: ['administrador'],
  },
  {
    id: 'admin-plantillas-email',
    path: '/administracion/plantillas-email',
    title: 'Plantillas de correo',
    roles: ['administrador'],
  },
];

/**
 * Pantallas cuya vista cambia de verdad según el rol, y que por eso se
 * auditan y capturan con más de uno. No es todo el producto cartesiano: eso
 * multiplicaría los baselines sin añadir información.
 */
export const ROLE_VARIANTS: Array<{ screen: Screen; role: E2ERole; id: string }> = [
  { id: 'inicio-administrador', role: 'administrador', screen: SCREENS[0]! },
  { id: 'inicio-externo', role: 'externo_invitado', screen: SCREENS[0]! },
  { id: 'onboarding-externo', role: 'externo_invitado', screen: SCREENS[1]! },
  { id: 'ausencias-administrador', role: 'administrador', screen: SCREENS[2]! },
  { id: 'documentos-administrador', role: 'administrador', screen: SCREENS[5]! },
  { id: 'equipo-socio', role: 'socio', screen: SCREENS[6]! },
];

/** Todas las combinaciones pantalla × rol que la capa 2 audita. */
export function auditMatrix(): Array<{ screen: Screen; role: E2ERole }> {
  const matrix: Array<{ screen: Screen; role: E2ERole }> = [];

  for (const screen of SCREENS) {
    /* Un rol representativo por pantalla: el `visualRole` si está declarado,
       y si no el primero que la tenga (las de Administración solo tienen uno). */
    const primary = screen.visualRole ?? screen.roles[0]!;
    matrix.push({ screen, role: primary });
  }

  for (const variant of ROLE_VARIANTS) {
    matrix.push({ screen: variant.screen, role: variant.role });
  }

  return matrix;
}
