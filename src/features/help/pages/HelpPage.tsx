import { DownloadIcon, ExternalLinkIcon, MagnifyingGlassIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/Card';
import { ManualsLibrary } from '@/features/manuals/components/ManualsLibrary';
import styles from './HelpPage.module.css';

// Servidos desde `public/` (no importados como assets de Vite): la URL es
// estable, así que se pueden enlazar desde un correo o desde el onboarding sin
// que el bundler les meta un hash al nombre.
//
// El PDF vive en `public/manuales/`, junto al del Hincator y NO en
// `public/ayuda/`: es la ruta que `onboarding_documents.storage_ref` ya usa
// (`/manuales/manual-usuario-hincator-2026-ES.pdf`, migración 035), así que
// cuando el paso 3 admita varios manuales este fichero se referencia con una
// fila y sin moverlo. Dejarlo en dos sitios duplicaría 688 KB en el repo y su
// SHA-256 dejaría de ser único.
//
// Fuente de ambos: `amelia-intranet/docs/manual-de-uso.html`, que regenera
// `docs/build-manual-pdf.py`. Al actualizar el manual hay que copiar los dos.
const MANUAL_HTML = '/ayuda/manual-de-uso.html';
const MANUAL_PDF = '/manuales/manual-de-uso-intranet.pdf';

interface Chapter {
  n: string;
  /** Ancla dentro de `manual-de-uso.html` (`id` de su `<section>`). */
  anchor: string;
  title: string;
  detail: string;
}

/** Los 14 capítulos del manual v1.1. El orden y los anclajes son los del
 * documento: si allí se añade o renumera un capítulo, esta lista se actualiza
 * con él (hay un test que fija la cuenta y el formato de los anclajes). */
const CHAPTERS: Chapter[] = [
  { n: '01', anchor: 'c1', title: 'Bienvenida', detail: 'Qué es la intranet y qué hay dentro' },
  { n: '02', anchor: 'c2', title: 'Antes de empezar', detail: 'Qué necesitas y cómo entrar' },
  { n: '03', anchor: 'c3', title: 'Tus primeros 15 minutos', detail: 'Lo imprescindible del primer día' },
  { n: '04', anchor: 'c4', title: 'Tu onboarding paso a paso', detail: 'Los 5 pasos, uno por uno' },
  { n: '05', anchor: 'c5', title: 'El día a día', detail: 'Fichaje, ausencias, nóminas, documentos, equipo y buzón' },
  { n: '06', anchor: 'c6', title: 'Manual del administrador', detail: 'Solo rol Administrador' },
  { n: '07', anchor: 'c7', title: 'Qué ve cada rol', detail: 'Los cinco roles, comparados' },
  { n: '08', anchor: 'c8', title: 'La app móvil', detail: 'Qué sí y qué no está en el móvil' },
  { n: '09', anchor: 'c9', title: '«¿Por qué no puedo…?»', detail: 'Los límites del sistema y su motivo' },
  { n: '10', anchor: 'c10', title: 'Resolución de problemas', detail: 'Síntoma → qué hacer' },
  { n: '11', anchor: 'c11', title: 'Privacidad y tus datos', detail: 'Quién ve qué de ti' },
  { n: '12', anchor: 'c12', title: 'Contacto y soporte', detail: 'A quién escribir según el caso' },
  { n: '13', anchor: 'c13', title: 'Glosario', detail: 'Los términos que se usan aquí' },
  { n: '14', anchor: 'c14', title: 'Control de versiones', detail: 'Qué recoge esta edición' },
];

/**
 * Ayuda — índice del manual de uso de la intranet.
 *
 * El manual NO se re-implementa como componentes de React: vive como un HTML
 * autocontenido en `public/ayuda/` y esta página es su índice navegable. Motivo:
 * el documento es la misma fuente de la que sale el PDF que se reparte, así que
 * duplicarlo en JSX garantizaría que las dos copias divergen.
 *
 * Y NO se incrusta en un `<iframe>`, por el mismo motivo que el organigrama
 * (ver `TeamOrgChart`): la CSP de `Dockerfile.prod` declara `frame-src
 * https://accounts.google.com` SIN `'self'`, así que un iframe funcionaría en
 * local y en staging y se rompería en silencio al pasar la cabecera a
 * enforcing. Un `<a>` es una navegación y `frame-src` no le aplica, así que los
 * enlaces no obligan a tocar la CSP.
 *
 * Cada capítulo enlaza a su ancla, de modo que "no puedo fichar mañana" cae
 * directamente en el capítulo 9 y no en la portada de un documento de 30
 * páginas.
 */
export function HelpPage() {
  return (
    <div className={styles.root}>
      {/* NO repetir "Ayuda": el Topbar ya lo imprime como `<h1>` (es el label
          del ítem de navegación, vía `pageTitleForPath`). */}
      <Card>
        <CardContent className={styles.intro}>
          <div>
            <p className={styles.title}>Manual de uso de la intranet</p>
            <p className={styles.note}>
              Cómo funciona cada módulo, qué ve cada rol y por qué la intranet te impide algunas cosas.
              Ve directo al capítulo que necesites o abre el manual completo.
            </p>
          </div>
          <div className={styles.actions}>
            <a className={styles.action} href={MANUAL_HTML} target="_blank" rel="noreferrer">
              <ExternalLinkIcon className={styles.actionIcon} />
              Abrir el manual completo
            </a>
            <a className={styles.action} href={MANUAL_PDF} download>
              <DownloadIcon className={styles.actionIcon} />
              Descargar en PDF
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className={styles.list}>
          {CHAPTERS.map((chapter) => (
            <a
              key={chapter.anchor}
              className={styles.chapter}
              href={`${MANUAL_HTML}#${chapter.anchor}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className={styles.chapterNumber} aria-hidden="true">
                {chapter.n}
              </span>
              <span className={styles.chapterText}>
                <span className={styles.chapterTitle}>{chapter.title}</span>
                <span className={styles.chapterDetail}>{chapter.detail}</span>
              </span>
            </a>
          ))}
        </CardContent>
      </Card>

      {/* Biblioteca de manuales (`GET /manuals`, migración backend 043). Va aquí y
          no en una ruta propia: quien busca "el manual de X" ya viene a Ayuda, y
          repartir el mismo material en dos pantallas obligaría a adivinar cuál
          mirar. Abierta a los cinco roles, igual que esta página. */}
      <Card>
        <CardContent className={styles.manualsSection}>
          <div>
            <p className={styles.title}>Manuales</p>
            <p className={styles.note}>
              Documentación de referencia del equipo. Los de lectura obligatoria se confirman en tu
              onboarding; el resto están para consultar cuando los necesites.
            </p>
          </div>
          <ManualsLibrary />
        </CardContent>
      </Card>

      <Card>
        <CardContent className={styles.hint}>
          <MagnifyingGlassIcon className={styles.hintIcon} />
          <p className={styles.note}>
            ¿No encuentras la respuesta? El manual tiene buscador en su índice lateral. Y si sigue sin
            aparecer, escribe a RRHH: <a href="mailto:people@ameliahub.com">people@ameliahub.com</a> o{' '}
            <a href="mailto:admin@ameliahub.com">admin@ameliahub.com</a>.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
