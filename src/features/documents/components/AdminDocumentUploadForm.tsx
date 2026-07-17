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
 * deck-fase4 · admin "Subir documento" — sube el binario a Drive y registra
 * los metadatos (`POST /documents`, multipart). El backend es la autoridad
 * final (tipo MIME, tamaño, `user_id` existente); aquí solo se valida lo
 * básico para no dejar que falte un campo obligatorio o llegue un archivo
 * que claramente no es un PDF.
 */
export function AdminDocumentUploadForm({ onSaved, onCancel }: AdminDocumentUploadFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: { userId: '', category: 'general', title: '', period: '' },
  });
  const { mutateAsync: upload, error: uploadError } = useUploadDocument();
  const [userId, category] = watch(['userId', 'category']);

  const onSubmit = async (values: FormValues) => {
    if (!values.userId) {
      setFormError('Selecciona un empleado.');
      return;
    }
    if (!file) {
      setFormError('Selecciona un archivo PDF.');
      return;
    }
    setFormError(null);
    await upload({
      file,
      userId: values.userId,
      category: values.category,
      title: values.title,
      period: values.period || undefined,
    });
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
        <Label htmlFor="documentTitle">Título *</Label>
        <Input
          id="documentTitle"
          placeholder="Ej. Nómina julio 2026"
          {...register('title', { required: true })}
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="documentFile">Archivo (PDF) *</Label>
        <Input
          id="documentFile"
          type="file"
          accept="application/pdf,.pdf"
          onChange={(e) => {
            const selected = e.target.files?.[0] ?? null;
            if (selected && selected.type !== 'application/pdf') {
              setFile(null);
              setFormError('El archivo debe ser un PDF.');
              return;
            }
            setFile(selected);
            setFormError(null);
          }}
        />
      </div>

      {formError && <p className={styles.error}>{formError}</p>}
      {!formError && errors.title && <p className={styles.error}>Indica un título para el documento.</p>}
      {uploadError && (
        <p className={styles.error}>
          {uploadError instanceof Error ? uploadError.message : 'No se pudo subir el documento.'}
        </p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={isSubmitting}>
          Subir documento
        </Button>
      </div>
    </form>
  );
}
