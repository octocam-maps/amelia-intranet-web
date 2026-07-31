import {
  CheckCircledIcon,
  DownloadIcon,
  ExternalLinkIcon,
} from '@radix-ui/react-icons';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import type { AdminOnboardingStep, AdminQuizStepConfig, AdminVideoStepConfig } from '../domain/models';
import styles from './StepPreviewDialog.module.css';

interface StepPreviewDialogProps {
  step: AdminOnboardingStep | null;
  onOpenChange: (open: boolean) => void;
}

/**
 * Previsualización del contenido de un paso del onboarding, para que el admin
 * pueda revisar qué va a ver la plantilla.
 *
 * POR QUÉ NO REUTILIZA LOS COMPONENTES DEL EMPLEADO con una prop `readOnly`: esos
 * componentes montan hooks de mutación (`useAcknowledgeManual`,
 * `useSubmitQuiz`, `useUpdateVideoProgress`, `useCompleteProfile`). Un `readOnly`
 * mal propagado en cualquiera de los cinco dejaría al admin escribiendo en SU
 * propio progreso de onboarding solo por abrir una previsualización, y ese fallo
 * sería silencioso. Aquí no hay ni un hook de mutación: es físicamente incapaz de
 * registrar progreso.
 *
 * Y muestra MÁS de lo que ve el trabajador —las respuestas correctas del
 * cuestionario— que es justo lo que el admin necesita para revisar el contenido.
 */
export function StepPreviewDialog({ step, onOpenChange }: StepPreviewDialogProps) {
  return (
    <Dialog open={step !== null} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content}>
        <DialogHeader>
          <DialogTitle>
            {step ? `Paso ${step.stepOrder} · ${step.title}` : 'Previsualización'}
          </DialogTitle>
        </DialogHeader>

        {step && (
          <div className={styles.body}>
            <p className={styles.note}>
              Vista de revisión del contenido. No registra ningún progreso en tu propio onboarding.
            </p>
            <StepPreviewBody step={step} />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StepPreviewBody({ step }: { step: AdminOnboardingStep }) {
  switch (step.type) {
    case 'video':
      return <VideoPreview config={step.config as AdminVideoStepConfig | null} />;
    case 'quiz':
      return <QuizPreview config={step.config as AdminQuizStepConfig | null} />;
    case 'manual':
    case 'signature':
      return <DocumentsPreview step={step} />;
    case 'profile':
      return <ProfilePreview />;
    default:
      return <p className={styles.empty}>Este paso no tiene contenido previsualizable.</p>;
  }
}

function VideoPreview({ config }: { config: AdminVideoStepConfig | null }) {
  if (!config?.url) {
    return <p className={styles.empty}>Este paso no tiene vídeo configurado todavía.</p>;
  }
  return (
    <div className={styles.section}>
      {/* Con controles, a diferencia del paso real del trabajador, que NO permite
          saltar. El admin está revisando el contenido, no cumpliendo el paso. */}
      <video className={styles.video} src={config.url} controls preload="metadata" />
      <p className={styles.meta}>
        Duración configurada: {config.duration}s · el trabajador no puede adelantarlo.
      </p>
    </div>
  );
}

function QuizPreview({ config }: { config: AdminQuizStepConfig | null }) {
  const questions = config?.questions ?? [];
  if (questions.length === 0) {
    return <p className={styles.empty}>Este cuestionario no tiene preguntas configuradas.</p>;
  }

  return (
    <div className={styles.section}>
      <p className={styles.meta}>
        {questions.length} preguntas · se aprueba con {Math.round((config?.threshold ?? 0) * 100)}%
      </p>
      <ol className={styles.questions}>
        {questions.map((question) => (
          <li key={question.id} className={styles.question}>
            <p className={styles.questionText}>{question.text}</p>
            <ul className={styles.options}>
              {question.options.map((option) => {
                const isCorrect = option === question.correct;
                return (
                  <li
                    key={option}
                    className={isCorrect ? styles.optionCorrect : styles.option}
                  >
                    {isCorrect && <CheckCircledIcon className={styles.optionIcon} />}
                    {option}
                  </li>
                );
              })}
            </ul>
          </li>
        ))}
      </ol>
      <p className={styles.note}>
        La respuesta correcta se marca aquí porque es la vista del administrador. El trabajador
        nunca la recibe: el backend no la manda en <code>GET /onboarding/me</code>.
      </p>
    </div>
  );
}

function DocumentsPreview({ step }: { step: AdminOnboardingStep }) {
  if (step.documents.length === 0) {
    return (
      <p className={styles.empty}>
        {step.type === 'manual'
          ? 'No hay manuales publicados en este paso.'
          : 'No hay plantilla de documentación configurada todavía.'}
      </p>
    );
  }

  return (
    <div className={styles.section}>
      {step.type === 'manual' && step.documents.length > 1 && (
        <p className={styles.meta}>
          Se leen en este orden. El trabajador no puede confirmar uno sin haber confirmado los
          anteriores, y el paso no se completa hasta tenerlos todos.
        </p>
      )}
      <ol className={styles.documents}>
        {step.documents.map((document, index) => (
          <li key={document.id} className={styles.document}>
            <span className={styles.documentOrder}>{index + 1}</span>
            <span className={styles.documentTitle}>{document.title}</span>
            {document.url ? (
              <span className={styles.documentActions}>
                <a
                  className={styles.documentAction}
                  href={document.url}
                  target="_blank"
                  rel="noreferrer"
                >
                  <ExternalLinkIcon /> Abrir
                </a>
                <a className={styles.documentAction} href={document.url} download>
                  <DownloadIcon /> Descargar
                </a>
              </span>
            ) : (
              <span className={styles.documentPending}>Sin fichero publicado</span>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

/** Los 7 campos del paso de perfil. Fijos y conocidos (RF §3.5): el `config` de
 * este paso no los describe, así que derivarlos de él daría una lista vacía. */
const PROFILE_FIELDS = [
  'Nombre completo',
  'DNI / NIF',
  'Fecha de nacimiento',
  'Teléfono',
  'Dirección',
  'Ciudad',
  'Departamento',
  'Móvil de empresa (opcional)',
];

function ProfilePreview() {
  return (
    <div className={styles.section}>
      <p className={styles.meta}>
        El trabajador rellena estos campos. Ninguno puede quedar vacío salvo el último.
      </p>
      <ul className={styles.fields}>
        {PROFILE_FIELDS.map((field) => (
          <li key={field} className={styles.field}>
            {field}
          </li>
        ))}
      </ul>
    </div>
  );
}
