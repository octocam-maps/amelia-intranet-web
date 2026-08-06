/**
 * Resume las dos bitácoras de auditoría:
 *
 *   · `e2e-report/hallazgos.jsonl`         capas 1-2, la última ejecución de la suite
 *   · `e2e-report/hallazgos-agente.jsonl`  capa 3, acumulada por los subagentes
 *
 *     pnpm e2e:hallazgos
 *
 * Agrupa por regla y por CAUSA, no por pantalla. Es la diferencia entre un
 * informe de 21 fallos y uno de dos arreglos: el mismo par de colores mal
 * medido aparece en veinte pantallas, pero se corrige en un sitio.
 *
 * Las dos bitácoras se resumen POR SEPARADO a propósito: la de la suite dice
 * qué está roto y se regenera entera en cada ejecución; la de los agentes dice
 * qué está mal diseñado, se acumula entre sesiones y cada línea es una decisión
 * pendiente. Mezclarlas escondería que unas caducan y otras no.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const SUITE_PATH = path.resolve(process.cwd(), 'e2e-report/hallazgos.jsonl');
const AGENT_PATH = path.resolve(process.cwd(), 'e2e-report/hallazgos-agente.jsonl');

const SEVERITY_ORDER = { critical: 0, high: 1, medium: 2 };

function read(file) {
  try {
    return readFileSync(file, 'utf-8')
      .trim()
      .split('\n')
      .filter(Boolean)
      .map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

const suite = read(SUITE_PATH);
const agent = read(AGENT_PATH);

if (suite.length === 0 && agent.length === 0) {
  console.error(
    'No hay ninguna bitácora en e2e-report/.\n' +
      '  Capas 1-2: pnpm e2e ui/\n' +
      '  Capa 3:    ver e2e/AUDIT-PROTOCOL.md',
  );
  process.exit(1);
}

/* La causa de un hallazgo de contraste es el par de colores, no el elemento:
   agrupar por elemento daría una entrada por cada nodo de cada pantalla. */
function causeOf(finding) {
  const contrast = finding.detail.match(/Texto (#[0-9a-f]{6}) sobre (#[0-9a-f]{6}) da ([\d.]+):1/i);
  if (contrast) return `${contrast[1]} sobre ${contrast[2]} → ${contrast[3]}:1`;
  const size = finding.detail.match(/Área táctil de (\d+×\d+)px/);
  if (size) return `área táctil ${size[1]}px`;
  return finding.detail.slice(0, 80);
}

function pathOf(url) {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

/** Agrupa por una clave y acumula los conjuntos que interesan del grupo. */
function group(findings, keyOf, bucketOf) {
  const groups = new Map();
  for (const finding of findings) {
    const key = keyOf(finding);
    const entry = groups.get(key) ?? {
      rule: finding.rule,
      cause: causeOf(finding),
      severity: finding.severity,
      blocking: finding.blocking,
      agent: finding.agent,
      elements: new Set(),
      urls: new Set(),
      buckets: new Set(),
      count: 0,
    };
    entry.count += 1;
    entry.elements.add(finding.element);
    entry.urls.add(pathOf(finding.url));
    const bucket = bucketOf(finding);
    if (bucket) entry.buckets.add(bucket);
    groups.set(key, entry);
  }

  return [...groups.values()].sort(
    (a, b) =>
      SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity] || b.urls.size - a.urls.size,
  );
}

function header(title, findings, extra = '') {
  const blocking = findings.filter((f) => f.blocking).length;
  return (
    `\n${'─'.repeat(72)}\n${title}\n${'─'.repeat(72)}\n` +
    `${findings.length} hallazgo(s) en ${new Set(findings.map((f) => f.url)).size} pantalla(s) ` +
    `— ${blocking} bloqueante(s), ${findings.length - blocking} informativo(s).${extra}\n`
  );
}

if (suite.length > 0) {
  const groups = group(suite, (f) => `${f.rule}|${causeOf(f)}`, (f) => f.project);
  console.log(header('CAPAS 1-2 · invariantes medibles (última ejecución de la suite)', suite));
  console.log(`Agrupados en ${groups.length} causa(s) distinta(s):\n`);

  for (const [index, entry] of groups.entries()) {
    console.log(
      `${index + 1}. [${entry.severity} · ${entry.blocking ? 'BLOQUEA' : 'informativo'}] ${entry.rule}\n` +
        `   Causa:    ${entry.cause}\n` +
        `   Alcance:  ${entry.urls.size} ruta(s), ${entry.count} nodo(s), anchos: ${[...entry.buckets].join(', ')}\n` +
        `   Rutas:    ${[...entry.urls].slice(0, 8).join(', ')}${entry.urls.size > 8 ? ` (+${entry.urls.size - 8})` : ''}\n` +
        `   Ejemplo:  ${[...entry.elements][0]}\n`,
    );
  }
}

if (agent.length > 0) {
  const byAgent = new Map();
  for (const finding of agent) {
    byAgent.set(finding.agent, [...(byAgent.get(finding.agent) ?? []), finding]);
  }
  const blocks = [...new Set(agent.map((f) => f.block))].join(', ');

  console.log(
    header('CAPA 3 · auditoría con subagentes (acumulada)', agent, ` Bloques: ${blocks}.`),
  );

  /* Por subagente y no todo junto: cada uno tiene su propio dominio y su propia
     tasa de acierto, y verlos separados es lo que permite afinar sus prompts. */
  for (const [name, findings] of [...byAgent.entries()].sort()) {
    const groups = group(findings, (f) => `${f.rule}|${causeOf(f)}`, (f) => f.viewport);
    console.log(`  ▸ ${name} — ${findings.length} hallazgo(s), ${groups.length} causa(s)\n`);

    for (const [index, entry] of groups.entries()) {
      const anchos = entry.buckets.size > 0 ? `, anchos: ${[...entry.buckets].join(', ')}` : '';
      console.log(
        `    ${index + 1}. [${entry.severity} · ${entry.blocking ? 'BLOQUEA' : 'informativo'}] ${entry.rule}\n` +
          `       Causa:    ${entry.cause}\n` +
          `       Alcance:  ${entry.urls.size} ruta(s), ${entry.count} caso(s)${anchos}\n` +
          `       Rutas:    ${[...entry.urls].slice(0, 6).join(', ')}\n` +
          `       Ejemplo:  ${[...entry.elements][0]}\n`,
      );
    }
  }

  /* La regla de cierre del AUDIT-PROTOCOL vive o muere aquí: un hallazgo de
     agente que sigue en la bitácora es trabajo sin convertir en test. */
  const pendientes = agent.filter((f) => f.blocking).length;
  if (pendientes > 0) {
    console.log(
      `  ${pendientes} hallazgo(s) bloqueante(s) de agente sin cerrar. Regla de cierre:\n` +
        '  medible → regla en e2e/support/ui-audit.ts · layout → baseline DESPUÉS de arreglar ·\n' +
        '  criterio → test dirigido. Ver e2e/AUDIT-PROTOCOL.md.\n',
    );
  }
}
