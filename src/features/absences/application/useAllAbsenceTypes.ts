import { useQuery } from '@tanstack/react-query';
import { absencesApiAdapter } from '../infrastructure/absences-api.adapter';

/**
 * Catálogo COMPLETO de tipos de ausencia (incluye los desactivados) para la
 * pantalla de gestión del admin. La queryKey cuelga de `['absences','types']`
 * a propósito: las mutaciones de alta/edición invalidan ese prefijo y
 * refrescan tanto esta lista como la de solo-activos del modal de solicitud.
 */
export function useAllAbsenceTypes() {
  return useQuery({
    queryKey: ['absences', 'types', 'admin'],
    queryFn: () => absencesApiAdapter.listAllTypes(),
    staleTime: 5 * 60_000,
  });
}
