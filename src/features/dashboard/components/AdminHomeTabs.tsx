import { CalendarClockIcon } from '@/components/icons';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import type { AdminMetricsKpis, PendingAbsenceRequestSummary } from '../domain/models';
import { AdminApprovalQueueCard } from './AdminApprovalQueueCard';
import { AdminDocumentsPlaceholderCard } from './AdminDocumentsPlaceholderCard';
import { AdminTimeClockSummaryCard } from './AdminTimeClockSummaryCard';
import styles from './AdminHomeTabs.module.css';

interface AdminHomeTabsProps {
  pendingAbsenceRequests: PendingAbsenceRequestSummary[];
  metricsKpis: AdminMetricsKpis | undefined;
  isMetricsLoading: boolean;
}

/**
 * Sección central con pestañas del Home admin (brief: "evitá saturar de
 * tablas largas: una por pestaña") — solo "Ausencias" trae una tabla (la
 * bandeja de aprobación, `AdminApprovalQueueCard` ya existente); el resto
 * son resúmenes ligeros o un placeholder honesto ("Documentos", Fase 4).
 */
export function AdminHomeTabs({ pendingAbsenceRequests, metricsKpis, isMetricsLoading }: AdminHomeTabsProps) {
  return (
    <Card>
      <CardHeader className={styles.headerRow}>
        <CardTitle>Resumen operativo</CardTitle>
        <CalendarClockIcon className={styles.headerIcon} />
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="ausencias">
          <TabsList>
            <TabsTrigger value="ausencias">Ausencias</TabsTrigger>
            <TabsTrigger value="control-horario">Control horario</TabsTrigger>
            <TabsTrigger value="documentos">Documentos</TabsTrigger>
          </TabsList>

          <TabsContent value="ausencias">
            <AdminApprovalQueueCard requests={pendingAbsenceRequests} />
          </TabsContent>
          <TabsContent value="control-horario">
            <AdminTimeClockSummaryCard kpis={metricsKpis} isLoading={isMetricsLoading} />
          </TabsContent>
          <TabsContent value="documentos">
            <AdminDocumentsPlaceholderCard />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
