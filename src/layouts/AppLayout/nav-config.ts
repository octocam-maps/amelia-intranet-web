import {
  ArchiveIcon,
  AvatarIcon,
  BellIcon,
  CalendarIcon,
  ClockIcon,
  FileTextIcon,
  HomeIcon,
} from '@radix-ui/react-icons';
import {
  CalendarClockIcon,
  CalendarRangeIcon,
  GraduationCapIcon,
  type IconComponent,
  InboxIcon,
  MailboxIcon,
  NetworkIcon,
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
  { label: 'Organigrama', to: '/administracion/organigrama', icon: NetworkIcon, comingSoon: true },
];

// docs/permisos-roles.md § "Navbar por rol" — copiado literal, un ítem por rol.
// `socio` (migración 024, ya documentado en `docs/permisos-roles.md`): igual
// que `empleado` + el único ítem extra "Calendario general" — NUNCA la
// sección "Administración" completa (Sidebar.tsx solo la muestra si
// `isAdmin`). "Ocultar ≠ proteger": el backend ya rechaza a `empleado` con
// 403 en los 3 endpoints de `/absences/calendar/*`, esto es solo la
// composición visual del navbar de `socio`.
export const NAV_BY_ROLE: Record<UserRole, NavItem[]> = {
  empleado: [inicio, onboarding, ausencias, controlHorario, nominas, documentos, equipo, buzonAnonimo, perfil],
  administrador: [inicio, onboarding, ausencias, controlHorario, nominas, documentos, equipo, perfil],
  // El "Inicio" del externo es un mini-dashboard recortado (solo Anuncios +
  // Cumpleaños del equipo, ver `DashboardPage`) — no el Home de empleado.
  externo_invitado: [inicio, onboarding, equipo, perfil],
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
  ],
};
