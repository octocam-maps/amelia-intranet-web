import { useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { categorizeAbsenceRequestsByTab } from '../domain/absenceRequestTabs';
import type { AbsenceRequest, AbsenceType } from '../domain/models';
import { AbsenceCompactList } from './AbsenceCompactList';

interface AbsenceRequestsTabsProps {
  requests: AbsenceRequest[];
  types: AbsenceType[];
}

function startOfToday(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * "Mis solicitudes" (columna izquierda, deck 03-ausencias-empleado) —
 * reemplaza al panel plano "Mis ausencias". Mismas filas de
 * `AbsenceCompactList` (punto de color, rango, días, icono de estado),
 * agrupadas en 3 pestañas sobre la lista ya cargada por
 * `useAbsenceRequests({ mode: 'own' })` — sin volver a pedir nada al
 * backend, la categorización es puramente de cliente
 * (`categorizeAbsenceRequestsByTab`).
 */
export function AbsenceRequestsTabs({ requests, types }: AbsenceRequestsTabsProps) {
  const tabs = useMemo(() => categorizeAbsenceRequestsByTab(requests, startOfToday()), [requests]);

  return (
    <Tabs defaultValue="approved">
      <TabsList>
        <TabsTrigger value="approved">Aprobadas</TabsTrigger>
        <TabsTrigger value="pending">Pendientes</TabsTrigger>
        <TabsTrigger value="past">Pasadas</TabsTrigger>
      </TabsList>

      <TabsContent value="approved">
        <AbsenceCompactList
          requests={tabs.approved}
          types={types}
          emptyMessage="No tienes solicitudes aprobadas."
        />
      </TabsContent>
      <TabsContent value="pending">
        <AbsenceCompactList
          requests={tabs.pending}
          types={types}
          emptyMessage="No tienes solicitudes pendientes."
        />
      </TabsContent>
      <TabsContent value="past">
        <AbsenceCompactList requests={tabs.past} types={types} emptyMessage="No tienes solicitudes pasadas." />
      </TabsContent>
    </Tabs>
  );
}
