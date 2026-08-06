import { useState } from 'react';
import {
  CheckCircledIcon,
  ChevronDownIcon,
  DownloadIcon,
  FileTextIcon,
  UploadIcon,
} from '@radix-ui/react-icons';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useDownloadSignableDocument } from '../application/useDownloadSignableDocument';
import { useUploadSignedDocument } from '../application/useUploadSignedDocument';
import type { OnboardingStep, OnboardingStepDocument } from '../domain/models';
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

/**
 * Reemplaza a `SignatureStep`: la firma ya no ocurre dentro de la
 * plataforma (sin proveedor certificado, el hash/IP propios no constituían
 * prueba legal) — el trabajador firma fuera y sube aquí el PDF resultante.
 * `POST .../documents` recibe el archivo y a qué documento corresponde; el
 * `user_id` lo deriva el backend del JWT.
 *
 * Desde la reordenación de v1.1 (`033_onboarding_steps_reorder_v11.sql`) este
 * es EL ÚLTIMO paso: al subir toda la documentación firmada, el onboarding queda
 * completado y RRHH recibe el aviso.
 *
 * VARIOS DOCUMENTOS (migración backend 046): el paso trae CUATRO en
 * `step.documents` —RGPD, confidencialidad, cesión de imágenes y examen de
 * salud— y el paso no se cierra hasta que están todos subidos. Cada fila lleva su
 * propio ciclo descargar → firmar → subir.
 *
 * SIN CASCADA, al revés que los manuales: aquí ninguna fila llega `locked`. La
 * persona se descarga los cuatro, los firma de una sentada y los sube en el orden
 * que quiera — imponer un orden solo generaría rechazos que no protegen nada. Lo
 * decide el backend (`resolve_step_documents(cascade=False)`), no este componente.
 *
 * YA NO ESTÁ PENDIENTE LA DESCARGA (lo estuvo hasta la 046, cuando no existía ni
 * el fichero ni la vía de servirlo): el PDF se genera al vuelo RELLENADO con los
 * datos del perfil del paso 4. Por eso la descarga no es un `<a href>` a
 * `public/` como en los manuales, sino una petición autenticada — el documento
 * lleva dentro nombre, DNI y puesto.
 */
