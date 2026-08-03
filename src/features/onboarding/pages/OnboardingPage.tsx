import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRightIcon,
  CalendarIcon,
  CheckCircledIcon,
  ClockIcon,
  DashboardIcon,
} from '@radix-ui/react-icons';
import { UsersIcon } from '@/components/icons';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/Card';
import { isAdmin, isExternalGuest } from '@/features/auth/domain/models';
import { useStore } from '@/store';
import { NAV_BY_ROLE } from '@/layouts/AppLayout/nav-config';
import { useMyOnboarding } from '../application/useMyOnboarding';
import { ManualStep } from '../components/ManualStep';
import { OnboardingStepper } from '../components/OnboardingStepper';
import { ProfileStep } from '../components/ProfileStep';
import { QuizStep } from '../components/QuizStep';
import { SignedDocumentUploadStep } from '../components/SignedDocumentUploadStep';
import { VideoStep } from '../components/VideoStep';
import type { OnboardingStep } from '../domain/models';
import styles from './OnboardingPage.module.css';

function StepPanel({ step, reviewMode }: { step: OnboardingStep; reviewMode: boolean }) {
  switch (step.type) {
    case 'video':
      return <VideoStep step={step} reviewMode={reviewMode} />;
    case 'quiz':
      return <QuizStep step={step} />;
    case 'signature':
      return <SignedDocumentUploadStep step={step} />;
    case 'manual':
      return <ManualStep step={step} />;
    case 'profile':
      return <ProfileStep step={step} />;
    default:
      return null;
  }
}

/**
 * Orquestador de la Fase 2 — el `GET /onboarding/me` ya llega filtrado por
 * rol, así que aquí no hay ninguna rama de rol: se renderiza la lista que
 * manda el backend, sea de 5 pasos (empleado/admin) o solo vídeo+manual
 * (externo-invitado).
 */
