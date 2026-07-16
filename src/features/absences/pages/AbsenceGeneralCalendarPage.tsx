import { useMemo, useState } from 'react';
import { CalendarRange, ChevronDown, Download, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu';
import { useAbsenceCalendar } from '../application/useAbsenceCalendar';
import { useExportAbsenceCalendarPdf } from '../application/useExportAbsenceCalendarPdf';
import { useExportAbsenceCalendarXlsx } from '../application/useExportAbsenceCalendarXlsx';
import { GeneralAbsenceCalendar } from '../components/GeneralAbsenceCalendar';
import type { AbsenceCalendarEntry } from '../domain/models';
import styles from './AbsenceGeneralCalendarPage.module.css';

// Referencia estable — evita que `data ?? []` invalide en cada render los
// `useMemo` de `GeneralAbsenceCalendar` cuando todavía no hay datos.
const EMPTY_ENTRIES: AbsenceCalendarEntry[] = [];

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function monthRange(cursor: Date): { dateFrom: string; dateTo: string } {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return {
    dateFrom: `${year}-${pad(month + 1)}-01`,
    dateTo: `${year}-${pad(month + 1)}-${pad(daysInMonth)}`,
  };
}

// Exportación anual (además de la del mes visible): mismo rango para PDF y
// Excel, 1-ene a 31-dic del año del mes que se está viendo — el backend ya
// acepta cualquier `date_from`/`date_to`, esto solo fija el rango desde el front.
function yearRange(cursor: Date): { dateFrom: string; dateTo: string } {
  const year = cursor.getFullYear();
  return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31` };
}

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
 */
export function AbsenceGeneralCalendarPage() {
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const range = useMemo(() => monthRange(cursor), [cursor]);
  const annualRange = useMemo(() => yearRange(cursor), [cursor]);
  const visibleYear = cursor.getFullYear();

  const { data: entries = EMPTY_ENTRIES, isLoading } = useAbsenceCalendar(range);
  const { mutate: exportPdf, isPending: isExportingPdf } = useExportAbsenceCalendarPdf();
  const { mutate: exportXlsx, isPending: isExportingXlsx } = useExportAbsenceCalendarXlsx();
  const isExportingAnnual = isExportingPdf || isExportingXlsx;

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
          <Button
            variant="outline"
            disabled={isExportingPdf}
            onClick={() => exportPdf(range)}
          >
            <FileText size={16} />
            {isExportingPdf ? 'Generando…' : 'Exportar PDF'}
          </Button>
          <Button
            variant="outline"
            disabled={isExportingXlsx}
            onClick={() => exportXlsx(range)}
          >
            <Download size={16} />
            {isExportingXlsx ? 'Generando…' : 'Exportar Excel'}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" disabled={isExportingAnnual}>
                <CalendarRange size={16} />
                {isExportingAnnual ? 'Generando…' : `Exportar año completo (${visibleYear})`}
                <ChevronDown size={14} />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportPdf(annualRange)}>
                <FileText size={16} />
                PDF — {visibleYear} completo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportXlsx(annualRange)}>
                <Download size={16} />
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