export function SignedDocumentUploadStep({ step }: SignedDocumentUploadStepProps) {
  const { mutate: upload, isPending: isUploading, variables, error } = useUploadSignedDocument();
  const {
    mutate: download,
    isPending: isDownloading,
    variables: downloadVariables,
    error: downloadError,
  } = useDownloadSignableDocument();

  // Acordeón: UN documento desplegado a la vez, igual que en el paso de manuales.
  // Con cuatro abiertos había cuatro pares idénticos de «Descargar»/«Subir» en
  // pantalla y no se veía cuál tocaba.
  //
  // `undefined` = nadie ha tocado nada, así que manda el valor por defecto (el
  // primero pendiente). `null` = se cerró a propósito. Sin esa distinción, cerrar
  // el desplegado lo volvería a abrir en el mismo render.
  const [expanded, setExpanded] = useState<string | null | undefined>(undefined);

  const isLocked = step.status === 'locked';
  const isCompleted = step.status === 'completed';
  const documents = step.documents;

  if (isLocked) {
    return (
      <div className={styles.root}>
        <p className={styles.locked}>
          Completa los pasos anteriores —incluida la lectura de los manuales— para desbloquear la
          documentación.
        </p>
      </div>
    );
  }

  // `acknowledged` es el nombre del campo en el contrato compartido con los
  // manuales; para un `signature` significa "ya subiste este documento firmado"
  // (lo resuelve el backend desde `onboarding_document_uploads`).
  const uploadedCount = documents.filter((document) => document.acknowledged).length;
  const nextPending = documents.find((document) => !document.acknowledged);
  const expandedId = expanded === undefined ? (nextPending?.id ?? null) : expanded;
  const toggleExpanded = (documentId: string) =>
    setExpanded(expandedId === documentId ? null : documentId);

  const allUploaded = documents.length > 0 && uploadedCount === documents.length;

  // Paso cerrado y todo entregado: no hay nada que hacer aquí, así que la
  // pantalla es un acuse y no un formulario.
  if (isCompleted && allUploaded) {
    return (
      <div className={styles.root}>
        <div className={styles.signedCard}>
          <CheckCircledIcon className={styles.signedIcon} />
          <h2 className={styles.signedTitle}>Documentación entregada</h2>
          <p className={styles.signedSubtitle}>
            Ya tenemos tus {documents.length} documentos firmados. Puedes consultarlos cuando quieras
            en Documentos.
          </p>
          <Link to="/documentos" className={styles.signedLink}>
            Ver en Documentos
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.root}>
      <h2 className={styles.title}>{step.title}</h2>
      <p className={styles.subtitle}>
        {documents.length > 1
          ? 'Descarga cada documento, fírmalo y súbelo en PDF. Vienen rellenados con los datos de tu perfil. Es el último paso: al entregarlos todos, tu onboarding queda completado.'
          : 'Descarga el documento, fírmalo y súbelo en PDF. Es el último paso: al subirlo, tu onboarding queda completado.'}
      </p>

      {documents.length === 0 ? (
        // Sin documentos configurados no hay nada que descargar ni subir. Se dice,
        // en vez de mostrar un campo de archivo que no lleva a ninguna parte.
        <p className={styles.documentPending}>
          RRHH todavía no ha publicado la documentación de este paso. Avísales para poder continuar.
        </p>
      ) : (
        <>
          {documents.length > 1 && (
            <p className={styles.progress}>
              {uploadedCount} de {documents.length} documentos entregados
            </p>
          )}

          <ol className={styles.documentList}>
            {documents.map((document) => (
              <li key={document.id} className={styles.documentRow}>
                <DocumentRow
                  document={document}
                  stepCompleted={isCompleted}
                  isExpanded={expandedId === document.id}
                  onToggle={() => toggleExpanded(document.id)}
                  isDownloading={isDownloading && downloadVariables?.documentId === document.id}
                  onDownload={() =>
                    download({ documentId: document.id, title: document.title })
                  }
                  isUploading={isUploading && variables?.documentId === document.id}
                  onUpload={(file) =>
                    upload({ stepId: step.id, file, documentId: document.id })
                  }
                />
              </li>
            ))}
          </ol>

          {/* `!isCompleted` NO es de adorno: con el paso ya cerrado y documentos
              añadidos después, este aviso decía «Te queda por entregar X» justo
              debajo del panel de X, que dice «no tienes que entregarlo», y del
              cierre que dice «no tienes que entregar nada más». Tres mensajes,
              dos de ellos contradiciéndose. Si el paso está cerrado no queda nada
              por entregar, por mucho que falten documentos. */}
          {nextPending && !isCompleted && documents.length > 1 && (
            <p className={styles.gateHint}>
              Te queda por entregar «{nextPending.title}».
            </p>
          )}
        </>
      )}

      {/* Un documento AÑADIDO al paso después de que esta persona lo cerrara: el
          paso está `completed` pero falta alguno por subir, y el POST responde 422
          (`ensure_step_operable`). Se dice en vez de ofrecer un botón que falla. */}
      {isCompleted && !allUploaded && (
        <p className={styles.documentNote}>
          Este paso ya estaba completado cuando se añadió documentación nueva, así que no tienes que
          entregar nada más. Si RRHH te la pide, escríbeles.
        </p>
      )}

      {(error || downloadError) && (
        <p className={styles.error}>
          {error instanceof Error
            ? error.message
            : downloadError instanceof Error
              ? downloadError.message
              : 'No se pudo completar la operación.'}
        </p>
      )}
    </div>
  );
}

interface DocumentRowProps {
  document: OnboardingStepDocument;
  /** El paso ya está cerrado: no admite más subidas (el POST daría 422). */
  stepCompleted: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  isDownloading: boolean;
  onDownload: () => void;
  isUploading: boolean;
  onUpload: (file: File) => void;
}