export function OnboardingPage() {
  const { data: steps = [], isLoading } = useMyOnboarding();
  const currentUser = useStore((s) => s.user);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);

  // El administrador entra aquí a REVISAR, no a cumplir: el backend le manda
  // todos los pasos abiertos (`is_exempt_from_sequential_gating`) y esta pantalla
  // deja de hablarle como a un recién llegado. Sin esto seguía viendo "Te damos
  // la bienvenida" y una barra de progreso al 0% que no tiene que subir nunca.
  //
  // Es copy, presentación y —desde el 2026-08-03— los controles del vídeo del
  // paso 1, que en modo revisión se pueden adelantar y rebobinar.
  //
  // Sigue sin ser EL PERMISO: quien decide qué pasos están abiertos y qué
  // progreso se acepta es el backend (`is_exempt_from_sequential_gating` e
  // `is_exempt_from_video_pacing`). Si esto se leyera como el permiso, escribir
  // la URL a mano sería la vía de escape que la regla del proyecto prohíbe;
  // aquí solo se deja de estorbar a quien el backend ya ha eximido.
  const reviewMode = isAdmin(currentUser?.role);

  const activeStep = useMemo(
    () => steps.find((s) => s.status === 'available' || s.status === 'in_progress') ?? null,
    [steps]
  );
  const allCompleted = steps.length > 0 && steps.every((s) => s.status === 'completed');

  // El paso activo cambia cuando el backend desbloquea el siguiente (tras
  // completar vídeo, cuestionario…) — si el usuario no ha elegido revisar
  // manualmente un paso ya completado, seguimos el foco al nuevo activo.
  useEffect(() => {
    if (!activeStep) return;
    setSelectedStepId((current) => {
      if (!current) return activeStep.id;
      const currentStep = steps.find((s) => s.id === current);
      if (currentStep?.status === 'locked') return activeStep.id;
      return current;
    });
  }, [activeStep, steps]);

  const selectedStep = steps.find((s) => s.id === selectedStepId) ?? activeStep ?? steps[0] ?? null;
  const selectedIndex = selectedStep ? steps.findIndex((s) => s.id === selectedStep.id) : -1;
  const nextStep = selectedIndex >= 0 ? steps[selectedIndex + 1] : undefined;
  const showContinue =
    !!selectedStep && selectedStep.status === 'completed' && !!nextStep && nextStep.status !== 'locked';

  const completedCount = steps.filter((s) => s.status === 'completed').length;
  const progressPct = steps.length > 0 ? Math.round((completedCount / steps.length) * 100) : 0;

  if (isLoading) {
    return <p className={styles.loading}>Cargando tu onboarding…</p>;
  }

  if (steps.length === 0) {
    return <p className={styles.loading}>No tienes pasos de onboarding pendientes.</p>;
  }

  // El hero de "¡Onboarding completado!" es la recompensa de quien lo ha
  // recorrido. Para el administrador sería una pantalla sin salida: sustituye al
  // riel de pasos, así que si algún día completa los cinco perdería el acceso a
  // revisarlos, que es justo para lo que entra.
  if (allCompleted && !reviewMode) {
    const role = currentUser?.role;
    const externalGuest = isExternalGuest(role);
    // Las tarjetas de "esto puedes hacer ahora" se filtran con el MISMO mapa de
    // navegación por rol (NAV_BY_ROLE) que usa el navbar — así el externo no ve
    // accesos a módulos que su rol no tiene (p. ej. Control horario, que el
    // backend además le rechaza con 403) y no duplicamos la matriz de permisos.
    const allowedPaths = new Set(role ? NAV_BY_ROLE[role].map((item) => item.to) : []);
    return (
      <div className={styles.completedHero}>
        <div className={styles.completedIconWrap}>
          <CheckCircledIcon className={styles.completedIcon} />
        </div>
        <h2 className={styles.completedTitle}>
          ¡Onboarding completado{currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}!
        </h2>
        <p className={styles.completedSubtitle}>
          {externalGuest
            ? 'Ya tienes acceso a tu espacio. Esto es lo que puedes hacer ahora:'
            : 'Ya formas parte del equipo. Esto es lo que puedes hacer ahora:'}
        </p>
        <div className={styles.completedCards}>
          {allowedPaths.has('/') && (
            <Link to="/" className={styles.completedCard}>
              <DashboardIcon className={styles.completedCardIcon} />
              <span className={styles.completedCardTitle}>{externalGuest ? 'Tu inicio' : 'Tu dashboard'}</span>
              <span className={styles.completedCardSubtitle}>
                {externalGuest ? 'Anuncios y cumpleaños del equipo' : 'Festivos, anuncios y accesos'}
              </span>
            </Link>
          )}
          {allowedPaths.has('/control-horario') && (
            <Link to="/control-horario" className={styles.completedCard}>
              <ClockIcon className={styles.completedCardIcon} />
              <span className={styles.completedCardTitle}>Ficha tu jornada</span>
              <span className={styles.completedCardSubtitle}>Control horario y pausas</span>
            </Link>
          )}
          {/* Era una tarjeta muerta (`completedCardDisabled`) con el subtítulo
              "· próximamente". Equipo está activo desde hace tiempo y su
              organigrama se publicó en esta misma ronda (`TeamOrgChart`), así
              que el aviso quedó caducado: dejaba un acceso apagado a un módulo
              que el rol SÍ tiene en su navbar. */}
          {allowedPaths.has('/equipo') && (
            <Link to="/equipo" className={styles.completedCard}>
              <UsersIcon className={styles.completedCardIcon} />
              <span className={styles.completedCardTitle}>Conoce al equipo</span>
              <span className={styles.completedCardSubtitle}>Directorio y organigrama</span>
            </Link>
          )}
        </div>
        <Link to="/" className={styles.completedCta}>
          Entrar en mi {externalGuest ? 'inicio' : 'dashboard'}
          <ArrowRightIcon className={styles.completedCtaIcon} />
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      {/* El aviso de la vista de revisión va DENTRO del encabezado, como una
          línea de texto más. Antes era una tarjeta con borde de color y fondo
          teñido: media pantalla de peso visual para decir una frase, y ese
          recuadro de aviso no lo usa ninguna otra pantalla de la intranet. */}
      <div className={styles.header}>
        <p className={styles.eyebrow}>{reviewMode ? 'Vista de administración' : 'Tu onboarding'}</p>
        <h2 className={styles.title}>
          {reviewMode
            ? 'Los pasos del onboarding'
            : `Te damos la bienvenida a Amelia${currentUser?.fullName ? `, ${currentUser.fullName.split(' ')[0]}` : ''}`}
        </h2>
        {reviewMode && (
          <p className={styles.headerNote}>
            Esto es lo que ve la plantilla. No tienes que completarlo: puedes abrir
            cualquier paso sin haber terminado el anterior. Para revisarlo sin dejar
            rastro en tu progreso, usa{' '}
            <Link to="/administracion/onboarding" className={styles.headerNoteLink}>
              Administración › Onboarding
            </Link>
            .
          </p>
        )}
      </div>

      {!reviewMode && (
        <Card>
          <CardContent className={styles.progressCard}>
            <div className={styles.progressRow}>
              <span className={styles.progressLabel}>Tu progreso</span>
              <span className={styles.progressPct}>{progressPct}%</span>
            </div>
            <div className={styles.progressTrack}>
              <div className={styles.progressFill} style={{ width: `${progressPct}%` }} />
            </div>
            <p className={styles.progressHint}>
              <CalendarIcon className={styles.progressHintIcon} />
              {completedCount} de {steps.length} pasos completados
            </p>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className={styles.stepperCard}>
          <OnboardingStepper
            steps={steps}
            activeStepId={selectedStep?.id ?? null}
            onSelectStep={(step) => setSelectedStepId(step.id)}
          />
        </CardContent>
      </Card>

      {selectedStep && (
        <Card>
          <CardContent className={styles.stepCard}>
            <StepPanel step={selectedStep} reviewMode={reviewMode} />
            {showContinue && nextStep && (
              <div className={styles.continueRow}>
                <button
                  type="button"
                  className={styles.continueButton}
                  onClick={() => setSelectedStepId(nextStep.id)}
                >
                  Continuar al paso {nextStep.stepOrder}
                  <ArrowRightIcon className={styles.continueIcon} />
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
