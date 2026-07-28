import { useMemo, useState } from 'react';
import { ChevronDownIcon, DownloadIcon, FileTextIcon } from '@radix-ui/react-icons';
import { CalendarRangeIcon, UsersIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useStore } from '@/store';
import { useTeamDirectory } from '@/features/team/application/useTeamDirectory';
import { useAbsenceCalendar } from '../application/useAbsenceCalendar';
import { useExportAbsenceCalendarPdf } from '../application/useExportAbsenceCalendarPdf';
import { useExportAbsenceCalendarXlsx } from '../application/useExportAbsenceCalendarXlsx';
import { GeneralAbsenceCalendar } from '../components/GeneralAbsenceCalendar';
import { monthRange, yearRange } from '../domain/calendarRangePresets';
import type { AbsenceCalendarEntry } from '../domain/models';
import styles from './AbsenceGeneralCalendarPage.module.css';

// Referencia estable — evita que `data ?? []` invalide en cada render los
// `useMemo` de `GeneralAbsenceCalendar` cuando todavía no hay datos.
const EMPTY_ENTRIES: AbsenceCalendarEntry[] = [];

// Sentinel del selector de empleado — "todos" nunca es un `user_id` real,
// mismo patrón que `ALL_VALUE` en `AdminFiltersBar` (dashboard).
const ALL_EMPLOYEES_VALUE = 'all';

/**
 * "Calendario general de la plantilla" — pantalla admin-only (LOTE 4,
 * sección "Administración" del sidebar). A diferencia del "Calendario de
 * la plantilla" embebido en Ausencias > gestión (histórico completo, sin
 * acotar, `TeamAbsenceGantt` + `/absences/requests/all`), esta pantalla
 * pide `/absences/calendar/all` por el mes visible y permite exportar el
 * resultado a PDF/Excel con el logo de Amelia — los 3 endpoints aceptan
 * `administrador` y `socio` [migración 024] en el backend (RBAC real vía
 * `require_role`, no solo un ítem oculto del navbar). No hay guard de rol
 * aquí: el frontend tampoco decide el acceso, solo compone la navegación
 * (mismo criterio que `/administracion/plantilla`, `/administracion/festivos`, etc.).
 *
 * RF-A1 (selector de empleado): Admin/Socio pueden acotar el EXPORT (no la
 * grilla, que sigue mostrando toda la plantilla — `/calendar/all` no
 * cambia) a un empleado concreto. El selector se oculta para cualquier
 * otro rol — doble capa con el backend, que igualmente rechazaría con 403
 * a un Empleado pidiendo el `user_id` de otro (ver
 * `GetAbsenceCalendarUseCase`); "ocultar ≠ proteger" corta en los dos
 * sentidos, así que aquí solo evita mostrar una opción que de todos modos
 * fallaría.
 */
export function AbsenceGeneralCalendarPage() {
  const currentUser = useStore((s) => s.user);
  const canFilterByEmployee =
    currentUser?.role === 'administrador' || currentUser?.role === 'socio';

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | undefined>(undefined);
  const range = useMemo(() => monthRange(cursor), [cursor]);
  const annualRange = useMemo(() => yearRange(cursor), [cursor]);
  const visibleYear = cursor.getFullYear();

  const { data: entries = EMPTY_ENTRIES, isLoading } = useAbsenceCalendar(range);
  const { data: directory = [] } = useTeamDirectory();
  const sortedDirectory = useMemo(
    () => [...directory].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    [directory]
  );
  const selectedEmployeeName = selectedEmployeeId
    ? sortedDirectory.find((person) => person.id === selectedEmployeeId)?.fullName
    : undefined;

  const { mutate: exportPdf, isPending: isExportingPdf } = useExportAbsenceCalendarPdf();
  const { mutate: exportXlsx, isPending: isExportingXlsx } = useExportAbsenceCalendarXlsx();
  const isExportingAnnual = isExportingPdf || isExportingXlsx;

  function exportParams(baseRange: { dateFrom: string; dateTo: string }) {
    return { ...baseRange, userId: selectedEmployeeId, subjectName: selectedEmployeeName };
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Calendario general de la plantilla</h1>
          <p className={styles.subtitle}>
            Ausencias y vacaciones de toda la plantilla — vista exclusiva de RRHH.
          </p>
        </div>
        <div className={styles.actions}>
          {canFilterByEmployee && (
            <div className={styles.field}>
              <UsersIcon className={styles.fieldIcon} />
              <Select
                value={selectedEmployeeId ?? ALL_EMPLOYEES_VALUE}
                onValueChange={(next) =>
                  setSelectedEmployeeId(next === ALL_EMPLOYEES_VALUE ? undefined : next)
                }
              >
                <SelectTrigger className={styles.employeeTrigger} aria-label="Filtrar export por empleado">
                  <SelectValue placeholder="Empleado" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_EMPLOYEES_VALUE}>Todos los empleados</SelectItem>
                  {sortedDirectory.map((person) => (
                    <SelectItem key={person.id} value={person.id}>
                      {person.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <Button
            variant="outline"
            disabled={isExportingPdf}
            onClick={() => exportPdf(exportParams(range))}
          >
            <FileTextIcon />
            {isExportingPdf ? 'Generando…' : 'Exportar PDF'}
          </Button>
          <Button
            variant="outline"
            disabled={isExportingXlsx}
            onClick={() => exportXlsx(exportParams(range))}
          >
            <DownloadIcon />
            {isExportingXlsx ? 'Generando…' : 'Exportar Excel'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExportingAnnual}>
                <CalendarRangeIcon />
                {isExportingAnnual ? 'Generando…' : `Exportar año completo (${visibleYear})`}
                <ChevronDownIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportPdf(exportParams(annualRange))}>
                <FileTextIcon />
                PDF — {visibleYear} completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportXlsx(exportParams(annualRange))}>
                <DownloadIcon />
                Excel — {visibleYear} completo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <GeneralAbsenceCalendar
        entries={entries}
        isLoading={isLoading}
        cursor={cursor}
        onPreviousMonth={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))}
        onNextMonth={() => setCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))}
      />
    </div>
  );
}
