import { useState } from 'react';
import { CalendarPlus, CalendarRange, DownloadCloud } from 'lucide-react';
import { ConfigTabsNav } from '@/components/composites/ConfigTabsNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useDeleteHoliday } from '../application/useDeleteHoliday';
import { useHolidays } from '../application/useHolidays';
import { useImportHolidays } from '../application/useImportHolidays';
import { HolidayFormDialog } from '../components/HolidayFormDialog';
import { HolidaysTable } from '../components/HolidaysTable';
import type { Holiday, HolidayImportResult } from '../domain/models';
import styles from './FestivosPage.module.css';

const CURRENT_YEAR = new Date().getFullYear();
const NEXT_YEAR = CURRENT_YEAR + 1;

// BUGFIX: la página listaba SIEMPRE el año en curso (`useHolidays({ year:
// CURRENT_YEAR })` hardcodeado) sin ningún control para cambiar de año, así
// que los festivos importados para 2027 (o cualquier año futuro) quedaban
// cargados en BD pero eran invisibles en esta pantalla. Se añade un selector
// de año que decide qué año se pide a `GET /holidays?year=`.
// Rango generoso (año anterior a +4) para cubrir importaciones anticipadas
// sin depender de un endpoint "años con datos" que el backend no expone hoy.
const SELECTABLE_YEARS = Array.from({ length: 6 }, (_, index) => CURRENT_YEAR - 1 + index);

/** deck-fase6/14-festivos.png */
export function FestivosPage() {
  const [dialogHoliday, setDialogHoliday] = useState<Holiday | 'new' | null>(null);
  const [selectedYear, setSelectedYear] = useState(CURRENT_YEAR);
  const { data: holidays = [], isLoading } = useHolidays({ year: selectedYear });
  const { mutate: deleteHoliday } = useDeleteHoliday();
  const {
    mutate: importHolidays,
    isPending: isImporting,
    data: importResult,
    error: importError,
  } = useImportHolidays();

  // F1: importa año actual + siguiente en un solo clic (reutiliza el mismo
  // endpoint `POST /holidays/import?year=`, una llamada por año — no hay
  // variante "por rango" en el backend, así que se encadenan dos peticiones
  // y se agregan los resultados en el propio front).
  const { mutateAsync: importHolidaysAsync } = useImportHolidays();
  const [isImportingRange, setIsImportingRange] = useState(false);
  const [rangeImportResults, setRangeImportResults] = useState<HolidayImportResult[] | null>(null);
  const [rangeImportError, setRangeImportError] = useState(false);

  const handleImportCurrentAndNextYear = async () => {
    setIsImportingRange(true);
    setRangeImportError(false);
    setRangeImportResults(null);
    try {
      const results = await Promise.all([
        importHolidaysAsync(CURRENT_YEAR),
        importHolidaysAsync(NEXT_YEAR),
      ]);
      setRangeImportResults(results);
      // Salta directo al año siguiente recién importado: es la forma más
      // clara de confirmar que la importación funcionó (antes no había
      // ninguna vista que mostrara ese año).
      setSelectedYear(NEXT_YEAR);
    } catch {
      setRangeImportError(true);
    } finally {
      setIsImportingRange(false);
    }
  };

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
          <p className={styles.subtitle}>Calendario laboral {selectedYear} por ámbito</p>
        </div>
        <div className={styles.headerActions}>
          <Button variant="outline" onClick={() => importHolidays(selectedYear)} disabled={isImporting}>
            <DownloadCloud />
            {isImporting ? 'Importando…' : `Importar oficiales ${selectedYear}`}
          </Button>
          <Button
            variant="outline"
            onClick={handleImportCurrentAndNextYear}
            disabled={isImportingRange}
          >
            <CalendarRange />
            {isImportingRange ? 'Importando…' : 'Importar festivos (año actual y siguiente)'}
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
      {rangeImportResults?.map((result) => (
        <p key={result.year} className={styles.importNote}>
          Importación {result.year}: {result.imported} nuevos, {result.updated} actualizados,{' '}
          {result.skipped} conservados (manuales).
        </p>
      ))}
      {rangeImportError && (
        <p className={styles.importError}>
          No se pudo importar el calendario oficial de {CURRENT_YEAR} y {NEXT_YEAR}. Inténtalo de
          nuevo en unos minutos.
        </p>
      )}

      <Card className={styles.card}>
        <div className={styles.toolbar}>
          <div className={styles.yearControl}>
            <label htmlFor="festivos-year" className={styles.yearLabel}>
              Año
            </label>
            <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger
                id="festivos-year"
                className={styles.yearPill}
                aria-label="Año de festivos a mostrar"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SELECTABLE_YEARS.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          year={selectedYear}
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
