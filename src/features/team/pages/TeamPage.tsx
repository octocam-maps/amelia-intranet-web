import { useMemo, useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { useTeamDirectory } from '../application/useTeamDirectory';
import { TeamCalendar } from '../components/TeamCalendar';
import { TeamDirectory } from '../components/TeamDirectory';
import { TeamOrgChartPlaceholder } from '../components/TeamOrgChartPlaceholder';
import styles from './TeamPage.module.css';

type TeamTab = 'directorio' | 'calendario' | 'organigrama';

const SUBTITLE_BY_TAB: Record<TeamTab, string> = {
  directorio: '',
  calendario: 'Quién está fuera en tu departamento',
  organigrama: 'Estructura del grupo Amelia',
};

/**
 * deck-fase5/06,07,08-equipo-*.png — una sola ruta `/equipo` con 3 pestañas.
 * El directorio es la única que necesita datos para el subtítulo de
 * cabecera ("N personas · M entidades"); el resto tiene subtítulo fijo.
 */
export function TeamPage() {
  const [tab, setTab] = useState<TeamTab>('directorio');
  const { data: members = [], isLoading } = useTeamDirectory();

  const entityCount = useMemo(
    () => new Set(members.map((m) => m.entityCode)).size,
    [members]
  );
  const subtitle =
    tab === 'directorio'
      ? `${members.length} personas · ${entityCount} entidades`
      : SUBTITLE_BY_TAB[tab];

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>Equipo</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </div>

      <Tabs value={tab} onValueChange={(value) => setTab(value as TeamTab)}>
        <TabsList>
          <TabsTrigger value="directorio">Directorio</TabsTrigger>
          <TabsTrigger value="calendario">Calendario del equipo</TabsTrigger>
          <TabsTrigger value="organigrama">Organigrama</TabsTrigger>
        </TabsList>

        <TabsContent value="directorio" className={styles.content}>
          <TeamDirectory members={members} isLoading={isLoading} />
        </TabsContent>
        <TabsContent value="calendario" className={styles.content}>
          <TeamCalendar />
        </TabsContent>
        <TabsContent value="organigrama" className={styles.content}>
          <TeamOrgChartPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
