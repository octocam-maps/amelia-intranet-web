import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Textarea } from '@/components/ui/Textarea';
import { useAddTimeClockEntryNote } from '../application/useAddTimeClockEntryNote';
import { useTimeClockEntryNotes } from '../application/useTimeClockEntryNotes';
import type { TimeClockEntry } from '../domain/models';
import styles from './TimeClockEntryNotesDialog.module.css';

interface FormValues {
  body: string;
}

interface TimeClockEntryNotesDialogProps {
  /** `null` = diálogo cerrado — no hay tramo seleccionado todavía. */
  entry: TimeClockEntry | null;
  onOpenChange: (open: boolean) => void;
}

function formatNoteDate(iso: string): string {
  const date = new Date(iso);
  return date.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

/**
 * B-2b: incidencias/comentarios admin sobre un tramo — anotación de RRHH,
 * no una conversación bidireccional (solo el admin publica, vía
 * `POST /time-clock/entries/{id}/notes`, guard `require_role("administrador")`
 * en el backend). Se abre desde la fila del tramo en la vista aumentada del
 * admin ("Ver toda la plantilla").
 */
export function TimeClockEntryNotesDialog({ entry, onOpenChange }: TimeClockEntryNotesDialogProps) {
  const { data: notes, isLoading } = useTimeClockEntryNotes(entry?.id);
  const { mutateAsync, isPending, error } = useAddTimeClockEntryNote();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: { body: '' } });

  if (!entry) {
    return null;
  }

  const onSubmit = async (values: FormValues) => {
    await mutateAsync({ entryId: entry.id, input: { body: values.body } });
    reset({ body: '' });
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>Incidencias del tramo{entry.fullName ? ` de ${entry.fullName}` : ''}</DialogTitle>
          <p className={styles.description}>{entry.workDate}</p>
        </DialogHeader>

        {isLoading ? (
          <p className={styles.loading}>Cargando…</p>
        ) : notes && notes.length > 0 ? (
          <ul className={styles.noteList}>
            {notes.map((note) => (
              <li key={note.id} className={styles.note}>
                <div className={styles.noteMeta}>
                  <span className={styles.noteAuthor}>{note.authorFullName ?? 'Persona eliminada'}</span>
                  <span className={styles.noteDate}>{formatNoteDate(note.createdAt)}</span>
                </div>
                <p className={styles.noteBody}>{note.body}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.empty}>Todavía no hay incidencias registradas en este tramo.</p>
        )}

        <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
          <Textarea
            placeholder="Añade una incidencia o comentario sobre este tramo…"
            {...register('body', { required: true, validate: (v) => v.trim().length > 0 })}
          />
          {errors.body && <p className={styles.error}>Escribe la incidencia antes de guardarla.</p>}
          {error && (
            <p className={styles.error}>
              {error instanceof Error ? error.message : 'No se pudo guardar la incidencia.'}
            </p>
          )}
          <Button type="submit" variant="dark" disabled={isPending} className={styles.submit}>
            Añadir incidencia
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
