import { appendFileSync, mkdirSync, rmSync } from 'node:fs';
import path from 'node:path';
import type { UiFinding } from './ui-audit';

/**
 * Bitácora de hallazgos de la ejecución, en `e2e-report/hallazgos.jsonl`.
 *
 * Existe porque los adjuntos de Playwright no sirven para revisar una
 * auditoría: los de los tests que PASAN se descartan, y los de los que fallan
 * solo se leen abriendo el informe HTML test por test. Auditar 20 pantallas y
 * tener que abrir 20 fichas para saber "qué pares de color fallan en toda la
 * app" convierte el informe en algo que nadie consulta.
 *
 * Con esto, cada ejecución deja un fichero plano que se puede agregar de un
 * grep: `pnpm e2e:hallazgos` lo resume por regla y por causa.
 */

const REPORT_DIR = 'e2e-report';
export const FINDINGS_PATH = path.join(REPORT_DIR, 'hallazgos.jsonl');

export interface LoggedFinding extends UiFinding {
  url: string;
  project: string;
  /** Ruta de títulos del test — lleva el rol dentro. */
  test: string;
  blocking: boolean;
}

/** Se llama una vez desde `global-setup`: la bitácora es por ejecución. */
export function resetFindingsLog(): void {
  try {
    rmSync(path.resolve(process.cwd(), FINDINGS_PATH), { force: true });
  } catch {
    /* no existía */
  }
}

export function logFindings(entries: LoggedFinding[]): void {
  if (entries.length === 0) return;

  const dir = path.resolve(process.cwd(), REPORT_DIR);
  mkdirSync(dir, { recursive: true });

  /* Una línea por hallazgo y un único `appendFileSync`: con dos workers
     escribiendo a la vez, los append cortos no se entrelazan, y así no hace
     falta un lock para algo que es un informe, no un dato transaccional. */
  const payload = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  appendFileSync(path.resolve(process.cwd(), FINDINGS_PATH), payload, 'utf-8');
}
