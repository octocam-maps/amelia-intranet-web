import { useMemo, useState } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, DownloadIcon } from '@radix-ui/react-icons';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { canUseTechnicianLog, isAdmin } from '@/features/auth/domain/models';
import { useStaffList } from '@/features/staff/application/useStaffList';
import { ApiError } from '@/lib/http/api-client';
import { useStore } from '@/store';
import {
  useCompensationBalance,
  useCreateTechnicianLog,
  useDeleteTechnicianLog,
  useExportTechnicianMonthXlsx,
  useTechnicianMonth,
  useUpdateTechnicianLog,
} from '../application/useTechnicianMonth';
import { TechnicianLogForm } from '../components/TechnicianLogForm';
import { TechnicianMonthTable } from '../components/TechnicianMonthTable';
import { CompensationBalanceCard, MonthBudgetCard } from '../components/TechnicianSummaryCards';
import type { TechnicianDailyLog, TechnicianDailyLogInput } from '../domain/models';
import styles from './TechnicianTimeClockPage.module.css';

const MONTH_NAMES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

// Mismo techo que el resto de selectores de persona de la app: alimenta un
// desplegable, no una tabla paginada.
const STAFF_SELECTOR_PAGE_SIZE = 200;

interface TechnicianTimeClockPageProps {
  /**
   * `true` en la vista de Administración: el admin elige de qué técnico ve el
   * mes, puede corregir y descargar el Excel, pero NO registra partes ajenos
   * — el parte lo cumplimenta quien hizo la jornada.
   */
  adminView?: boolean;
}

export function TechnicianTimeClockPage({ adminView = false }: TechnicianTimeClockPageProps) {
  const currentUser = useStore((s) => s.user);
  const admin = isAdmin(currentUser?.role);
  const ownsTheLogs = canUseTechnicianLog(currentUser?.role);

  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });
  const [selectedUserId, setSelectedUserId] = useState<string | undefined>(undefined);
  const [editing, setEditing] = useState<TechnicianDailyLog | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const params = useMemo(
    () => ({ year: cursor.year, month: cursor.month, userId: selectedUserId }),
    [cursor, selectedUserId],
  );

  // En la vista de admin no se consulta hasta elegir técnico: sin `user_id` el
  // backend respondería con los partes del PROPIO admin —que no tiene— y la
  // pantalla mostraría un mes vacío con saldo cero, indistinguible de "este
  // técnico no ha registrado nada".
  const waitingForTechnician = adminView && !selectedUserId;

  const { data, isLoading } = useTechnicianMonth(params, {
    enabled: !waitingForTechnician,
  });
  const { data: balance } = useCompensationBalance(cursor.year, selectedUserId, {
    enabled: !waitingForTechnician,
  });
  const createLog = useCreateTechnicianLog();
  const updateLog = useUpdateTechnicianLog();
  const deleteLog = useDeleteTechnicianLog();
  const exportXlsx = useExportTechnicianMonthXlsx();

  // Solo el admin necesita el selector de persona, y solo en su vista.
  const { data: staffPage } = useStaffList(
    { page: 1, pageSize: STAFF_SELECTOR_PAGE_SIZE },
    { enabled: adminView && admin },
  );
  const technicians = useMemo(
    () => (staffPage?.members ?? []).filter((member) => member.role === 'tecnico'),
    [staffPage],
  );

  function shiftMonth(delta: number) {
    setCursor((current) => {
      const date = new Date(current.year, current.month - 1 + delta, 1);
      return { year: date.getFullYear(), month: date.getMonth() + 1 };
    });
    setEditing(null);
  }

  async function handleSubmit(input: TechnicianDailyLogInput) {
    setServerError(null);
    try {
      if (editing) {
        await updateLog.mutateAsync({ entryId: editing.entryId, input });
        setEditing(null);
      } else {
        await createLog.mutateAsync(input);
      }
    } catch (error) {
      // El mensaje del backend es el bueno ("Ya existe un parte para ese día",
      // "No puedes registrar un tramo con fecha futura"): explica la regla
      // concreta que se ha incumplido, cosa que un texto genérico no haría.
      setServerError(
        error instanceof ApiError ? error.message : 'No se ha podido guardar el parte.',
      );
    }
  }

  async function handleDelete(log: TechnicianDailyLog) {
    const confirmed = window.confirm(
      `¿Eliminar el parte del ${log.workDate}? Sus horas dejarán de contar en la bolsa del mes.`,
    );
    if (!confirmed) return;
    await deleteLog.mutateAsync(log.entryId);
    if (editing?.entryId === log.entryId) setEditing(null);
  }

  if (adminView && !admin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sección no disponible</CardTitle>
        </CardHeader>
        <CardContent>
          <p>El registro horario de técnicos es exclusivo de Administración.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.monthNav}>
          <Button
            variant="outline"
            size="sm"
            aria-label="Mes anterior"
            onClick={() => shiftMonth(-1)}
          >
            <ChevronLeftIcon />
          </Button>
          <span className={styles.monthLabel}>
            {MONTH_NAMES[cursor.month - 1]} de {cursor.year}
          </span>
          <Button
            variant="outline"
            size="sm"
            aria-label="Mes siguiente"
            onClick={() => shiftMonth(1)}
          >
            <ChevronRightIcon />
          </Button>
        </div>

        {adminView && (
          <Select
            value={selectedUserId ?? ''}
            onValueChange={(value) => setSelectedUserId(value || undefined)}
          >
            <SelectTrigger className={styles.technicianSelect} aria-label="Técnico">
              <SelectValue placeholder="Selecciona un técnico" />
            </SelectTrigger>
            <SelectContent>
              {technicians.map((technician) => (
                <SelectItem key={technician.id} value={technician.id}>
                  {technician.fullName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Button
          variant="outline"
          size="sm"
          disabled={exportXlsx.isPending || !data || data.logs.length === 0}
          onClick={() => exportXlsx.mutate(params)}
        >
          <DownloadIcon /> Descargar Excel del mes
        </Button>
      </div>

      {waitingForTechnician && (
        <Card>
          <CardHeader>
            <CardTitle>Elige un técnico</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Selecciona arriba de quién quieres ver el registro horario del mes.</p>
          </CardContent>
        </Card>
      )}

      {!waitingForTechnician && data && (
        <div className={styles.cards}>
          <MonthBudgetCard summary={data.summary} />
          {balance && <CompensationBalanceCard balance={balance} />}
        </div>
      )}

      {/* El admin corrige y consulta, pero no rellena partes ajenos: la
          jornada la declara quien la hizo. */}
      {ownsTheLogs && !adminView && (
        <TechnicianLogForm
          editing={editing}
          onSubmit={handleSubmit}
          onCancelEdit={() => setEditing(null)}
          isSubmitting={createLog.isPending || updateLog.isPending}
          serverError={serverError}
        />
      )}

      {!waitingForTechnician && (
        <TechnicianMonthTable
          logs={data?.logs ?? []}
          isLoading={isLoading}
          showTechnician={adminView}
          onEdit={ownsTheLogs || admin ? setEditing : undefined}
          onDelete={ownsTheLogs || admin ? handleDelete : undefined}
        />
      )}
    </div>
  );
}
