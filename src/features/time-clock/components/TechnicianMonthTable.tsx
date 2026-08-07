import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import {
  OVERNIGHT_LABEL,
  PRODUCT_LABEL,
  endsNextDay,
  formatMinutes,
  toTimeInput,
} from '../domain/technicianLog';
import type { TechnicianDailyLog } from '../domain/models';
import styles from './TechnicianMonthTable.module.css';

function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  return `${day}/${month}/${year}`;
}

interface TechnicianMonthTableProps {
  logs: TechnicianDailyLog[];
  isLoading?: boolean;
  /** Ausentes en la vista del administrador de solo lectura. */
  onEdit?: (log: TechnicianDailyLog) => void;
  onDelete?: (log: TechnicianDailyLog) => void;
  /** El admin ve de quién es cada parte; el técnico no lo necesita. */
  showTechnician?: boolean;
}

export function TechnicianMonthTable({
  logs,
  isLoading,
  onEdit,
  onDelete,
  showTechnician,
}: TechnicianMonthTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Partes del mes</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && <p className={styles.empty}>Cargando partes…</p>}

        {!isLoading && logs.length === 0 && (
          <p className={styles.empty}>Todavía no hay partes registrados en este mes.</p>
        )}

        {!isLoading && logs.length > 0 && (
          <div className={styles.scroll}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th scope="col">Fecha</th>
                  {showTechnician && <th scope="col">Técnico</th>}
                  <th scope="col">Proyecto</th>
                  <th scope="col">Lugar</th>
                  <th scope="col">Inicio</th>
                  <th scope="col">Fin</th>
                  <th scope="col">Pausa</th>
                  <th scope="col">Efectivas</th>
                  <th scope="col">Pernocta</th>
                  <th scope="col">Producto</th>
                  {(onEdit || onDelete) && <th scope="col">Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.entryId}>
                    <td>{formatDate(log.workDate)}</td>
                    {showTechnician && <td>{log.fullName ?? '—'}</td>}
                    <td>{log.projectName ?? '—'}</td>
                    <td>{log.workLocation}</td>
                    <td>{toTimeInput(log.startedAt)}</td>
                    <td>
                      {toTimeInput(log.endedAt)}
                      {/* La jornada que cruza el día se marca en la propia
                          celda: sin esto, "08:00 → 01:30" se lee como un error
                          de tecleo en vez de como una jornada de 17 horas. */}
                      {endsNextDay(log) && (
                        <span className={styles.nextDay} title="Terminó al día siguiente">
                          {' '}
                          +1
                        </span>
                      )}
                    </td>
                    <td>{log.hadBreak ? `${log.breakMinutes} min` : 'No'}</td>
                    <td className={styles.numeric}>{formatMinutes(log.workedMinutes)}</td>
                    <td>{OVERNIGHT_LABEL[log.overnightStay]}</td>
                    <td>{PRODUCT_LABEL[log.productCategory]}</td>
                    {(onEdit || onDelete) && (
                      <td>
                        <div className={styles.rowActions}>
                          {onEdit && (
                            <Button variant="ghost" size="sm" onClick={() => onEdit(log)}>
                              Editar
                            </Button>
                          )}
                          {onDelete && (
                            <Button variant="ghost" size="sm" onClick={() => onDelete(log)}>
                              Eliminar
                            </Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
