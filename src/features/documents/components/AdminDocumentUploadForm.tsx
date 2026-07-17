import { useMemo, useState } from 'react';
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

/**
 * Preselección de tipo/período por el nombre del archivo — MISMA convención
 * que el sync desde Drive (`NOMINA_YYYY-MM*`, `CONTRATO*`), para que un lote
 * llegue ya casi categorizado. Es solo un default: el admin lo ajusta por fila.
 */
function detectCategory(name: string): { category: DocumentCategory; period: string } {
  const base = name.replace(/\.pdf$/i, '');
  const nomina = base.match(/^NOMINA[_\-\s]?(\d{4})-(\d{2})/i);
  if (nomina && nomina[1] && nomina[2]) {
    return { category: 'payslip', period: `${nomina[1]}-${nomina[2]}` };
  }
  if (/^CONTRATO/i.test(base)) {
    return { category: 'contract', period: '' };
  }
  return { category: 'general', period: '' };
}

interface UploadItem {
  file: File;
  category: DocumentCategory;
  period: string;
  title: string;
}

interface AdminDocumentUploadFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * deck-fase4 · admin "Subir documento" — sube uno o VARIOS PDF al MISMO
 * empleado, y CADA archivo lleva su propio tipo/período/título (un lote puede
 * mezclar nómina + contrato + otros). `POST /documents` es un archivo por
 * request, así que el form hace N llamadas. La carga masiva entre empleados
 * distintos se resuelve por el sync desde Drive, no aquí. El backend es la
 * autoridad final (MIME, tamaño, `user_id` existente).
 */
export function AdminDocumentUploadForm({ onSaved, onCancel }: AdminDocumentUploadFormProps) {
  const [userId, setUserId] = useState('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: staff, isLoading: isLoadingStaff } = useStaffList({ pageSize: STAFF_PICKER_CAP });
  const members = useMemo(
    () => [...(staff?.members ?? [])].sort((a, b) => a.fullName.localeCompare(b.fullName, 'es')),
    [staff]
  );
  const { mutateAsync: upload } = useUploadDocument();

  const onFilesSelected = (fileList: FileList | null) => {
    const selected = Array.from(fileList ?? []);
    if (selected.some((f) => f.type !== 'application/pdf')) {
      setItems([]);
      setFormError('Todos los archivos deben ser PDF.');
      return;
    }
    setItems(
      selected.map((file) => {
        const detected = detectCategory(file.name);
        return { file, category: detected.category, period: detected.period, title: titleFromFilename(file.name) };
      })
    );
    setFormError(null);
  };

  const updateItem = (index: number, patch: Partial<UploadItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      setFormError('Selecciona un empleado.');
      return;
    }
    if (items.length === 0) {
      setFormError('Selecciona al menos un archivo PDF.');
      return;
    }
    setFormError(null);
    setBusy(true);
    setProgress({ done: 0, total: items.length });

    // Secuencial a propósito: evita ráfagas contra la API de Drive y permite
    // reportar exactamente cuáles fallaron sin abortar los demás.
    const failures: string[] = [];
    for (const [i, item] of items.entries()) {
      try {
        await upload({
          file: item.file,
          userId,
          category: item.category,
          title: item.title.trim() || titleFromFilename(item.file.name),
          period: item.period || undefined,
        });
      } catch {
        failures.push(item.file.name);
      }
      setProgress({ done: i + 1, total: items.length });
    }
    setProgress(null);
    setBusy(false);

    if (failures.length > 0) {
      setFormError(
        failures.length === items.length
          ? 'No se pudo subir ningún archivo. Revisa que sean PDF y no superen el límite.'
          : `Subidos ${items.length - failures.length} de ${items.length}. Fallaron: ${failures.join(', ')}.`
      );
      return;
    }
    onSaved();
  };

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <Label htmlFor="documentUserId">Empleado *</Label>
        <Select value={userId} disabled={isLoadingStaff} onValueChange={setUserId}>
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

      <div className={styles.field}>
        <Label htmlFor="documentFile">Archivos (PDF) *</Label>
        <Input
          id="documentFile"
          type="file"
          accept="application/pdf,.pdf"
          multiple
          onChange={(e) => onFilesSelected(e.target.files)}
        />
        <p className={styles.hint}>
          Puedes subir varios; cada archivo lleva su propio tipo, período y título (se preseleccionan por el nombre).
        </p>
      </div>

      {items.length > 0 && (
        <div className={styles.fileList}>
          {items.map((item, i) => (
            <div className={styles.fileRow} key={`${item.file.name}-${i}`}>
              <p className={styles.fileName} title={item.file.name}>
                {item.file.name}
              </p>
              <div className={styles.fileControls}>
                <Select
                  value={item.category}
                  onValueChange={(value) => updateItem(i, { category: value as DocumentCategory })}
                >
                  <SelectTrigger aria-label={`Categoría de ${item.file.name}`}>
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
                <Input
                  type="month"
                  aria-label={`Período de ${item.file.name}`}
                  value={item.period}
                  onChange={(e) => updateItem(i, { period: e.target.value })}
                />
                <Input
                  aria-label={`Título de ${item.file.name}`}
                  placeholder="Título"
                  value={item.title}
                  onChange={(e) => updateItem(i, { title: e.target.value })}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {formError && <p className={styles.error}>{formError}</p>}
      {progress && (
        <p className={styles.hint}>
          Subiendo {progress.done} de {progress.total}…
        </p>
      )}

      <div className={styles.footer}>
        <Button type="button" variant="outline" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button type="submit" variant="dark" disabled={busy}>
          {busy ? 'Subiendo…' : items.length > 1 ? `Subir ${items.length} documentos` : 'Subir documento'}
        </Button>
      </div>
    </form>
  );
}
