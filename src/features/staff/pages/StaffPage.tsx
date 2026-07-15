import { useMemo, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Search, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import { useStaffList } from '../application/useStaffList';
import { useUpdateStaffMember } from '../application/useUpdateStaffMember';
import { StaffFormDialog } from '../components/StaffFormDialog';
import { StaffTable } from '../components/StaffTable';
import type { EntityCode, StaffMember } from '../domain/models';
import styles from './StaffPage.module.css';

const PAGE_SIZE = 8;
// Techo de la página "generosa" que se pide hoy (ver comentario de
// `useStaffList` más abajo) — si el backend lo llena entero, la lista NO
// está completa: hay más personas de las que se están viendo.
const CLIENT_PAGE_CAP = 200;
// Referencia estable — evita que `data?.members ?? []` invalide en cada
// render los `useMemo` que dependen de `members` cuando todavía no hay datos.
const EMPTY_MEMBERS: StaffMember[] = [];

/** Quita acentos para que "Marc" encuentre a "Márc" — mismo helper que
 * `TeamDirectory` (Fase 5), duplicado aquí para no acoplar features. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

/**
 * deck-fase6/09-plantilla-listado.png — el contrato exacto de paginación de
 * `/staff` está en confirmación con el backend (fase6back); mientras tanto
 * se pide una página generosa y se filtra/pagina en el cliente, igual que
 * `TeamDirectory` (Fase 5). Si el backend termina paginando de verdad, solo
 * hay que mover `entityFilter`/`search`/`page` a los parámetros de `useStaffList`.
 *
 * Mientras tanto, pedir `pageSize: CLIENT_PAGE_CAP` tiene un techo real: si
 * la plantilla tiene más personas que ese número, el backend nos devuelve
 * solo las primeras `CLIENT_PAGE_CAP` y aquí no hay forma de saberlo — se
 * avisa explícitamente cuando se llega al techo para no dar a entender que
 * la lista está completa.
 */
export function StaffPage() {
  const [entityFilter, setEntityFilter] = useState<EntityCode | 'all'>('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [dialogMember, setDialogMember] = useState<StaffMember | 'new' | null>(null);

  const { data, isLoading } = useStaffList({ pageSize: CLIENT_PAGE_CAP });
  const members = data?.members ?? EMPTY_MEMBERS;
  const reachedClientCap = members.length >= CLIENT_PAGE_CAP;
  const { mutate: updateMember } = useUpdateStaffMember();

  const entities = useMemo(() => {
    const byCode = new Map<EntityCode, string>();
    for (const member of members) {
      // `entityCode`/`entityName` pueden ser `null` (persona sin entidad
      // asignada todavía) — no entran en los pills de filtro por entidad.
      if (member.entityCode && member.entityName) byCode.set(member.entityCode, member.entityName);
    }
    return Array.from(byCode.entries()).map(([code, name]) => ({
      code,
      name,
      count: members.filter((m) => m.entityCode === code).length,
    }));
  }, [members]);

  const filtered = useMemo(() => {
    const query = normalize(search.trim());
    return members
      .filter((member) => entityFilter === 'all' || member.entityCode === entityFilter)
      .filter(
        (member) =>
          !query || normalize(member.fullName).includes(query) || normalize(member.email).includes(query)
      );
  }, [members, entityFilter, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const entityCount = new Set(members.map((m) => m.entityCode).filter(Boolean)).size;

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Plantilla</h1>
          <p className={styles.subtitle}>
            {members.length} personas · {entityCount} entidades
          </p>
        </div>
        <Button onClick={() => setDialogMember('new')}>
          <UserPlus />
          Añadir persona
        </Button>
      </div>

      {reachedClientCap && (
        <div className={styles.capWarning}>
          <AlertTriangle className={styles.capWarningIcon} />
          Mostrando los primeros {CLIENT_PAGE_CAP} — puede haber más personas en la plantilla. La
          paginación completa llegará con el contrato del backend.
        </div>
      )}

      <Card className={styles.card}>
        <div className={styles.controls}>
          <div className={styles.filters}>
            <button
              type="button"
              className={cn(styles.filterPill, entityFilter === 'all' && styles.filterPillActive)}
              onClick={() => {
                setEntityFilter('all');
                setPage(1);
              }}
            >
              Todas · {members.length}
            </button>
            {entities.map((entity) => (
              <button
                key={entity.code}
                type="button"
                className={cn(styles.filterPill, entityFilter === entity.code && styles.filterPillActive)}
                onClick={() => {
                  setEntityFilter(entity.code);
                  setPage(1);
                }}
              >
                {entity.name} · {entity.count}
              </button>
            ))}
          </div>

          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              className={styles.searchInput}
              placeholder="Buscar persona…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </div>
        </div>

        <StaffTable
          members={paged}
          isLoading={isLoading}
          onEdit={setDialogMember}
          onToggleActive={(member) => updateMember({ id: member.id, input: { isActive: !member.isActive } })}
        />

        {filtered.length > 0 && (
          <div className={styles.pagination}>
            <p className={styles.paginationLabel}>
              Mostrando {paged.length} de {filtered.length}
            </p>
            <div className={styles.paginationControls}>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Página anterior"
              >
                <ChevronLeft />
              </button>
              <span className={styles.pageCurrent}>{currentPage}</span>
              <button
                type="button"
                className={styles.pageButton}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                aria-label="Página siguiente"
              >
                <ChevronRight />
              </button>
            </div>
          </div>
        )}
      </Card>

      <StaffFormDialog
        open={dialogMember !== null}
        onOpenChange={(open) => !open && setDialogMember(null)}
        member={dialogMember && dialogMember !== 'new' ? dialogMember : undefined}
      />
    </div>
  );
}
