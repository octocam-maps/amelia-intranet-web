import { useState } from 'react';
import { CheckCircledIcon, FileTextIcon } from '@radix-ui/react-icons';
import { ShieldCheckIcon } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import { useSignDocument } from '../application/useSignDocument';
import type { OnboardingStep, SignDocumentResult } from '../domain/models';
import styles from './SignatureStep.module.css';

interface SignatureStepProps {
  step: OnboardingStep;
}

/** Fallback si el paso ya estaba `completed` al cargar la página (la
 * mutation nunca corrió en esta sesión) — lee los mismos campos crudos que
 * devuelve `POST .../sign`, asumiendo que `data` los conserva con ese shape. */
function signResultFromStepData(step: OnboardingStep): SignDocumentResult | null {
  const data = step.data;
  if (!data || typeof data.document_id !== 'string' || typeof data.signed_at !== 'string') return null;
  return {
    id: typeof data.id === 'string' ? data.id : step.id,
    stepId: step.id,
    documentId: data.document_id,
    documentVersion: typeof data.document_version === 'number' ? data.document_version : 1,
    signedAt: data.signed_at,
  };
}

/**
 * `POST .../sign` no recibe cuerpo — el backend toma IP/user-agent/hash del
 * propio request, no de nada que dibuje el usuario aquí. Por eso este
 * borrador no incluye un canvas de firma manuscrita (sería puramente
 * decorativo y podría confundir: nada de lo que se "dibuje" viajaría al
 * backend). El documento es un placeholder de texto — el visor PDF real es
 * trabajo de Fase 4 (Documentos + Drive).
 */
export function SignatureStep({ step }: SignatureStepProps) {
  const { mutate, isPending, error, data: signResult } = useSignDocument();
  const [confirmed, setConfirmed] = useState(false);

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const signedResult = signResult ?? signResultFromStepData(step);

  const onSign = () => {
    mutate(step.id);
  };

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>Completa el paso anterior para desbloquear la firma.</p>
      </div>
    );
  }

  if (isCompleted || signedResult) {
    return (
      <div className={styles.root}>
        <div className={styles.signedCard}>
          <CheckCircledIcon className={styles.signedIcon} />
          <h2 className={styles.signedTitle}>Documento firmado</h2>
          <p className={styles.signedSubtitle}>
            Tu firma ha quedado registrada de forma trazable: fecha, hora, dirección IP y huella del
            documento.
          </p>
          {signedResult && (
            <dl className={styles.signedMeta}>
              <div className={styles.signedMetaRow}>
                <dt>Firmado</dt>
                <dd>{new Date(signedResult.signedAt).toLocaleString('es-ES')}</dd>
              </div>
              <div className={styles.signedMetaRow}>
                <dt>Documento</dt>
                <dd>{signedResult.documentId} · v{signedResult.documentVersion}</dd>
              </div>
            </dl>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>Revisa el documento y fírmalo para continuar con tu incorporación.</p>

      <div className={styles.documentPreview}>
        <div className={styles.documentHeader}>
          <FileTextIcon className={styles.documentIcon} />
          <span>Acuerdo de confidencialidad.pdf</span>
        </div>
        <div className={styles.documentPlaceholder}>
          <p className={styles.placeholderLine} style={{ width: '92%' }} />
          <p className={styles.placeholderLine} style={{ width: '78%' }} />
          <p className={styles.placeholderLine} style={{ width: '85%' }} />
          <br />
          <p className={styles.placeholderLine} style={{ width: '96%' }} />
          <p className={styles.placeholderLine} style={{ width: '64%' }} />
        </div>
      </div>

      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <ShieldCheckIcon className={styles.registerIcon} />
          Datos que se registrarán al firmar
        </div>
        <p className={styles.registerText}>
          Fecha, hora, dirección IP y hash SHA-256 del documento — esta información queda asociada a
          tu firma de forma permanente y no se puede eliminar.
        </p>
      </div>

      <label className={styles.consent}>
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(event) => setConfirmed(event.target.checked)}
          className={styles.consentCheckbox}
        />
        He leído el documento y firmo de forma electrónica. Entiendo que esta firma tiene validez
        legal y queda registrada de forma trazable.
      </label>

      {error && (
        <p className={styles.error}>
          {error instanceof Error ? error.message : 'No se pudo firmar el documento.'}
        </p>
      )}

      <div className={styles.footer}>
        <Button variant="dark" disabled={!confirmed || isPending} onClick={onSign}>
          {isPending ? 'Firmando…' : 'Firmar documento'}
        </Button>
      </div>
    </div>
  );
}
