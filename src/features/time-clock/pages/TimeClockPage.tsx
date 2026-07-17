import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { useStaffList } from '@/features/staff/application/useStaffList';
import { useStore } from '@/store';
import { useDeleteTimeClockEntry } from '../application/useDeleteTimeClockEntry';
import { useExportTimeClockCsv } from '../application/useExportTimeClockCsv';
import { useExportTimeClockXlsx } from '../application/useExportTimeClockXlsx';
import { useTimeClockEntries } from '../application/useTimeClockEntries';
import { EditTimeClockEntryDialog } from '../components/EditTimeClockEntryDialog';
import { LiveClockCard } from '../components/LiveClockCard';
import { PersonMultiSelect } from '../components/PersonMultiSelect';
import { TimeClockEntryForm } from '../components/TimeClockEntryForm';
import { TimeClockEntryNotesDialog } from '../components/TimeClockEntryNotesDialog';
import { TimeClockEntryTable } from '../components/TimeClockEntryTable';
import type { TimeClockEntry } from '../domain/models';
import styles from './TimeClockPage.module.css';

const WINDOW_DAYS = 30;
// ~850 tramos/mes (feedback post-demo, Lote 1 X1): cargarlos todos de golpe
// era el problema — 50 por página es el mismo default que el backend
// (`_DEFAULT_LIST_LIMIT`, `routes.py`).
const PAGE_SIZE = 50;
// Página "generosa" para el selector de persona — mismo techo que
// `StaffPage.CLIENT_PAGE_CAP`, aquí solo alimenta un desplegable, no una
// tabla paginada.
const STAFF_SELECTOR_PAGE_SIZE = 200;

