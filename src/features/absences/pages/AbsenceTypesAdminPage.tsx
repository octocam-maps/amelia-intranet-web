import { useState } from 'react';
import { Plus } from 'lucide-react';
import { ConfigTabsNav } from '@/components/composites/ConfigTabsNav';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAllAbsenceTypes } from '../application/useAllAbsenceTypes';
import { AbsenceTypeFormDialog } from '../components/AbsenceTypeFormDialog';
import { AbsenceTypesGrid } from '../components/AbsenceTypesGrid';
import type { AbsenceType } from '../domain/models';
import styles from './AbsenceTypesAdminPage.module.css';

/** deck-fase6/15-tipos-ausencia.png */
export function AbsenceTypesAdminPage() {
  const [dialogType, setDialogType] = useState<AbsenceType | 'new' | null>(null);
  const { data: types = [], isLoading } = useAllAbsenceTypes();

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Configuración · Tipos de ausencia</h1>
          <p className={styles.subtitle}>Catálogo de ausencias disponible para toda la plantilla</p>
        </div>
        <Button onClick={() => setDialogType('new')}>
          <Plus />
          Nuevo tipo
        </Button>
      </div>

      <ConfigTabsNav active="tipos-ausencia" />

      <Card className={styles.card}>
        <h2 className={styles.sectionTitle}>Tipos configurados</h2>
        <AbsenceTypesGrid
          types={types}
          isLoading={isLoading}
          onEdit={setDialogType}
          onAdd={() => setDialogType('new')}
        />
      </Card>

      <AbsenceTypeFormDialog
        open={dialogType !== null}
        onOpenChange={(open) => !open && setDialogType(null)}
        absenceType={dialogType && dialogType !== 'new' ? dialogType : undefined}
      />
    </div>
  );
}
