import { useCallback, useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentsApiAdapter } from '../infrastructure/documents-api.adapter';

/** Personas por lote. El servidor lo acota igualmente; aquí se elige tirando a
 * bajo porque quien espera es una persona mirando una barra. */
const BATCH_LIMIT = 10;

/**
 * Pasada EN SECO del volcado.
 *
 * Es una `useMutation` y no una `useQuery` a pesar de ser un `GET`: no
 * queremos que se dispare sola al montar la página ni que TanStack la refresque
 * al volver a enfocar la pestaña. Debe ocurrir cuando el administrador abre el
 * diálogo, y solo entonces.
 */
export function usePlanFolders() {
  return useMutation({
    mutationFn: () => documentsApiAdapter.planFolders(),
  });
}

export interface ProvisionProgress {
  created: number;
  relocated: number;
  remaining: number;
  /** Personas que el servidor devolvió una y otra vez sin poder resolver. */
  stuck: number;
  done: boolean;
}

/**
 * Ejecuta el volcado LOTE A LOTE hasta agotarlo.
 *
 * El bucle NO puede condicionarse a `remaining > 0`. Una persona que falla
 * siempre —Drive le devuelve 403, por ejemplo— nunca sale del conjunto
 * pendiente, así que el servidor la devolvería en cada tanda y esto giraría
 * para siempre machacando la API.
 *
 * La condición real es que `remaining` BAJE. En cuanto una tanda no reduce el
 * pendiente, se para y se informa de cuántas quedaron atascadas: es información
 * accionable —hay que mirar los logs de esas personas— y no un error genérico.
 */
export function useProvisionFolders() {
  const queryClient = useQueryClient();
  const [progress, setProgress] = useState<ProvisionProgress | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [error, setError] = useState<unknown>(null);
  // Una bandera de instancia y no de estado: hay que poder leerla DENTRO del
  // bucle, y el `progress` de un `useState` estaría congelado en el valor del
  // render en que arrancó.
  const cancelled = useRef(false);

  const reset = useCallback(() => {
    cancelled.current = true;
    setProgress(null);
    setError(null);
    setIsRunning(false);
  }, []);

  const run = useCallback(async () => {
    cancelled.current = false;
    setError(null);
    setIsRunning(true);

    let created = 0;
    let relocated = 0;
    let previous = Infinity;

    try {
      for (;;) {
        const batch = await documentsApiAdapter.provisionFoldersBatch(BATCH_LIMIT);
        created += batch.created;
        relocated += batch.relocated;

        const stalled = batch.remaining >= previous;
        previous = batch.remaining;

        const done = batch.remaining === 0 || stalled;
        setProgress({
          created,
          relocated,
          remaining: batch.remaining,
          stuck: done ? batch.remaining : 0,
          done,
        });

        if (done || cancelled.current) break;
      }
      // El volcado cachea `drive_folder_id` en cada usuario; otras vistas del
      // personal lo reflejan.
      queryClient.invalidateQueries({ queryKey: ['staff'] });
    } catch (err) {
      setError(err);
    } finally {
      setIsRunning(false);
    }
  }, [queryClient]);

  return { run, reset, progress, isRunning, error };
}
