import { useQuery } from '@tanstack/react-query';
import { timeClockApiAdapter } from '../infrastructure/time-clock-api.adapter';

/** Catálogo de proyectos activos para el desplegable del parte. Cambia muy
 * poco, así que un `staleTime` largo evita repetir la consulta cada vez que se
 * abre el formulario. */
export function useProjects() {
  return useQuery({
    queryKey: ['time-clock', 'projects'],
    queryFn: () => timeClockApiAdapter.listProjects(),
    staleTime: 5 * 60_000,
  });
}
