import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Switch } from '@/components/ui/Switch';
import { useProjects } from '../application/useProjects';
import {
  crossesMidnight,
  effectiveMinutes,
  formatMinutes,
  logToFormValues,
  toIsoDateTime,
  validateTechnicianLog,
} from '../domain/technicianLog';
import type { TechnicianLogFormValues } from '../domain/technicianLog';
import type { TechnicianDailyLog, TechnicianDailyLogInput } from '../domain/models';
import { TimeSelect } from './TimeSelect';
import styles from './TechnicianLogForm.module.css';

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

const EMPTY: TechnicianLogFormValues = {
  workDate: todayIso(),
  startTime: '08:00',
  endTime: '17:00',
  projectId: '',
  workLocation: '',
  hadBreak: false,
  breakMinutes: 0,
  hadOvernight: false,
  overnightPlace: 'espana',
  productCategory: 'software',
};

interface TechnicianLogFormProps {
  /** Si viene, el formulario edita ese parte en vez de crear uno nuevo. */
  editing?: TechnicianDailyLog | null;
  onSubmit: (input: TechnicianDailyLogInput) => Promise<unknown>;
  onCancelEdit?: () => void;
  isSubmitting?: boolean;
  /** Error del backend (p. ej. "Ya existe un parte para ese día"). */
  serverError?: string | null;
}

/**
 * Parte diario del técnico (requerimiento v1.2 §M1).
 *
 * Pide HORAS DE PARED, no fechas completas, incluso para la jornada que
 * termina de madrugada: el técnico escribe "llegué a la 01:30" y el
 * formulario deduce que fue al día siguiente. Obligarle a cambiar también la
 * fecha para decir eso sería pedirle que tradujera a mano lo que el sistema
 * puede inferir — y es donde se cuela el error.
 */
