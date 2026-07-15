import { useState } from 'react';
import { CalendarPlus, DownloadCloud } from 'lucide-react';
import { ConfigTabsNav } from '@/components/composites/ConfigTabsNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useDeleteHoliday } from '../application/useDeleteHoliday';
import { useHolidays } from '../application/useHolidays';
import { useImportHolidays } from '../application/useImportHolidays';
import { HolidayFormDialog } from '../components/HolidayFormDialog';
import { HolidaysTable } from '../components/HolidaysTable';
import type { Holiday } from '../domain/models';
import styles from './FestivosPage.module.css';

const CURRENT_YEAR = new Date().getFullYear();

/** deck-fase6/14-festivos.png */
export function FestivosPage() {
  const [dialogHoliday, setDialogHoliday] = useState<Holiday | 'new' | null>(null);
  const { data: holidays = [], isLoading } = useHolidays({ year: CURRENT_YEAR });
  const { mutate: deleteHoliday } = useDeleteHoliday();
  const {
    mutate: importHolidays,
    isPending: isImporting,
    data: importResult,
    error: importError,
  } = useImportHolidays();

  const handleDelete = (holiday: Holiday) => {
    if (window.confirm(`¿Eliminar el festivo "${holiday.name}"?`)) {
      deleteHoliday(holiday.id);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración · Festivos</h1>
          <p className={styles.subtitle}>Calendario laboral {CURRENT_YEAR} por ámbito</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => importHolidays(CURRENT_YEAR)} disabled={isImporting}>
            <DownloadCloud />
            {isImporting ? 'Importando…' : `Importar oficiales ${CURRENT_YEAR}`}
          </Button>
          <Button onClick={() => setDialogHoliday('new')}>
            <CalendarPlus />
            Añadir festivo
          </Button>
        </div>
      </div>

      <ConfigTabsNav active="festivos" />

      {importResult && (
        <p className={styles.importNote}>
          Importación {importResult.year}: {importResult.imported} nuevos,{' '}
          {importResult.updated} actualizados, {importResult.skipped} conservados (manuales).
          Recuerda añadir a mano los festivos locales de Barcelona (La Mercè, Segona Pasqua).
        </p>
      )}
      {importError && (
        <p className={styles.importError}>
          No se pudo importar el calendario oficial. Inténtalo de nuevo en unos minutos.
        </p>
      )}

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <span className={styles.yearPill}>{CURRENT_YEAR}</span>
          <div className={styles.legend}>
            <span className={styles.legendItem}>
              <span className={styles.legendDotNacional} /> Nacional
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotAutonomico} /> Autonómico
            </span>
            <span className={styles.legendItem}>
              <span className={styles.legendDotLocal} /> Local
            </span>
          </div>
        </div>

        <HolidaysTable
          holidays={holidays}
          isLoading={isLoading}
          onEdit={setDialogHoliday}
          onDelete={handleDelete}
        />
      </Card>

      <HolidayFormDialog
        open={dialogHoliday !== null}
        onOpenChange={(open) => !open && setDialogHoliday(null)}
        holiday={dialogHoliday && dialogHoliday !== 'new' ? dialogHoliday : undefined}
      />
    </div>
  );
}
