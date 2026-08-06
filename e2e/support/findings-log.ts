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

/* ── Capa 3: hallazgos de los subagentes de auditoría ────────────────────────
 *
 * Bitácora SEPARADA de la de arriba, y a propósito. La de la capa 2 se borra en
 * cada ejecución de la suite (`resetFindingsLog`) porque es el resultado de esa
 * ejecución; los hallazgos de los agentes se acumulan a lo largo de varias
 * sesiones —una por bloque— y borrarlos al lanzar `pnpm e2e` perdería el trabajo
 * de la tarde.
 *
 * La escala de severidad es la MISMA (`critical | high | medium`) para que
 * `e2e:hallazgos` pueda agregar las dos bitácoras sin traducir nada. El pulido
 * va como `medium`: no se añade un cuarto nivel para no romper el orden del
 * resumen ni abrir la puerta a un cajón de opiniones.
 */

export const AGENT_FINDINGS_PATH = path.join(REPORT_DIR, 'hallazgos-agente.jsonl');

export type AuditAgent = 'e2e-funcional' | 'e2e-consola-red' | 'e2e-layout' | 'e2e-a11y';

export interface AgentFinding extends UiFinding {
  /** Qué subagente lo encontró. Sin esto no se sabe a quién afinar. */
  agent: AuditAgent;
  /** Bloque auditado (`Jornada`, `Onboarding`…) — ver `AUDIT-PROTOCOL.md`. */
  block: string;
  /** Rol con el que se auditó: el mismo hallazgo puede no existir en otro. */
  role: string;
  url: string;
  /** Ancho donde aparece (`1440x900`…). Obligatorio en los de `e2e-layout`. */
  viewport?: string;
  /** Pasos de reproducción. Un hallazgo sin ellos no es verificable. */
  steps: string[];
  /** Localizador de `browser_generate_locator`, para convertirlo en test. */
  locator?: string;
  /** `fichero:línea` del componente culpable, si se localizó en `src/`. */
  source?: string;
  /** Rutas de capturas, trazas o vídeos bajo `e2e-report/mcp`. */
  evidence?: string[];
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

/**
 * Añade hallazgos de la capa 3 a su bitácora. Nunca la borra: acumula.
 *
 * El escritor habitual NO es un test sino el orquestador de la auditoría, a
 * través de `e2e/scripts/registrar-hallazgos.mjs`. Esta función existe para el
 * día en que un spec quiera dejar un hallazgo con la misma forma.
 */
export function logAgentFindings(entries: AgentFinding[]): void {
  if (entries.length === 0) return;

  mkdirSync(path.resolve(process.cwd(), REPORT_DIR), { recursive: true });
  const payload = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n';
  appendFileSync(path.resolve(process.cwd(), AGENT_FINDINGS_PATH), payload, 'utf-8');
}
