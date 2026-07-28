/**
 * Nombre de fichero del export del calendario de ausencias (RF-A1) — el
 * backend ya construye el nombre "real" (incluido en `Content-Disposition`,
 * con slug + periodo `YYYY-MM` cuando aplica), pero el navegador guarda el
 * fichero con el `download` que fija este cliente. Sin `subjectName`
 * (export global) el nombre NO cambia respecto al actual. Con `subjectName`
 * se antepone el slug del empleado — simplificación consciente frente al
 * backend: aquí siempre se usa `{from}_{to}` como periodo (no se replica la
 * regla "YYYY-MM si es mes natural exacto") para no duplicar esa lógica de
 * negocio en dos capas; el nombre autoritativo con el periodo comprimido
 * vive en la cabecera HTTP que genera el backend.
 */
export interface CalendarExportFilenameParams {
  dateFrom: string;
  dateTo: string;
  extension: 'xlsx' | 'pdf';
  subjectName?: string;
}

const COMBINING_DIACRITICS = /[̀-ͯ]/g;

function slugify(name: string): string {
  return name
    .normalize('NFKD')
    .replace(COMBINING_DIACRITICS, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function buildCalendarExportFilename({
  dateFrom,
  dateTo,
  extension,
  subjectName,
}: CalendarExportFilenameParams): string {
  const subjectSlugPart = subjectName ? `${slugify(subjectName)}-` : '';
  return `calendario-ausencias-${subjectSlugPart}${dateFrom}_${dateTo}.${extension}`;
}
