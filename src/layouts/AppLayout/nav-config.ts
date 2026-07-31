import {
  ArchiveIcon,
  AvatarIcon,
  BellIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  HomeIcon,
  QuestionMarkCircledIcon,
} from '@radix-ui/react-icons';
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  GraduationCapIcon,
  type IconComponent,
  InboxIcon,
  MailboxIcon,
  TagIcon,
  UsersIcon,
  WalletIcon,
} from '@/components/icons';
import type { UserRole } from '@/features/auth/domain/models';

export interface NavItem {
  label: string;
  to: string;
  icon: IconComponent;
  /** Módulos aún sin página/ruta (llegan en fases posteriores) se muestran
   * deshabilitados en vez de ocultos, para que el mapa de navegación
   * completo sea visible desde el principio. */
  comingSoon?: boolean;
  /** Contador rojo (deck 02-home-admin) — solo "Aprobar ausencias" lo usa
   * hoy, con el total real de `dashboard/summary`. */
  badgeCount?: number;
}

const inicio: NavItem = { label: 'Inicio', to: '/', icon: HomeIcon };
// Fase 3: ausencias y control horario ya tienen página real — dejan de ser "comingSoon".
const ausencias: NavItem = { label: 'Ausencias', to: '/ausencias', icon: CalendarClockIcon };
const controlHorario: NavItem = { label: 'Control horario', to: '/control-horario', icon: ClockIcon };
// Fase 4: Nóminas y Documentos ya tienen página real — dejan de ser "comingSoon".
const nominas: NavItem = { label: 'Nóminas', to: '/nominas', icon: WalletIcon };
const documentos: NavItem = { label: 'Documentos', to: '/documentos', icon: FileTextIcon };
// Fase 5: Equipo (directorio, calendario de vacaciones, organigrama) ya tiene
// página real. Fase 6: el buzón anónimo del empleado también. Ambos activos.
const equipo: NavItem = { label: 'Equipo', to: '/equipo', icon: UsersIcon };
const buzonAnonimo: NavItem = { label: 'Buzón anónimo', to: '/buzon-anonimo', icon: MailboxIcon };
// Fase 3: "Mi perfil" (ficha de solo lectura) ya tiene página real.
const perfil: NavItem = { label: 'Mi perfil', to: '/perfil', icon: AvatarIcon };
// Fase 2: onboarding ya tiene página real — deja de ser "comingSoon".
// docs/permisos-roles.md dice que el admin (único) "configura, ver
// Administración" en vez de recorrer el flujo — pero el contrato de
// backend consumido aquí incluye "administrador" en quiz/firma/perfil
// además de vídeo/manual, así que se muestra también en su navbar (ver
// engram: "Onboarding — nav por rol y contrato backend").
const onboarding: NavItem = { label: 'Onboarding', to: '/onboarding', icon: GraduationCapIcon };
// Ayuda: índice del manual de uso (`public/ayuda/manual-de-uso.html`). Va en
// TODOS los roles, incluido `externo_invitado` — el manual explica también su
// onboarding recortado, y es el único módulo del que nadie debería quedar
// fuera. Último ítem del navbar a propósito: es referencia, no tarea diaria.
const ayuda: NavItem = { label: 'Ayuda', to: '/ayuda', icon: QuestionMarkCircledIcon };

// "Calendario general" (LOTE 4) — vista de RRHH de TODA la plantilla (no
// solo el propio departamento como `TeamCalendar`), con exportación
// PDF/Excel con logo de Amelia. Se define una sola vez y se reutiliza tanto
// dentro de "Administración" (admin) como suelto en el navbar de `socio`
// (ver `NAV_BY_ROLE.socio` más abajo) — ambos apuntan al mismo backend
// RBAC-real (`require_role("administrador", "socio")`).
const calendarioGeneral: NavItem = {
  label: 'Calendario general',
  to: '/administracion/calendario',
  icon: CalendarRangeIcon,
};