function DocumentRow({
  document,
  stepCompleted,
  isExpanded,
  onToggle,
  isDownloading,
  onDownload,
  isUploading,
  onUpload,
}: DocumentRowProps) {
  const [file, setFile] = useState<File | null>(null);
  const [clientError, setClientError] = useState<string | null>(null);

  const uploaded = document.acknowledged;
  // Documento incorporado al paso después de que esta persona lo cerrara.
  const addedAfterCompletion = stepCompleted && !uploaded;
  const panelId = `${document.id}-panel`;

  const onFileSelected = (fileList: FileList | null) => {
    const selected = fileList?.[0] ?? null;
    if (!selected) {
      setFile(null);
      setClientError(null);
      return;
    }
    // Se valida en el cliente ADEMÁS de en el backend: no para protegerse (eso lo
    // hace `UploadDocumentUseCase`), sino para no hacer subir 10 MB antes de
    // decir que el formato no vale.
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

  return (
    <>
      {/* El disparador va dentro de un encabezado y controla su panel por
          `aria-controls`/`aria-expanded` (patrón ARIA de acordeón): así un lector
          de pantalla recorre los documentos como lista de encabezados y sabe cuál
          está desplegado. El paso ya usa `h2`. */}
      <h3 className={styles.documentHeading}>
        <button
          type="button"
          className={styles.documentToggle}
          aria-expanded={isExpanded}
          aria-controls={panelId}
          onClick={onToggle}
        >
          {uploaded ? (
            <CheckCircledIcon className={styles.documentIconDone} aria-label="Entregado" />
          ) : (
            <FileTextIcon className={styles.documentIcon} />
          )}
          <span className={styles.documentTitle}>{document.title}</span>
          {uploaded && <span className={styles.documentBadge}>Entregado</span>}
          <ChevronDownIcon
            className={cn(styles.documentChevron, isExpanded && styles.documentChevronOpen)}
            aria-hidden
          />
        </button>
      </h3>

      {/* `hidden` en vez de no renderizar: `aria-controls` tiene que apuntar a un
          elemento que exista, y así el navegador encuentra texto dentro de un
          panel cerrado con su propia búsqueda. */}
      <div className={styles.documentPanel} id={panelId} hidden={!isExpanded}>
        {uploaded ? (
          <p className={styles.documentNote}>
            Ya lo tenemos firmado. Puedes consultarlo en Documentos.
          </p>
        ) : addedAfterCompletion ? (
          <p className={styles.documentNote}>
            Se añadió después de que completaras este paso, así que no tienes que entregarlo.
          </p>
        ) : (
          <div className={styles.documentSteps}>
            {/* La descarga es un BOTÓN y no un enlace porque no navega a ninguna
                URL: pide el PDF con la cabecera de autorización y dispara el
                "Guardar como". Un enlace prometería una dirección que se puede
                copiar, y esta no existe. */}
            <div className={styles.documentActions}>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                disabled={isDownloading}
                aria-label={`Descargar para firmar: ${document.title}`}
              >
                <DownloadIcon className={styles.documentActionIcon} />
                {isDownloading ? 'Preparando…' : 'Descargar para firmar'}
              </Button>
              <span className={styles.documentHint}>Ya lleva tus datos rellenados</span>
            </div>

            <label className={styles.fileField}>
              <UploadIcon className={styles.fileFieldIcon} />
              <span className={styles.fileFieldText}>
                {file ? file.name : 'Selecciona el PDF firmado'}
              </span>
              <input
                type="file"
                accept="application/pdf,.pdf"
                aria-label={`Selecciona el PDF firmado de ${document.title}`}
                onChange={(event) => onFileSelected(event.target.files)}
                className={styles.fileInput}
              />
            </label>

            {clientError && <p className={styles.error}>{clientError}</p>}

            <div className={styles.documentFooter}>
              <span className={styles.documentHint}>Solo PDF, máximo {MAX_UPLOAD_MB} MB.</span>
              <Button
                variant="dark"
                size="sm"
                disabled={!file || isUploading}
                onClick={() => file && onUpload(file)}
              >
                {isUploading ? 'Subiendo…' : 'Subir firmado'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
