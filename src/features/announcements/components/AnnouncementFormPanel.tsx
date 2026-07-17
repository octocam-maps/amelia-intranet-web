import { useEffect, useRef } from 'react';
import { FontBoldIcon, FontItalicIcon, Link2Icon, PaperPlaneIcon } from '@radix-ui/react-icons';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useCreateAnnouncement } from '../application/useCreateAnnouncement';
import { useUpdateAnnouncement } from '../application/useUpdateAnnouncement';
import type { Announcement, AnnouncementEntity, AnnouncementStatus } from '../domain/models';
import styles from './AnnouncementFormPanel.module.css';

/** Valor plano del selector de destinatarios: 'all' o una entidad concreta.
 * Se traduce a `{audience, entity}` recién al guardar (ver `save`). */
type AudienceTarget = 'all' | AnnouncementEntity;

const AUDIENCE_OPTIONS: { value: AudienceTarget; label: string }[] = [
  { value: 'all', label: 'Toda la plantilla' },
  { value: 'hub', label: 'Amelia Hub' },
  { value: 'lab', label: 'Amelia Lab' },
  { value: 'ops', label: 'Amelia Ops' },
];

function targetFromAnnouncement(announcement: Announcement | undefined): AudienceTarget {
  if (announcement?.audience === 'entity' && announcement.entityCode) {
    return announcement.entityCode;
  }
  return 'all';
}

interface FormValues {
  title: string;
  body: string;
  target: AudienceTarget;
  pinned: boolean;
}

interface AnnouncementFormPanelProps {
  /** Ausente = alta de un anuncio nuevo. */
  announcement?: Announcement;
  onSaved: () => void;
}

/**
 * deck-fase6/11-anuncios.png — panel persistente a la derecha del listado,
 * se reutiliza para alta y edición. El mensaje se guarda como Markdown
 * ligero (negrita/cursiva/enlaces, ver `AnnouncementBody`); la barra de
 * formato solo envuelve la selección del textarea con la sintaxis
 * correspondiente, no es un editor de texto rico. No hay selector de
 * "Publicar" con fecha: el backend no soporta programación, los botones
 * "Guardar borrador"/"Publicar" del pie ya cubren ese estado.
 */
export function AnnouncementFormPanel({ announcement, onSaved }: AnnouncementFormPanelProps) {
  const { register, handleSubmit, reset, watch, setValue } = useForm<FormValues>({
    defaultValues: {
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      target: targetFromAnnouncement(announcement),
      pinned: announcement?.pinned ?? false,
    },
  });
  const { mutateAsync: createAnnouncement, isPending: isCreating } = useCreateAnnouncement();
  const { mutateAsync: updateAnnouncement, isPending: isUpdating } = useUpdateAnnouncement();
  const bodyField = register('body', { required: true });
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);
  const pinned = watch('pinned');
  const target = watch('target');
  const isSaving = isCreating || isUpdating;

  const applyFormatting = (kind: 'bold' | 'italic' | 'link') => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const current = watch('body') ?? '';
    const start = textarea.selectionStart ?? current.length;
    const end = textarea.selectionEnd ?? current.length;
    const selected = current.slice(start, end);

    let prefix = '**';
    let suffix = '**';
    let placeholder = 'texto en negrita';
    if (kind === 'italic') {
      prefix = '_';
      suffix = '_';
      placeholder = 'texto en cursiva';
    } else if (kind === 'link') {
      const url = window.prompt('URL del enlace (https://…)');
      if (!url) return;
      prefix = '[';
      suffix = `](${url})`;
      placeholder = 'texto del enlace';
    }

    const text = selected || placeholder;
    const next = `${current.slice(0, start)}${prefix}${text}${suffix}${current.slice(end)}`;
    setValue('body', next, { shouldDirty: true });

    const selectionStart = start + prefix.length;
    const selectionEnd = selectionStart + text.length;
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(selectionStart, selectionEnd);
    });
  };

  // Cambiar de anuncio seleccionado (o pasar a "nuevo") resetea el formulario.
  useEffect(() => {
    reset({
      title: announcement?.title ?? '',
      body: announcement?.body ?? '',
      target: targetFromAnnouncement(announcement),
      pinned: announcement?.pinned ?? false,
    });
  }, [announcement, reset]);

  const save = async (values: FormValues, status: AnnouncementStatus) => {
    const input = {
      title: values.title,
      body: values.body,
      pinned: values.pinned,
      status,
      ...(values.target === 'all'
        ? { audience: 'all' as const, entity: null }
        : { audience: 'entity' as const, entity: values.target }),
    };
    if (announcement) {
      await updateAnnouncement({ id: announcement.id, input });
    } else {
      await createAnnouncement(input);
      // Alta: `announcement` sigue siendo `undefined` antes y después de
      // guardar, así que el `useEffect` de arriba no vuelve a dispararse
      // (la dependencia no cambia de referencia) y el formulario quedaría
      // con el título/mensaje del anuncio recién publicado. Se limpia a mano.
      reset({ title: '', body: '', target: 'all', pinned: false });
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
          <button
            type="button"
            className={styles.toolbarButton}
            title="Negrita"
            aria-label="Negrita"
            onClick={() => applyFormatting('bold')}
          >
            <FontBoldIcon />
          </button>
          <button
            type="button"
            className={styles.toolbarButton}
            title="Cursiva"
            aria-label="Cursiva"
            onClick={() => applyFormatting('italic')}
          >
            <FontItalicIcon />
          </button>
          <button
            type="button"
            className={styles.toolbarButton}
            title="Enlace"
            aria-label="Enlace"
            onClick={() => applyFormatting('link')}
          >
            <Link2Icon />
          </button>
        </div>
        <Textarea
          id="announcementBody"
          className={styles.body}
          rows={6}
          placeholder="Escribe el comunicado…"
          {...bodyField}
          ref={(el) => {
            bodyField.ref(el);
            bodyRef.current = el;
          }}
        />
        <p className={styles.hint}>Admite formato básico (Markdown): negrita, cursiva y enlaces.</p>
      </div>

      <div className={styles.field}>
        <Label>Destinatarios</Label>
        <Select value={target} onValueChange={(value) => setValue('target', value as AudienceTarget, { shouldDirty: true })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {AUDIENCE_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
          <PaperPlaneIcon />
          Publicar
        </Button>
      </div>
    </div>
  );
}
