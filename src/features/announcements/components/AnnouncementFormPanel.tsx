import { useEffect } from 'react';
import { Bold, Italic, LinkIcon, List, Send } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateAnnouncement } from '../application/useCreateAnnouncement';
import { useUpdateAnnouncement } from '../application/useUpdateAnnouncement';
import type { Announcement, AnnouncementStatus } from '../domain/models';
import styles from './AnnouncementFormPanel.module.css';

interface FormValues {
  title: string;
  body: string;
  pinned: boolean;
}

interface AnnouncementFormPanelProps {
  /** Ausente = alta de un anuncio nuevo. */
  announcement?: Announcement;
  onSaved: () => void;
}

/**
 * deck-fase6/11-anuncios.png — panel persistente a la derecha del listado,
 * se reutiliza para alta y edición. La barra de formato (B/I/lista/enlace) es
 * decorativa: montar un editor de texto rico es fuera de alcance de esta
 * ronda, el mensaje se guarda como texto plano. El selector "Publicar" solo
 * ofrece "Ahora" — la programación de fecha queda para una fase posterior.
 */
export function AnnouncementFormPanel({ announcement, onSaved }: AnnouncementFormPanelProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      pinned: announcement?.pinned ?? false,
    },
  });
  const { mutateAsync: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutateAsync: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement();
  const pinned = watch('pinned');
  const isSaving = isCreating || isUpdating;

  // Cambiar de anuncio seleccionado (o pasar a "nuevo") resetea el formulario.
  useEffect(() => {
    reset({
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      pinned: announcement?.pinned ?? false,
    });
  }, [announcement, reset]);

  const save = async (values: FormValues, status: AnnouncementStatus) => {
    const input = { title: values.title, body: values.body, pinned: values.pinned, audience: 'all' as const, status };
    if (announcement) {
      await updateAnnouncement({ id: announcement.id, input });
    } else {
      await createAnnouncement(input);
      // Alta: `announcement` sigue siendo `undefined` antes y después de
      // guardar, así que el `useEffect` de arriba no vuelve a dispararse
      // (la dependencia no cambia de referencia) y el formulario quedaría
      // con el título/mensaje del anuncio recién publicado. Se limpia a mano.
      reset({ title: '', body: '', pinned: false });
    }
    onSaved();
  };

  return (
    <div className={styles.panel}>
      <h2 className={styles.title}>{announcement ? 'Editar anuncio' : 'Nuevo anuncio'}</h2>

      <div className={styles.field}>
        <Label htmlFor="announcementTitle">Título *</Label>
        <Input id="announcementTitle" placeholder="Ej. Cierre por festivo local" {...register('title', { required: true })} />
      </div>

      <div className={styles.field}>
        <Label htmlFor="announcementBody">Mensaje *</Label>
        <div className={styles.toolbar}>
          <button type="button" className={styles.toolbarButton} disabled title="Formato próximamente">
            <Bold />
          </button>
          <button type="button" className={styles.toolbarButton} disabled title="Formato próximamente">
            <Italic />
          </button>
          <button type="button" className={styles.toolbarButton} disabled title="Formato próximamente">
            <List />
          </button>
          <button type="button" className={styles.toolbarButton} disabled title="Formato próximamente">
            <LinkIcon />
          </button>
        </div>
        <Textarea
          id="announcementBody"
          className={styles.body}
          rows={6}
          placeholder="Escribe el comunicado…"
          {...register('body', { required: true })}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label>Destinatarios</Label>
          <Select value="all" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toda la plantilla</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className={styles.field}>
          <Label>Publicar</Label>
          <Select value="now" disabled>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="now">Ahora</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <label className={styles.checkboxRow}>
        <input
          type="checkbox"
          className={styles.checkbox}
          checked={pinned}
          onChange={(e) => setValue('pinned', e.target.checked)}
        />
        Fijar en la parte superior del dashboard
      </label>

      <div className={styles.footer}>
        <Button type="button" variant="outline" disabled={isSaving} onClick={handleSubmit((v) => save(v, 'draft'))}>
          Guardar borrador
        </Button>
        <Button type="button" variant="dark" disabled={isSaving} onClick={handleSubmit((v) => save(v, 'published'))}>
          <Send />
          Publicar
        </Button>
      </div>
    </div>
  );
}