export function TechnicianLogForm({
  editing,
  onSubmit,
  onCancelEdit,
  isSubmitting,
  serverError,
}: TechnicianLogFormProps) {
  const { data: projects = [], isLoading: isLoadingProjects } = useProjects();
  const [values, setValues] = useState<TechnicianLogFormValues>(EMPTY);
  const [touchedError, setTouchedError] = useState<string | null>(null);

  useEffect(() => {
    setValues(editing ? logToFormValues(editing) : EMPTY);
    setTouchedError(null);
  }, [editing]);

  const effective = useMemo(() => effectiveMinutes(values), [values]);
  const overnightShift = crossesMidnight(values.startTime, values.endTime);

  function update<K extends keyof TechnicianLogFormValues>(
    key: K,
    value: TechnicianLogFormValues[K],
  ) {
    setValues((current) => ({ ...current, [key]: value }));
    setTouchedError(null);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const error = validateTechnicianLog(values);
    if (error) {
      setTouchedError(error);
      return;
    }

    await onSubmit({
      workDate: values.workDate,
      startedAt: toIsoDateTime(values.workDate, values.startTime),
      // El +1 día es lo que materializa el cruce de medianoche: la hora de
      // fin pertenece al día siguiente, aunque el parte se impute al de
      // inicio.
      endedAt: toIsoDateTime(values.workDate, values.endTime, overnightShift ? 1 : 0),
      projectId: values.projectId,
      workLocation: values.workLocation.trim(),
      hadBreak: values.hadBreak,
      breakMinutes: values.hadBreak ? values.breakMinutes : 0,
      overnightStay: values.hadOvernight ? values.overnightPlace : 'ninguna',
      productCategory: values.productCategory,
    });
  }

  const error = touchedError ?? serverError ?? null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{editing ? 'Editar parte' : 'Registrar jornada'}</CardTitle>
      </CardHeader>
      <CardContent>
        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.row}>
            <div className={styles.field}>
              <Label htmlFor="workDate">Fecha</Label>
              <Input
                id="workDate"
                type="date"
                value={values.workDate}
                // La fecha define el mes al que cuenta la jornada, así que
                // cambiarla movería el parte de bolsa. Al editar se bloquea:
                // para eso se borra y se crea de nuevo.
                disabled={Boolean(editing)}
                onChange={(e) => update('workDate', e.target.value)}
              />
            </div>

            <div className={styles.field}>
              <Label htmlFor="projectId">Proyecto</Label>
              <Select
                value={values.projectId}
                disabled={isLoadingProjects}
                onValueChange={(value) => update('projectId', value)}
              >
                <SelectTrigger id="projectId">
                  <SelectValue
                    placeholder={isLoadingProjects ? 'Cargando…' : 'Selecciona el proyecto'}
                  />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className={styles.field}>
            <Label htmlFor="workLocation">Lugar de trabajo</Label>
            <Input
              id="workLocation"
              value={values.workLocation}
              placeholder="P. ej. Planta de Guadix, Granada"
              onChange={(e) => update('workLocation', e.target.value)}
            />
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <Label>Hora de inicio</Label>
              <TimeSelect
                value={values.startTime}
                ariaLabel="Hora de inicio"
                onChange={(value) => update('startTime', value)}
              />
            </div>
            <div className={styles.field}>
              <Label>Hora de fin</Label>
              <TimeSelect
                value={values.endTime}
                ariaLabel="Hora de fin"
                onChange={(value) => update('endTime', value)}
              />
              {overnightShift && (
                <p className={styles.hint}>La jornada termina al día siguiente.</p>
              )}
            </div>
          </div>

          <div className={styles.row}>
            <div className={styles.field}>
              <div className={styles.switchRow}>
                <Switch
                  id="hadBreak"
                  checked={values.hadBreak}
                  onCheckedChange={(checked) => {
                    update('hadBreak', checked);
                    if (!checked) update('breakMinutes', 0);
                  }}
                />
                <Label htmlFor="hadBreak">¿Hubo pausa?</Label>
              </div>
              {values.hadBreak && (
                <Input
                  type="number"
                  min={1}
                  aria-label="Tiempo total de pausa en minutos"
                  value={values.breakMinutes || ''}
                  placeholder="Minutos de pausa"
                  onChange={(e) => update('breakMinutes', Number(e.target.value) || 0)}
                />
              )}
            </div>

            <div className={styles.field}>
              <div className={styles.switchRow}>
                <Switch
                  id="hadOvernight"
                  checked={values.hadOvernight}
                  onCheckedChange={(checked) => update('hadOvernight', checked)}
                />
                <Label htmlFor="hadOvernight">¿Ha tenido pernocta?</Label>
              </div>
              {/* Los dos pasos que pidió RRHH. Solo cuando hay pernocta:
                  el lugar sin pernocta es un estado que no debe existir. */}
              {values.hadOvernight && (
                <Select
                  value={values.overnightPlace}
                  onValueChange={(value) =>
                    update('overnightPlace', value as TechnicianLogFormValues['overnightPlace'])
                  }
                >
                  <SelectTrigger aria-label="Lugar de la pernocta">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="espana">España</SelectItem>
                    <SelectItem value="extranjero">Fuera de España</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          </div>

          <div className={styles.field}>
            <Label htmlFor="productCategory">Categoría de producto</Label>
            <Select
              value={values.productCategory}
              onValueChange={(value) =>
                update('productCategory', value as TechnicianLogFormValues['productCategory'])
              }
            >
              <SelectTrigger id="productCategory">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="software">Software</SelectItem>
                <SelectItem value="hardware">Hardware</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Se enseña, pero NO se envía: la calcula el backend. Verla mientras
              se rellena es lo que permite detectar una hora mal tecleada antes
              de guardar. */}
          <p className={styles.total}>
            Total de jornada trabajada: <strong>{formatMinutes(Math.max(effective, 0))}</strong>
          </p>

          {error && <p className={styles.error}>{error}</p>}

          <div className={styles.actions}>
            {editing && onCancelEdit && (
              <Button type="button" variant="outline" onClick={onCancelEdit}>
                Cancelar
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Guardando…' : editing ? 'Guardar cambios' : 'Registrar jornada'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
