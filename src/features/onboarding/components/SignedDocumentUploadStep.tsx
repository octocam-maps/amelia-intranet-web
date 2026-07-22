import { useState } from 'react';
import { CheckCircledIcon, FileTextIcon } from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useUploadSignedDocument } from '../application/useUploadSignedDocument';
import type { OnboardingStep, UploadSignedDocumentResult } from '../domain/models';
import styles from './SignedDocumentUploadStep.module.css';

interface SignedDocumentUploadStepProps {
  step: OnboardingStep;
}

// `DOCUMENTS_MAX_UPLOAD_MB` (backend, `src/shared/config.py`) no se expone
// hoy vía un endpoint de configuración pública — se hardcodea aquí el mismo
// valor por defecto. Si se cambia en el backend, hay que actualizar esta
// constante a mano (sin endpoint de config pública, no se justifica crear
// uno solo para este valor).
const MAX_UPLOAD_MB = 10;
const MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024;

/** Fallback si el paso ya estaba `completed` al cargar la página (la
 * mutation nunca corrió en esta sesión) — `mark_step_completed_if_operable`
 * solo persiste `employee_document_id` en `data` (ver diseño D2), así que
 * `uploadedAt` se reconstruye desde `step.completedAt`, no desde `data`. */
function uploadResultFromStepData(step: OnboardingStep): UploadSignedDocumentResult | null {
  const data = step.data;
  if (!data || typeof data.employee_document_id !== 'string') return null;
  return {
    id: typeof data.id === 'string' ? data.id : step.id,
    stepId: step.id,
    employeeDocumentId: data.employee_document_id,
    uploadedAt: step.completedAt ?? '',
  };
}

/**
 * Reemplaza a `SignatureStep`: la firma ya no ocurre dentro de la
 * plataforma (sin proveedor certificado, el hash/IP propios no constituían
 * prueba legal) — el trabajador firma fuera y sube aquí el PDF resultante.
 * `POST .../documents` solo recibe el archivo; el `user_id` lo deriva el
 * backend del JWT.
 */
export function SignedDocumentUploadStep({ step }: SignedDocumentUploadStepProps) {
  const { mutate, isPending, error, data: uploadResult } = useUploadSignedDocument();
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const result = uploadResult ?? uploadResultFromStepData(step);

  const onFileSelected = (fileList: FileList | null) => {
    const selected = fileList?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setClientError(null);
      return;
    }
    if (selected.type !== 'application/pdf') {
      setFile(null);
      setClientError('El archivo debe ser un PDF.');
      return;
    }
    if (selected.size > MAX_UPLOAD_BYTES) {
      setFile(null);
      setClientError(`El archivo supera el límite de ${MAX_UPLOAD_MB} MB.`);
      return;
    }
    setFile(selected);
    setClientError(null);
  };

  const onSubmit = () => {
    if (!file) return;
    mutate({ stepId: step.id, file });
  };

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear la firma.</p>
      </div>
    );
  }

  if (isCompleted || result) {
    return (
      <div className={styles.root}>
        <div className={styles.signedCard}>
          <CheckCircledIcon className={styles.signedIcon} />
          <h2 className={styles.signedTitle}>Documento subido</h2>
          <p className={styles.signedSubtitle}>
            Ya tenemos tu documento firmado. Puedes consultarlo cuando quieras en Documentos.
          </p>
          {result && (
            <Link to="/documentos" className={styles.signedLink}>
              Ver en Documentos
            </Link>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        Descarga el documento, fírmalo fuera de la plataforma y sube aquí el PDF firmado para continuar
        con tu incorporación.
      </p>

      <label className={styles.fileField}>
        <FileTextIcon className={styles.fileFieldIcon} />
        <span className={styles.fileFieldText}>{file ? file.name : 'Selecciona tu PDF firmado'}</span>
        <input
          type="file"
          accept="application/pdf,.pdf"
          aria-label="Selecciona tu PDF firmado"
          onChange={(event) => onFileSelected(event.target.files)}
          className={styles.fileInput}
        />
      </label>

      <p className={styles.hint}>Solo PDF, máximo {MAX_UPLOAD_MB} MB.</p>

      {(clientError || error) && (
        <p className={styles.error}>
          {clientError ?? (error instanceof Error ? error.message : 'No se pudo subir el documento.')}
        </p>
      )}

      <div className={styles.footer}>
        <Button variant="dark" disabled={!file || isPending} onClick={onSubmit}>
          {isPending ? 'Subiendo…' : 'Subir documento'}
        </Button>
      </div>
    </div>
  );
}
