import { Plus, X } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';
import { Input } from '@/components/ui/Input';
import type { StepFormValues } from './step-form.types';
import styles from './QuizQuestionsEditor.module.css';

const MIN_OPTIONS = 2;
const MIN_QUESTIONS = 1;

interface QuestionRowProps {
  index: number;
  canRemove: boolean;
  onRemove: () => void;
}

/** Una pregunta — componente propio (no inline en el `.map`) porque
 * necesita su PROPIO `useFieldArray` para las opciones anidadas
 * (`questions.${index}.options`); llamarlo una vez por instancia respeta
 * las reglas de hooks (cada fila es un componente distinto, no una
 * iteración condicional del mismo hook). */
function QuestionRow({ index, canRemove, onRemove }: QuestionRowProps) {
  const { control, register, watch, setValue } = useFormContext<StepFormValues>();
  const {
    fields: optionFields,
    append: appendOption,
    remove: removeOption,
  } = useFieldArray({ control, name: `questions.${index}.options` });
  const correctIndex = watch(`questions.${index}.correctIndex`);

  const handleRemoveOption = (optionIndex: number) => {
    removeOption(optionIndex);
    if (optionIndex === correctIndex) {
      setValue(`questions.${index}.correctIndex`, -1);
    } else if (optionIndex < correctIndex) {
      setValue(`questions.${index}.correctIndex`, correctIndex - 1);
    }
  };

  return (
    <fieldset className={styles.question}>
      <div className={styles.questionHeader}>
        <span className={styles.questionNumber}>{index + 1}.</span>
        <Input
          className={styles.questionText}
          placeholder="Texto de la pregunta"
          aria-label={`Texto de la pregunta ${index + 1}`}
          {...register(`questions.${index}.text`, { required: true })}
        />
        <button
          type="button"
          className={styles.removeQuestionButton}
          onClick={onRemove}
          disabled={!canRemove}
          aria-label={`Eliminar pregunta ${index + 1}`}
        >
          <X />
        </button>
      </div>

      <span className={styles.optionsLabel}>Opciones · marca la correcta</span>
      <div className={styles.options}>
        {optionFields.map((optionField, optionIndex) => (
          <div key={optionField.id} className={styles.option}>
            <input
              type="radio"
              className={styles.optionRadio}
              name={`questions.${index}.correctIndex`}
              checked={correctIndex === optionIndex}
              onChange={() => setValue(`questions.${index}.correctIndex`, optionIndex)}
              aria-label={`Marcar la opción ${optionIndex + 1} como correcta`}
            />
            <Input
              className={styles.optionInput}
              placeholder={`Opción ${optionIndex + 1}`}
              aria-label={`Texto de la opción ${optionIndex + 1} de la pregunta ${index + 1}`}
              {...register(`questions.${index}.options.${optionIndex}.value`, { required: true })}
            />
            <button
              type="button"
              className={styles.removeOptionButton}
              onClick={() => handleRemoveOption(optionIndex)}
              disabled={optionFields.length <= MIN_OPTIONS}
              aria-label={`Eliminar opción ${optionIndex + 1}`}
            >
              <X />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        className={styles.addOptionButton}
        onClick={() => appendOption({ value: '' })}
      >
        <Plus />
        Añadir opción
      </button>
    </fieldset>
  );
}

/** Editor de preguntas del paso `quiz` — deck-fase6/16-onboarding-config.png
 * no detalla esta pantalla (solo la lista de pasos), así que el layout es
 * el más simple que resuelve el requisito funcional: texto + opciones +
 * marca de correcta por pregunta. */
export function QuizQuestionsEditor() {
  const { control } = useFormContext<StepFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: 'questions' });

  return (
    <div className={styles.root}>
      {fields.map((field, index) => (
        <QuestionRow
          key={field.id}
          index={index}
          canRemove={fields.length > MIN_QUESTIONS}
          onRemove={() => remove(index)}
        />
      ))}

      <button
        type="button"
        className={styles.addQuestionButton}
        onClick={() =>
          append({
            id: crypto.randomUUID(),
            text: '',
            options: [{ value: '' }, { value: '' }],
            correctIndex: -1,
          })
        }
      >
        <Plus />
        Añadir pregunta
      </button>
    </div>
  );
}
