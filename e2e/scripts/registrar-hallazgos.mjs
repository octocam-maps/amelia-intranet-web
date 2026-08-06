/**
 * Registra en la bitácora los hallazgos que devuelve un subagente de auditoría.
 *
 *     node e2e/scripts/registrar-hallazgos.mjs < hallazgos.json
 *     echo '[{...}]' | node e2e/scripts/registrar-hallazgos.mjs
 *     node e2e/scripts/registrar-hallazgos.mjs --file /tmp/hallazgos.json
 *
 * ## Por qué escribe el orquestador y no cada subagente
 *
 * Los cuatro subagentes de la capa 3 devuelven texto y no tocan el disco: no
 * tienen ni `Write` ni `Bash` entre sus herramientas. Un solo escritor evita
 * dos cosas: que dos agentes se pisen el fichero, y que un agente decida por su
 * cuenta qué es un hallazgo válido. La validación de aquí es la aduana.
 *
 * ## Por qué valida en vez de aceptar lo que le den
 *
 * Un hallazgo sin pasos de reproducción no se puede verificar, y un hallazgo que
 * no se verifica no se arregla: se discute. Lo mismo con el ancho en los
 * hallazgos de layout — «se apelotona» sin decir a qué ancho no es accionable.
 * Se rechaza en la puerta, no se descubre tres semanas después leyendo el informe.
 */

import { appendFileSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

const REPORT_DIR = 'e2e-report';
const AGENT_FINDINGS_PATH = path.join(REPORT_DIR, 'hallazgos-agente.jsonl');

/* Mismo contrato que `AgentFinding` en e2e/support/findings-log.ts. Se declara
   aquí porque este script es JS y no puede importar el .ts; si cambia el
   contrato, cambian los dos — no hay tercer sitio. */
const AGENTS = ['e2e-funcional', 'e2e-consola-red', 'e2e-layout', 'e2e-a11y'];
const SEVERITIES = ['critical', 'high', 'medium'];
const REQUIRED = ['agent', 'block', 'role', 'url', 'rule', 'severity', 'element', 'detail', 'steps'];

function readInput() {
  const fileFlag = process.argv.indexOf('--file');
  if (fileFlag !== -1) {
    const file = process.argv[fileFlag + 1];
    if (!file) fail('--file necesita una ruta.');
    return readFileSync(file, 'utf-8');
  }
  try {
    return readFileSync(0, 'utf-8');
  } catch {
    fail('No hay nada en la entrada. Pasa el JSON por stdin o usa --file <ruta>.');
  }
}

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

/** Devuelve la lista de problemas de un hallazgo; vacía si es válido. */
function validate(finding, index) {
  const problems = [];
  const at = `hallazgo #${index + 1}`;

  for (const field of REQUIRED) {
    const value = finding[field];
    const empty = value === undefined || value === null || value === '';
    if (empty) problems.push(`${at}: falta \`${field}\``);
  }

  if (finding.agent && !AGENTS.includes(finding.agent)) {
    problems.push(`${at}: \`agent\` desconocido «${finding.agent}» (válidos: ${AGENTS.join(', ')})`);
  }
  if (finding.severity && !SEVERITIES.includes(finding.severity)) {
    problems.push(
      `${at}: \`severity\` debe ser ${SEVERITIES.join(' | ')}, no «${finding.severity}». ` +
        'El pulido va como `medium`.',
    );
  }
  if (finding.steps !== undefined && (!Array.isArray(finding.steps) || finding.steps.length === 0)) {
    problems.push(`${at}: \`steps\` debe ser una lista con al menos un paso de reproducción.`);
  }
  /* El ancho solo es obligatorio en layout: es su única forma de ser accionable. */
  if (finding.agent === 'e2e-layout' && !finding.viewport) {
    problems.push(`${at}: los hallazgos de \`e2e-layout\` necesitan \`viewport\` (p. ej. "390x844").`);
  }

  return problems;
}

const raw = readInput();
let parsed;
try {
  parsed = JSON.parse(raw);
} catch (error) {
  fail(`La entrada no es JSON válido: ${error.message}`);
}

const findings = Array.isArray(parsed) ? parsed : [parsed];
if (findings.length === 0) fail('La lista de hallazgos está vacía.');

const problems = findings.flatMap((finding, index) => validate(finding, index));
if (problems.length > 0) {
  console.error(`✗ ${problems.length} problema(s); no se ha registrado NADA:\n`);
  for (const problem of problems) console.error(`  · ${problem}`);
  process.exit(1);
}

/* `blocking` no se acepta de la entrada: se deriva, igual que en la capa 2, para
   que un agente no pueda declararse a sí mismo no bloqueante. */
const entries = findings.map((finding) => ({ ...finding, blocking: finding.severity !== 'medium' }));

mkdirSync(path.resolve(process.cwd(), REPORT_DIR), { recursive: true });
appendFileSync(
  path.resolve(process.cwd(), AGENT_FINDINGS_PATH),
  entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n',
  'utf-8',
);

const blocking = entries.filter((entry) => entry.blocking).length;
console.log(
  `✓ ${entries.length} hallazgo(s) registrado(s) en ${AGENT_FINDINGS_PATH} ` +
    `— ${blocking} bloqueante(s), ${entries.length - blocking} informativo(s).\n` +
    '  Resumen agregado: pnpm e2e:hallazgos',
);
