import { useMemo, useState } from 'react';
import { EnvelopeClosedIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { PhoneIcon } from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { EntityCode, TeamMember } from '../domain/models';
import styles from './TeamDirectory.module.css';

// deck-fase5/06-equipo-directorio.png — cada entidad tiene su propio color de
// insignia; reutilizamos las variantes ya definidas en Badge en vez de
// inventar tonos nuevos fuera de los tokens de marca.
const ENTITY_BADGE_VARIANT: Record<EntityCode, 'success' | 'info' | 'warning'> = {
  hub: 'success',
  lab: 'info',
  ops: 'warning',
};

function entityShortLabel(code: EntityCode): string {
  return code.charAt(0).toUpperCase() + code.slice(1);
}

function initialsOf(fullName: string): string {
  return fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

/** Quita acentos para que "Ferran" encuentre a "Ferrán" — `\p{M}` (categoría
 * Unicode "Mark") cubre las marcas diacríticas que deja `normalize('NFD')`
 * sin tener que listar un rango de caracteres combinantes a mano. */
function normalize(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
}

interface TeamDirectoryProps {
  members: TeamMember[];
  isLoading: boolean;
}

export function TeamDirectory({ members, isLoading }: TeamDirectoryProps) {
  const [entityFilter, setEntityFilter] = useState<EntityCode | 'all'>('all');
  const [search, setSearch] = useState('');

  const entities = useMemo(() => {
    const byCode = new Map<EntityCode, string>();
    for (const member of members) {
      // Los usuarios sin entidad asignada no generan pill de filtro; siguen
      // apareciendo en "Todos".
      if (!member.entityCode) continue;
      byCode.set(member.entityCode, member.entityName ?? entityShortLabel(member.entityCode));
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
      .filter((member) => !query || normalize(member.fullName).includes(query));
  }, [members, entityFilter, search]);

  return (
    <div className={styles.root}>
      <div className={styles.controls}>
        <div className={styles.filters}>
          <button
            type="button"
            className={cn(styles.filterPill, entityFilter === 'all' && styles.filterPillActive)}
            onClick={() => setEntityFilter('all')}
          >
            Todos · {members.length}
          </button>
          {entities.map((entity) => (
            <button
              key={entity.code}
              type="button"
              className={cn(styles.filterPill, entityFilter === entity.code && styles.filterPillActive)}
              onClick={() => setEntityFilter(entity.code)}
            >
              {entity.name} · {entity.count}
            </button>
          ))}
        </div>

        <div className={styles.searchWrapper}>
          <MagnifyingGlassIcon className={styles.searchIcon} />
          <Input
            className={styles.searchInput}
            placeholder="Buscar por nombre…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {isLoading ? (
        <p className={styles.empty}>Cargando equipo…</p>
      ) : filtered.length === 0 ? (
        <p className={styles.empty}>No se ha encontrado a nadie con ese criterio.</p>
      ) : (
        <div className={styles.grid}>
          {filtered.map((member) => (
            <Card key={member.id} className={styles.card}>
              <CardContent className={styles.cardContent}>
                <div className={styles.topRow}>
                  <Avatar>
                    <AvatarFallback>{initialsOf(member.fullName)}</AvatarFallback>
                  </Avatar>
                  {member.entityCode && (
                    <Badge variant={ENTITY_BADGE_VARIANT[member.entityCode]}>
                      {entityShortLabel(member.entityCode)}
                    </Badge>
                  )}
                </div>

                <div className={styles.identity}>
                  <p className={styles.name}>{member.fullName}</p>
                  <p className={styles.jobTitle}>{member.jobTitle ?? '—'}</p>
                </div>

                <div className={styles.contact}>
                  {member.phone && (
                    <span className={styles.contactRow}>
                      <PhoneIcon />
                      {member.phone}
                    </span>
                  )}
                  <span className={styles.contactRow}>
                    <EnvelopeClosedIcon />
                    {member.email}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
