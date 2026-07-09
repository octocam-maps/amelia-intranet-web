import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { useAbsenceRequests } from '../application/useAbsenceRequests';
import { useAbsenceTypes } from '../application/useAbsenceTypes';
import { useReviewAbsenceRequest } from '../application/useReviewAbsenceRequest';
import styles from './AbsenceApprovalTray.module.css';

/** Bandeja de aprobación — exclusiva del admin (RBAC real en el backend,
 * `require_role("administrador")`; esta página solo se monta si el rol
 * coincide, pero aunque no fuera así el endpoint rechazaría la petición). */
export function AbsenceApprovalTray() {
  const { data: types = [] } = useAbsenceTypes();
  const { data: requests = [], isLoading } = useAbsenceRequests({ mode: 'pending' });
  const { mutate: review, isPending } = useReviewAbsenceRequest();
  const [notes, setNotes] = useState<Record<string, string>>({});

  const typeById = new Map(types.map((t) => [t.id, t]));

  if (isLoading) return <p className={styles.loading}>Cargando bandeja…</p>;
  if (requests.length === 0) {
    return <p className={styles.empty}>No hay solicitudes pendientes de revisión.</p>;
  }

  return (
    <ul className={styles.list}>
      {requests.map((request) => (
        <li key={request.id} className={styles.item}>
          <div className={styles.summary}>
            <p className={styles.type}>{typeById.get(request.absenceTypeId)?.name ?? '—'}</p>
            <p className={styles.range}>
              {request.startDate} → {request.endDate} · {request.daysCount} días
            </p>
            {request.reason && <p className={styles.reason}>«{request.reason}»</p>}
          </div>

          <Textarea
            placeholder="Nota (opcional)"
            className={styles.note}
            value={notes[request.id] ?? ''}
            onChange={(e) => setNotes((prev) => ({ ...prev, [request.id]: e.target.value }))}
          />

          <div className={styles.actions}>
            <Button
              variant="outline"
              disabled={isPending}
              onClick={() =>
                review({
                  requestId: request.id,
                  input: { decision: 'rejected', note: notes[request.id] },
                })
              }
            >
              Rechazar
            </Button>
            <Button
              disabled={isPending}
              onClick={() =>
                review({
                  requestId: request.id,
                  input: { decision: 'approved', note: notes[request.id] },
                })
              }
            >
              Aprobar
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}