// docs/deck-fase3/02-home-admin-bandeja.png § sidebar — sección exclusiva
// del admin. "Aprobar ausencias" reutiliza la misma página de Ausencias
// (con la bandeja ya visible para su rol); el resto son módulos de fases
// posteriores (comingSoon), pero el LAYOUT completo se muestra desde ya.
// Fase 6 R1: "Plantilla" y "Buzón (recepción)" ya tienen página real.
// Fase 6 R2: "Anuncios", "Festivos" y "Tipos de ausencia" se suman.
// Fase 6 R3: "Onboarding" (gestión de pasos + progreso de la plantilla) se suma.
// Fase 4: "Documentos" (subida manual + "Sincronizar ahora" con Drive) se
// suma — icono distinto (ArchiveIcon) del "Documentos" del navbar general
// (FileTextIcon, `documentos` más arriba) para diferenciar la vista de
// gestión de toda la plantilla de la carpeta personal de cada persona.
//
// Ampliación v1.1 (RF-A2): "Organigrama" SE RETIRA de esta sección y NO debe
// reponerse. El organigrama es material publicado por el equipo —hoy el PDF
// `Organigrama Amelia 2026`, servido como imagen en la pestaña Organigrama de
// `Equipo` (`TeamOrgChart`)— visible para todos los roles, no una pantalla
// administrable. Su ítem aquí apuntaba además a `/administracion/organigrama`,
// una ruta que no existe. La línea de reporte sigue viviendo en el dato
// (`users.manager_id`, editable vía `PATCH /staff/{id}`), no en una UI de árbol.
export const ADMIN_SECTION_ITEMS: NavItem[] = [
  { label: 'Plantilla', to: '/administracion/plantilla', icon: UsersIcon },
  { label: 'Aprobar ausencias', to: '/ausencias', icon: InboxIcon },
  calendarioGeneral,
  { label: 'Documentos', to: '/administracion/documentos', icon: ArchiveIcon },
  { label: 'Anuncios', to: '/administracion/anuncios', icon: BellIcon },
  { label: 'Buzón (recepción)', to: '/administracion/buzon', icon: MailboxIcon },
  { label: 'Onboarding', to: '/administracion/onboarding', icon: GraduationCapIcon },
  { label: 'Festivos', to: '/administracion/festivos', icon: CalendarIcon },
  { label: 'Tipos de ausencia', to: '/administracion/tipos-ausencia', icon: TagIcon },
];

// docs/permisos-roles.md § "Navbar por rol" — copiado literal, un ítem por rol.
// `socio` (migración 024, ya documentado en `docs/permisos-roles.md`): igual
// que `empleado` + el único ítem extra "Calendario general" — NUNCA la
// sección "Administración" completa (Sidebar.tsx solo la muestra si
// `isAdmin`). "Ocultar ≠ proteger": el backend ya rechaza a `empleado` con
// 403 en los 3 endpoints de `/absences/calendar/*`, esto es solo la
// composición visual del navbar de `socio`.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  empleado: [
    inicio,
    onboarding,
    ausencias,
    controlHorario,
    nominas,
    documentos,
    equipo,
    buzonAnonimo,
    perfil,
    ayuda,
  ],
  administrador: [
    inicio,
    onboarding,
    ausencias,
    controlHorario,
    nominas,
    documentos,
    equipo,
    perfil,
    ayuda,
  ],
  // El "Inicio" del externo es un mini-dashboard recortado (solo Anuncios +
  // Cumpleaños del equipo, ver `DashboardPage`) — no el Home de empleado.
  externo_invitado: [inicio, onboarding, equipo, perfil, ayuda],
  socio: [
    inicio,
    onboarding,
    ausencias,
    controlHorario,
    nominas,
    documentos,
    equipo,
    buzonAnonimo,
    perfil,
    calendarioGeneral,
    ayuda,
  ],
  // `becario` (migración 038, RF-A10): el navbar de `empleado` MENOS "Control
  // horario". Es la única diferencia — todo lo demás (ausencias, nóminas,
  // documentos, equipo, buzón, onboarding completo) lo ve igual que un
  // trabajador, y en el backend lo hereda por estar en `INTERNAL_ROLES`.
  //
  // "Ocultar ≠ proteger": los 13 endpoints de `/time-clock` usan
  // `TIME_CLOCK_ROLES`, que no lo incluye — escribir `/control-horario` a mano
  // da 403, no la pantalla.
  becario: [inicio, onboarding, ausencias, nominas, documentos, equipo, buzonAnonimo, perfil, ayuda],
};

/**
 * Título de página para el header, derivado del MISMO mapa de navegación que
 * el sidebar (NAV_BY_ROLE del rol actual + sección Administración) — así el
 * header no mantiene su propia tabla de rutas→título. Devuelve el label del
 * ítem cuyo `to` es el prefijo más específico del pathname ('' si no hay
 * match, p. ej. subrutas sueltas que no cuelgan de ningún ítem del navbar).
 */
export function pageTitleForPath(pathname: string, role: UserRole | undefined): string {
  const candidates: NavItem[] = [...(role ? NAV_BY_ROLE[role] : []), ...ADMIN_SECTION_ITEMS];
  let best: NavItem | undefined;
  for (const item of candidates) {
    const matches =
      pathname === item.to || (item.to !== '/' && pathname.startsWith(`${item.to}/`));
    if (matches && (!best || item.to.length > best.to.length)) {
      best = item;
    }
  }
  return best?.label ?? '';
}
