import { useQuery } from '@tanstack/react-query';
import { manualsApiAdapter } from '../infrastructure/manuals-api.adapter';

/**
 * `GET /manuals` está abierto a los CINCO roles, así que no lleva `enabled`: a
 * diferencia de `useStaffList`, no hay ningún rol que reciba un 403 por montarlo.
 */
export function useManuals() {
  return useQuery({
    queryKey: ['manuals', 'library'],
    queryFn: () => manualsApiAdapter.list(),
    // El catálogo lo cambia RRHH publicando un manual nuevo, no el usuario.
    staleTime: 5 * 60_000,
  });
}