const EMPTY_ENTRIES: TimeClockEntry[] = [];

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
  // X2 (Lote 1) + multi-selector (Lote 2): solo tiene sentido dentro de
  // "Ver toda la plantilla" — se limpia cada vez que se sale de esa vista.
  // Vacío = "todas las personas" (sin filtro).
  const [selectedPersonIds, setSelectedPersonIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  // B-2c/B-2b: tramo seleccionado para el diálogo de edición/incidencias —
  // `null` = diálogo cerrado. Solo el admin llega a fijarlos (los botones
  // que los abren no se renderizan para un empleado).
  const [editingEntry, setEditingEntry] = useState<TimeClockEntry | null>(null);
  const [notesEntry, setNotesEntry] = useState<TimeClockEntry | null>(null);
  const { dateFrom, dateTo } = defaultRange();

  // Vista aumentada del admin (docs/permisos-roles.md § Control horario):
  // sin `userId`/`userIds`, el backend devuelve TODA la plantilla si el rol
  // es admin, o solo lo propio para un empleado. Con la plantilla filtrada
  // (`showAll`), el admin puede además acotar a una o varias personas
  // (multi-selector, Lote 2) — `scopedUserId` sigue vivo para "ver solo lo
  // mío" (single, sin selector de por medio).
  const scopedUserId = isAdmin && !showAll ? currentUser?.id : undefined;
  const scopedUserIds = isAdmin && showAll && selectedPersonIds.length > 0 ? selectedPersonIds : undefined;

  const { data, isLoading } = useTimeClockEntries({
    dateFrom,
    dateTo,
    userId: scopedUserId,
    userIds: scopedUserIds,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const entries = data?.entries ?? EMPTY_ENTRIES;
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);

  // BUG-2: mismo `pageSize` "generoso" que `StaffPage.CLIENT_PAGE_CAP` — con
  // el techo antiguo del backend (`le=100`) esta request de 200 devolvía 422
  // y el selector de persona se quedaba vacío sin ningún aviso. `error` ahora
  // se lee y se muestra (ver banner más abajo) en vez de tragárselo.
  const {
    data: staffData,
    error: staffError,
  } = useStaffList({ pageSize: STAFF_SELECTOR_PAGE_SIZE }, { enabled: isAdmin && showAll });
  const staffMembers = useMemo(
    () => [...(staffData?.members ?? [])].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    [staffData]
  );

  const { mutate: deleteEntry } = useDeleteTimeClockEntry();
  const { mutate: exportCsv, isPending: isExporting } = useExportTimeClockCsv();
  const { mutate: exportXlsx, isPending: isExportingXlsx } = useExportTimeClockXlsx();

  function handleToggleShowAll() {
    setShowAll((v) => !v);
    setSelectedPersonIds([]);
    setPage(1);
  }

  function handlePersonSelectionChange(ids: string[]) {
    setSelectedPersonIds(ids);
    setPage(1);
  }

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Control horario</h1>
        <div className={styles.actions}>
          {isAdmin && (
            <Button variant="outline" onClick={handleToggleShowAll}>
              {showAll ? 'Ver solo lo mío' : 'Ver toda la plantilla'}
            </Button>
          )}
          <Button
            variant="outline"
            disabled={isExporting}
            onClick={() => exportCsv({ dateFrom, dateTo, userId: scopedUserId, userIds: scopedUserIds })}
          >
            Exportar CSV
          </Button>
          {/* Informe XLSX con logo, últimos 30 días — disponible para admin
              y empleado (`require_role("administrador", "empleado")`). El
              ALCANCE lo decide el backend según el rol, nunca un parámetro
              del cliente: admin recibe TODA la plantilla, empleado recibe
              SOLO sus propios fichajes (RGPD) — mismo botón para los dos. */}
          <Button variant="outline" disabled={isExportingXlsx} onClick={() => exportXlsx()}>
            <DownloadIcon />
            {isExportingXlsx ? 'Generando…' : 'Descargar Excel'}
          </Button>
        </div>
      </div>

      {/* Fichaje en vivo (deck 01-home-empleado) — complementa, no
          sustituye, la corrección manual de tramos de más abajo. */}
      <LiveClockCard />

      <Card>
        <CardHeader>
          <CardTitle>Añadir o corregir un tramo manualmente</CardTitle>
        </CardHeader>
        <CardContent>
          <TimeClockEntryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className={styles.historyHeader}>
          <CardTitle>Historial (últimos {WINDOW_DAYS} días)</CardTitle>
          {isAdmin && showAll && (
            <div className={styles.personFilter}>
              <PersonMultiSelect
                people={staffMembers}
                selectedIds={selectedPersonIds}
                onChange={handlePersonSelectionChange}
              />
              {staffError && (
                <p className={styles.staffError}>
                  No se pudo cargar la lista de personas:{' '}
                  {staffError instanceof Error ? staffError.message : 'error desconocido'}.
                </p>
              )}
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className={styles.loading}>Cargando…</p>
          ) : (
            <>
              <TimeClockEntryTable
                entries={entries}
                showUserColumn={isAdmin && showAll}
                onDelete={deleteEntry}
                // B-2c: editar el fichaje AJENO solo tiene sentido en la
                // vista aumentada de "toda la plantilla" — en la vista
                // personal ya existe el formulario de arriba para corregir
                // el propio tramo.
                onEdit={isAdmin && showAll ? setEditingEntry : undefined}
                onOpenNotes={isAdmin ? setNotesEntry : undefined}
              />

              {total > 0 && (
                <div className={styles.pagination}>
                  <p className={styles.paginationLabel}>
                    Mostrando {entries.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1}–
                    {(currentPage - 1) * PAGE_SIZE + entries.length} de {total}
                  </p>
                  <div className={styles.paginationControls}>
                    <button
                      type="button"
                      className={styles.pageButton}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      aria-label="Página anterior"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <span className={styles.pageCurrent}>{currentPage}</span>
                    <button
                      type="button"
                      className={styles.pageButton}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      aria-label="Página siguiente"
                    >
                      <ChevronRightIcon />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <EditTimeClockEntryDialog
        entry={editingEntry}
        onOpenChange={(open) => !open && setEditingEntry(null)}
      />
      <TimeClockEntryNotesDialog
        entry={notesEntry}
        onOpenChange={(open) => !open && setNotesEntry(null)}
      />
    </div>
  );
}
