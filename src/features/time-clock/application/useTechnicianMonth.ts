import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';
import type {
  TechnicianDailyLogInput,
  TechnicianMonthParams,
} from '../domain/models';

/**
 * Partes de un mes natural más su resumen (consumo sobre la bolsa de 162 h,
 * excedente, compensación y pernoctas). Vienen en la MISMA respuesta y por eso
 * comparten hook: pedirlos por separado permitiría que la tabla y los totales
 * se contradijeran si un parte cambia entre las dos peticiones.
 */
interface QueryOptions {
  /** `false` mientras falte un dato obligatorio de la consulta — p. ej. el
   * admin que aún no ha elegido técnico. Sin esto se lanzaría una petición
   * cuyo resultado no significa lo que la pantalla mostraría. */
  enabled?: boolean;
}

export function useTechnicianMonth(params: TechnicianMonthParams, options: QueryOptions = {}) {
  return useQuery({
    queryKey: ['time-clock', 'technician-logs', params],
    queryFn: () => timeClockApiAdapter.listTechnicianLogs(params),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

/**
 * Saldo ANUAL de descanso por horas extra.
 *
 * Se invalida junto con los partes en cada mutación: el saldo se calcula al
 * vuelo desde ellos (no hay tabla de saldos), así que corregir un parte de un
 * mes ya cerrado lo mueve. Dejarlo en caché mostraría un saldo que ya no es.
 */
export function useCompensationBalance(
  year: number,
  userId?: string,
  options: QueryOptions = {},
) {
  return useQuery({
    queryKey: ['time-clock', 'compensation-balance', year, userId ?? 'self'],
    queryFn: () => timeClockApiAdapter.getCompensationBalance(year, userId),
    staleTime: 30_000,
    enabled: options.enabled ?? true,
  });
}

function useInvalidateTechnicianData() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['time-clock', 'technician-logs'] });
    queryClient.invalidateQueries({ queryKey: ['time-clock', 'compensation-balance'] });
    // El parte escribe también en `time_clock_entries`, que es de donde come
    // el resumen del dashboard.
    queryClient.invalidateQueries({ queryKey: ['dashboard', 'summary'] });
  };
}

export function useCreateTechnicianLog() {
  const invalidate = useInvalidateTechnicianData();
  return useMutation({
    mutationFn: (input: TechnicianDailyLogInput) =>
      timeClockApiAdapter.createTechnicianLog(input),
    onSuccess: invalidate,
  });
}

export function useUpdateTechnicianLog() {
  const invalidate = useInvalidateTechnicianData();
  return useMutation({
    mutationFn: ({ entryId, input }: { entryId: string; input: TechnicianDailyLogInput }) =>
      timeClockApiAdapter.updateTechnicianLog(entryId, input),
    onSuccess: invalidate,
  });
}

export function useDeleteTechnicianLog() {
  const invalidate = useInvalidateTechnicianData();
  return useMutation({
    mutationFn: (entryId: string) => timeClockApiAdapter.removeTechnicianLog(entryId),
    onSuccess: invalidate,
  });
}

export function useExportTechnicianMonthXlsx() {
  return useMutation({
    mutationFn: async (params: TechnicianMonthParams) => {
      const blob = await timeClockApiAdapter.exportTechnicianMonthXlsx(params);
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `registro-horario-${params.year}-${String(params.month).padStart(2, '0')}.xlsx`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    },
  });
}
