import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { useStaffList } from '@/features/staff/application/useStaffList';
import { useUploadDocument } from '../application/useUploadDocument';
import type { DocumentCategory } from '../domain/models';
import styles from './AdminDocumentUploadForm.module.css';

const CATEGORY_LABEL: Record<DocumentCategory, string> = {
  payslip: 'Nómina',
  contract: 'Contrato',
  general: 'General',
  other: 'Otros',
};
const CATEGORIES = Object.keys(CATEGORY_LABEL) as DocumentCategory[];

// Techo "generoso" de plantilla para el selector — mismo criterio que
// `StaffPage` (el backend todavía no pagina de verdad `GET /staff`).
const STAFF_PICKER_CAP = 200;

/** Nombre del archivo sin la extensión .pdf, como título por defecto. */
function titleFromFilename(name: string): string {
  return name.replace(/\.pdf$/i, '').trim() || name;
}

interface FormValues {
  userId: string;
  category: DocumentCategory;
  title: string;
  period: string;
}

interface AdminDocumentUploadFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * deck-fase4 · admin "Subir documento" — sube uno o VARIOS PDF al MISMO
 * empleado (misma categoría/período) y registra los metadatos
 * (`POST /documents`, multipart, un archivo por request; el form hace N
 * llamadas). La carga masiva entre empleados distintos se resuelve por el
 * sync desde Drive, no aquí. El backend es la autoridad final (MIME, tamaño,
 * `user_id` existente); aquí solo se valida lo básico.
 */
export function AdminDocumentUploadForm({ onSaved, onCancel }: AdminDocumentUploadFormProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const { data: staff, isLoading: isLoadingStaff } = useStaffList({ pageSize: STAFF_PICKER_CAP });
  const members = useMemo(
    () => [...(staff?.members ?? [])].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    [staff]
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { userId: '', category: 'general', title: '', period: '' },
  });
  const { mutateAsync: upload } = useUploadDocument();
  const [userId, category] = watch(['userId', 'category']);
  const multiple = files.length > 1;

  const onSubmit = async (values: FormValues) => {
    if (!values.userId) {
      setFormError('Selecciona un empleado.');
      return;
    }
    if (files.length === 0) {
      setFormError('Selecciona al menos un archivo PDF.');
      return;
    }
    setFormError(null);
    setProgress({ done: 0, total: files.length });

    // Secuencial a propósito: evita ráfagas contra la API de Drive y permite
    // reportar exactamente cuáles fallaron sin abortar los demás.
    const failures: string[] = [];
    for (const [i, file] of files.entries()) {
      const title = !multiple && values.title.trim() ? values.title.trim() : titleFromFilename(file.name);
      try {
        await upload({
          file,
          userId: values.userId,
          category: values.category,
          title,
          period: values.period || undefined,
        });
      } catch {
        failures.push(file.name);
      }
      setProgress({ done: i + 1, total: files.length });
    }
    setProgress(null);

    if (failures.length > 0) {
      setFormError(
        failures.length === files.length
          ? 'No se pudo subir ningún archivo. Revisa que sean PDF y no superen el límite.'
          : `Subidos ${files.length - failures.length} de ${files.length}. Fallaron: ${failures.join(', ')}.`
      );
      return;
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
      <div className={styles.field}>
        <Label htmlFor="documentUserId">Empleado *</Label>
        <Select
          value={userId}
          disabled={isLoadingStaff}
          onValueChange={(value) => setValue('userId', value, { shouldValidate: true })}
        >
          <SelectTrigger id="documentUserId">
            <SelectValue placeholder={isLoadingStaff ? 'Cargando plantilla…' : 'Selecciona una persona'} />
          </SelectTrigger>
          <SelectContent>
            {members.map((member) => (
              <SelectItem key={member.id} value={member.id}>
                {member.fullName} · {member.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="documentCategory">Categoría *</Label>
          <Select
            value={category}
            onValueChange={(value) => setValue('category', value as DocumentCategory, { shouldValidate: true })}
          >
            <SelectTrigger id="documentCategory">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((code) => (
                <SelectItem key={code} value={code}>
                  {CATEGORY_LABEL[code]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className={styles.field}>
          <Label htmlFor="documentPeriod">Período</Label>
          {/* 'YYYY-MM' — solo lo usa realmente la categoría "Nómina"; se deja
              opcional en el resto por si sirve de fecha de referencia. */}
          <Input id="documentPeriod" type="month" {...register('period')} />
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="documentTitle">Título{multiple ? '' : ' *'}</Label>
        <Input
          id="documentTitle"
          placeholder="Ej. Nómina julio 2026"
          disabled={multiple}
          {...register('title')}
        />
        <p className={styles.hint}>
          {multiple
            ? 'Con varios archivos se usa el nombre de cada archivo como título.'
            : 'Opcional: si lo dejas vacío se usa el nombre del archivo.'}
        </p>
      </div>

      <div className={styles.field}>
        <Label htmlFor="documentFile">Archivos (PDF) *</Label>
        <Input
          id="documentFile"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.files ?? []);
            const nonPdf = selected.find((f) => f.type !== 'application/pdf');
            if (nonPdf) {
              setFiles([]);
              setFormError('Todos los archivos deben ser PDF.');
              return;
            }
            setFiles(selected);
            setFormError(null);
          }}
        />
        {files.length > 0 && (
          <p className={styles.hint}>
            {files.length === 1 ? '1 archivo seleccionado' : `${files.length} archivos seleccionados`}
          </p>
        )}
      </div>

      {formError && <p className={styles.error}>{formError}</p>}
      {progress && (
        <p className={styles.hint}>
          Subiendo {progress.done} de {progress.total}…
        </p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          {isSubmitting
            ? 'Subiendo…'
            : files.length > 1
              ? `Subir ${files.length} documentos`
              : 'Subir documento'}
        </Button>
      </div>
    </form>
  );
}
