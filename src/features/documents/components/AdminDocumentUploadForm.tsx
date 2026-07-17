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

const MONTHS: { value: string; label: string }[] = [
  { value: '01', label: 'Enero' },
  { value: '02', label: 'Febrero' },
  { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Mayo' },
  { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' },
  { value: '11', label: 'Noviembre' },
  { value: '12', label: 'Diciembre' },
];

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
function detectFromFilename(name: string): { category: DocumentCategory; periodYear: string; periodMonth: string } {
  const base = name.replace(/\.pdf$/i, '');
  const nomina = base.match(/^NOMINA[_\-\s]?(\d{4})-(\d{2})/i);
  if (nomina && nomina[1] && nomina[2]) {
    return { category: 'payslip', periodYear: nomina[1], periodMonth: nomina[2] };
  }
  if (/^CONTRATO/i.test(base)) {
    return { category: 'contract', periodYear: '', periodMonth: '' };
  }
  return { category: 'general', periodYear: '', periodMonth: '' };
}

interface UploadItem {
  file: File;
  category: DocumentCategory;
  periodYear: string;
  periodMonth: string;
  title: string;
}

interface AdminDocumentUploadFormProps {
  onSaved: () => void;
  onCancel: () => void;
}

/**
 * deck-fase4 · admin "Subir documento" — sube uno o VARIOS PDF al MISMO
 * empleado, y CADA archivo lleva su propio tipo/período/título (un lote puede
 * mezclar nómina + contrato + otros). El período (Mes + Año) solo aplica a
 * nóminas. `POST /documents` es un archivo por request, así que el form hace N
 * llamadas. La carga masiva entre empleados distintos se resuelve por el sync
 * desde Drive. El backend es la autoridad final (MIME, tamaño, `user_id`).
 */
export function AdminDocumentUploadForm({ onSaved, onCancel }: AdminDocumentUploadFormProps) {
  const [userId, setUserId] = useState('');
  const [items, setItems] = useState<UploadItem[]>([]);
  const [formError, setFormError] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  const [busy, setBusy] = useState(false);

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 8 }, (_, i) => String(current + 1 - i));
  }, []);

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
        const detected = detectFromFilename(file.name);
        return {
          file,
          category: detected.category,
          periodYear: detected.periodYear,
          periodMonth: detected.periodMonth,
          title: titleFromFilename(file.name),
        };
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
      const period = item.periodYear && item.periodMonth ? `${item.periodYear}-${item.periodMonth}` : undefined;
      try {
        await upload({
          file: item.file,
          userId,
          category: item.category,
          title: item.title.trim() || titleFromFilename(item.file.name),
          period,
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
                <div className={styles.control}>
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
                </div>

                {item.category === 'payslip' && (
                  <>
                    <div className={styles.control}>
                      <Select
                        value={item.periodMonth}
                        onValueChange={(value) => updateItem(i, { periodMonth: value })}
                      >
                        <SelectTrigger aria-label={`Mes de ${item.file.name}`}>
                          <SelectValue placeholder="Mes" />
                        </SelectTrigger>
                        <SelectContent>
                          {MONTHS.map((month) => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className={styles.control}>
                      <Select
                        value={item.periodYear}
                        onValueChange={(value) => updateItem(i, { periodYear: value })}
                      >
                        <SelectTrigger aria-label={`Año de ${item.file.name}`}>
                          <SelectValue placeholder="Año" />
                        </SelectTrigger>
                        <SelectContent>
                          {years.map((year) => (
                            <SelectItem key={year} value={year}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}

                <div className={styles.controlTitle}>
                  <Input
                    aria-label={`Título de ${item.file.name}`}
                    placeholder="Título"
                    value={item.title}
                    onChange={(e) => updateItem(i, { title: e.target.value })}
                  />
                </div>
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
