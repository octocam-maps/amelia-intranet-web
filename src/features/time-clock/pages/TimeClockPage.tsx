import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStore } from '@/store';
import { useDeleteTimeClockEntry } from '../application/useDeleteTimeClockEntry';
import { useExportTimeClockCsv } from '../application/useExportTimeClockCsv';
import { useTimeClockEntries } from '../application/useTimeClockEntries';
import { TimeClockEntryForm } from '../components/TimeClockEntryForm';
import { TimeClockEntryTable } from '../components/TimeClockEntryTable';
import styles from './TimeClockPage.module.css';

const WINDOW_DAYS = 30;

function defaultRange() {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - WINDOW_DAYS);
  return { dateFrom: from.toISOString().slice(0, 10), dateTo: to.toISOString().slice(0, 10) };
}

export function TimeClockPage() {
  const currentUser = useStore((s) => s.user);
  const isAdmin = currentUser?.role === 'administrador';
  const [showAll, setShowAll] = useState(false);
  const { dateFrom, dateTo } = defaultRange();

  // Vista aumentada del admin (docs/permisos-roles.md § Control horario):
  // sin `userId`, el backend devuelve TODA la plantilla si el rol es admin,
  // o solo lo propio para un empleado — por eso solo forzamos `userId`
  // cuando el admin quiere ver "lo mío" en vez de la vista global.
  const scopedUserId = isAdmin && !showAll ? currentUser?.id : undefined;

  const { data: entries = [], isLoading } = useTimeClockEntries({
    dateFrom,
    dateTo,
    userId: scopedUserId,
  });
  const { mutate: deleteEntry } = useDeleteTimeClockEntry();
  const { mutate: exportCsv, isPending: isExporting } = useExportTimeClockCsv();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Control horario</h1>
        <div className={styles.actions}>
          {isAdmin && (
            <Button variant="outline" onClick={() => setShowAll((v) => !v)}>
              {showAll ? 'Ver solo lo mío' : 'Ver toda la plantilla'}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={() => exportCsv({ dateFrom, dateTo, userId: scopedUserId })}
          >
            Exportar CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar un tramo</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeClockEntryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Historial (últimos {WINDOW_DAYS} días)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className={styles.loading}>Cargando…</p>
          ) : (
            <TimeClockEntryTable
              entries={entries}
              showUserColumn={isAdmin && showAll}
              onDelete={deleteEntry}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
