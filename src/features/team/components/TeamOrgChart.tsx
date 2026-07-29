import { DownloadIcon, ExternalLinkIcon } from '@radix-ui/react-icons';
import { Card, CardContent } from '@/components/ui/Card';
import styles from './TeamOrgChart.module.css';

// Servido desde `public/organigrama/` (no importado como asset de Vite): así
// la URL es estable y el PDF se puede enlazar/descargar sin que el bundler le
// meta un hash al nombre.
const ORG_CHART_IMAGE = '/organigrama/organigrama-amelia-2026.png';
const ORG_CHART_PDF = '/organigrama/organigrama-amelia-2026.pdf';

/**
 * Organigrama del grupo, publicado como IMAGEN — deliberadamente, no en un
 * `<iframe>`/`<embed>` con el PDF.
 *
 * Motivo: la CSP de `Dockerfile.prod` declara `frame-src
 * https://accounts.google.com` (sin `'self'`) y `object-src 'none'`. Hoy la
 * cabecera va en `Content-Security-Policy-Report-Only`, así que un iframe
 * funcionaría en local y en staging y se rompería EN SILENCIO el día que se
 * pase a enforcing. `img-src 'self'` ya está permitido, así que la imagen no
 * necesita tocar la CSP. El PDF sigue disponible para abrir/descargar: un
 * `<a>` es una navegación, no contenido embebido, y `frame-src` no le aplica.
 *
 * Sustituye a `TeamOrgChartPlaceholder`, que reservaba el hueco mientras RRHH
 * no facilitara la estructura de mando.
 *
 * OJO con el alcance: el organigrama cubre al equipo del Hincator (28
 * personas). El directorio tiene a las 36 del grupo — la parte de inspección
 * con dron (Lab y Ops) no aparece en este gráfico. Por eso la nota de abajo
 * es parte del componente y no un detalle cosmético: sin ella, quien no se
 * encuentre en el organigrama pensará que falta un dato suyo.
 */
export function TeamOrgChart() {
  return (
    <Card>
      <CardContent className={styles.root}>
        <a
          className={styles.imageLink}
          href={ORG_CHART_PDF}
          target="_blank"
          rel="noreferrer"
          // El gráfico tiene texto pequeño: a tamaño de pantalla se lee
          // regular, así que el propio gráfico es el enlace para abrirlo a
          // tamaño completo.
          title="Abrir el organigrama a tamaño completo (PDF)"
        >
          <img
            className={styles.image}
            src={ORG_CHART_IMAGE}
            // El `alt` describe QUÉ es y cómo llegar al contenido
            // equivalente, en vez de intentar recitar 28 nombres: el
            // directorio ya expone la misma información en texto y navegable.
            alt="Organigrama del equipo del Hincator: Bernardo Sá Pereira (CEO) y las áreas de CMO, CPO, CFO, CSO, COO y CPTO. El detalle de cada persona está en la pestaña Directorio."
            width={2666}
            height={1500}
            loading="lazy"
          />
        </a>

        <div className={styles.footer}>
          <p className={styles.note}>
            Este organigrama recoge al equipo del Hincator. En la pestaña{' '}
            <strong>Directorio</strong> está toda la plantilla del grupo, incluidas las personas de
            Lab y Ops que no aparecen en el gráfico.
          </p>
          <div className={styles.actions}>
            <a className={styles.action} href={ORG_CHART_PDF} target="_blank" rel="noreferrer">
              <ExternalLinkIcon className={styles.actionIcon} />
              Abrir a tamaño completo
            </a>
            <a className={styles.action} href={ORG_CHART_PDF} download>
              <DownloadIcon className={styles.actionIcon} />
              Descargar PDF
            </a>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
