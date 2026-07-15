import { useState } from 'react';
import { FormProvider, useForm } from 'react-hook-form';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Switch } from '@/components/ui/Switch';
import { useUpdateOnboardingStep } from '../application/useUpdateOnboardingStep';
import type {
  AdminOnboardingStep,
  AdminQuizStepConfig,
  AdminVideoStepConfig,
  UpdateOnboardingStepInput,
} from '../domain/models';
import { QuizQuestionsEditor } from './QuizQuestionsEditor';
import type { QuestionFormValue, StepFormValues } from './step-form.types';
import styles from './OnboardingStepForm.module.css';

function isVideoConfig(config: unknown): config is AdminVideoStepConfig {
  return typeof config === 'object' && config !== null && 'url' in config && 'duration' in config;
}

function isQuizConfig(config: unknown): config is AdminQuizStepConfig {
  return typeof config === 'object' && config !== null && 'questions' in config && 'threshold' in config;
}

function defaultQuestions(config: unknown): QuestionFormValue[] {
  if (!isQuizConfig(config) || config.questions.length === 0) {
    return [
      {
        id: crypto.randomUUID(),
        text: '',
        options: [{ value: '' }, { value: '' }],
        correctIndex: -1,
      },
    ];
  }
  return config.questions.map((question) => ({
    id: question.id,
    text: question.text,
    options: question.options.map((value) => ({ value })),
    correctIndex: question.options.findIndex((value) => value === question.correct),
  }));
}

function buildDefaultValues(step: AdminOnboardingStep): StepFormValues {
  const video = isVideoConfig(step.config) ? step.config : null;
  const quiz = isQuizConfig(step.config) ? step.config : null;
  return {
    title: step.title,
    isActive: step.isActive,
    videoUrl: video?.url ?? '',
    videoDuration: video ? String(video.duration) : '',
    thresholdPct: quiz ? String(Math.round(quiz.threshold * 100)) : '70',
    questions: defaultQuestions(step.config),
  };
}

/** Valida en el cliente lo que el backend también valida server-side
 * (contrato del prompt: "quiz necesita questions con `correct` ∈ options +
 * threshold 0..1; video url+duration"). No sustituye la validación del
 * backend — solo evita un 422 evidente por no haber marcado ninguna
 * respuesta correcta, que es el error más fácil de cometer editando a mano. */
function validateQuiz(values: StepFormValues): string | null {
  if (values.questions.length === 0) return 'El cuestionario necesita al menos una pregunta.';
  for (const [index, question] of values.questions.entries()) {
    if (!question.text.trim()) return `La pregunta ${index + 1} no puede quedar vacía.`;
    if (question.options.some((option) => !option.value.trim())) {
      return `Completa el texto de todas las opciones de la pregunta ${index + 1}.`;
    }
    if (question.correctIndex < 0 || question.correctIndex >= question.options.length) {
      return `Marca la opción correcta de la pregunta ${index + 1}.`;
    }
  }
  const thresholdNum = Number(values.thresholdPct);
  if (Number.isNaN(thresholdNum) || thresholdNum < 0 || thresholdNum > 100) {
    return 'El umbral debe ser un porcentaje entre 0 y 100.';
  }
  return null;
}

function validateVideo(values: StepFormValues): string | null {
  if (!values.videoUrl.trim()) return 'La URL del vídeo es obligatoria.';
  const durationNum = Number(values.videoDuration);
  if (!values.videoDuration || Number.isNaN(durationNum) || durationNum <= 0) {
    return 'La duración debe ser un número de segundos mayor que 0.';
  }
  return null;
}

interface OnboardingStepFormProps {
  step: AdminOnboardingStep;
  onSaved: () => void;
  onCancel: () => void;
}

export function OnboardingStepForm({ step, onSaved, onCancel }: OnboardingStepFormProps) {
  const form = useForm<StepFormValues>({ defaultValues: buildDefaultValues(step) });
  const { register, handleSubmit, watch, setValue, formState } = form;
  const { mutateAsync: updateStep, error: serverError, isPending } = useUpdateOnboardingStep();
  const [clientError, setClientError] = useState<string | null>(null);
  const isActive = watch('isActive');

  const onSubmit = async (values: StepFormValues) => {
    setClientError(null);

    if (step.type === 'quiz') {
      const validationError = validateQuiz(values);
      if (validationError) {
        setClientError(validationError);
        return;
      }
    } else if (step.type === 'video') {
      const validationError = validateVideo(values);
      if (validationError) {
        setClientError(validationError);
        return;
      }
    }

    const input: UpdateOnboardingStepInput = {
      title: values.title,
      isActive: values.isActive,
    };

    if (step.type === 'video') {
      input.config = {
        url: values.videoUrl.trim(),
        duration: Number(values.videoDuration),
      };
    } else if (step.type === 'quiz') {
      input.config = {
        questions: values.questions.map((question) => ({
          id: question.id,
          text: question.text.trim(),
          options: question.options.map((option) => option.value.trim()),
          correct: question.options[question.correctIndex]?.value.trim() ?? '',
        })),
        threshold: Number(values.thresholdPct) / 100,
      };
    }

    await updateStep({ stepId: step.id, input });
    onSaved();
  };

  return (
    <FormProvider {...form}>
      <form className={styles.form} onSubmit={handleSubmit(onSubmit)}>
        <div className={styles.field}>
          <Label htmlFor="stepTitle">Título del paso *</Label>
          <Input id="stepTitle" {...register('title', { required: true })} />
        </div>

        <div className={styles.statusRow}>
          <div>
            <p className={styles.statusLabel}>Paso activo</p>
            <p className={styles.statusHint}>
              Al desactivarlo, deja de mostrarse en el onboarding de la plantilla
            </p>
          </div>
          <Switch checked={isActive} onCheckedChange={(checked) => setValue('isActive', checked)} />
        </div>

        {step.type === 'video' && (
          <>
            <p className={styles.sectionTitle}>Vídeo</p>
            <div className={styles.field}>
              <Label htmlFor="videoUrl">URL del vídeo *</Label>
              <Input id="videoUrl" placeholder="https://…" {...register('videoUrl', { required: true })} />
            </div>
            <div className={styles.field}>
              <Label htmlFor="videoDuration">Duración (segundos) *</Label>
              <Input
                id="videoDuration"
                type="number"
                min={1}
                {...register('videoDuration', { required: true })}
              />
            </div>
          </>
        )}

        {step.type === 'quiz' && (
          <>
            <p className={styles.sectionTitle}>Cuestionario</p>
            <div className={styles.field}>
              <Label htmlFor="thresholdPct">Umbral para aprobar (%) *</Label>
              <Input
                id="thresholdPct"
                type="number"
                min={0}
                max={100}
                {...register('thresholdPct', { required: true })}
              />
            </div>
            <QuizQuestionsEditor />
          </>
        )}

        {step.type !== 'video' && step.type !== 'quiz' && (
          <p className={styles.noConfigHint}>
            Este paso no tiene configuración adicional editable desde aquí — solo el título y si está
            activo.
          </p>
        )}

        {formState.errors.title && <p className={styles.error}>Completa el título del paso.</p>}
        {clientError && <p className={styles.error}>{clientError}</p>}
        {serverError && (
          <p className={styles.error}>
            {serverError instanceof Error ? serverError.message : 'No se pudo guardar el paso.'}
          </p>
        )}

        <div className={styles.footer}>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" variant="dark" disabled={isPending}>
            {isPending ? 'Guardando…' : 'Guardar cambios'}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}
