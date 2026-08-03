/**
 * Resume la bitácora de la última ejecución (`e2e-report/hallazgos.jsonl`).
 *
 *     pnpm e2e:hallazgos
 *
 * Agrupa por regla y por CAUSA, no por pantalla. Es la diferencia entre un
 * informe de 21 fallos y uno de dos arreglos: el mismo par de colores mal
 * medido aparece en veinte pantallas, pero se corrige en un sitio.
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';

const FINDINGS_PATH = path.resolve(process.cwd(), 'e2e-report/hallazgos.jsonl');

let lines;
try {
  lines = readFileSync(FINDINGS_PATH, 'utf-8').trim().split('\n').filter(Boolean);
} catch {
  console.error(
    `No hay bitácora en ${path.relative(process.cwd(), FINDINGS_PATH)}.\n` +
      'Ejecuta la suite primero: pnpm e2e ui/',
  );
  process.exit(1);
}

const findings = lines.map((line) => JSON.parse(line));

/* La causa de un hallazgo de contraste es el par de colores, no el elemento:
   agrupar por elemento daría una entrada por cada nodo de cada pantalla. */
function causeOf(finding) {
  const contrast = finding.detail.match(/Texto (#[0-9a-f]{6}) sobre (#[0-9a-f]{6}) da ([\d.]+):1/i);
  if (contrast) return `${contrast[1]} sobre ${contrast[2]} → ${contrast[3]}:1`;
  const size = finding.detail.match(/Área táctil de (\d+×\d+)px/);
  if (size) return `área táctil ${size[1]}px`;
  return finding.detail.slice(0, 80);
}

const groups = new Map();
for (const finding of findings) {
  const key = `${finding.rule}|${causeOf(finding)}`;
  const group = groups.get(key) ?? {
    rule: finding.rule,
    cause: causeOf(finding),
    severity: finding.severity,
    blocking: finding.blocking,
    elements: new Set(),
    urls: new Set(),
    projects: new Set(),
    count: 0,
  };
  group.count += 1;
  group.elements.add(finding.element);
  group.urls.add(new URL(finding.url).pathname);
  group.projects.add(finding.project);
  groups.set(key, group);
}

const ordered = [...groups.values()].sort((a, b) => {
  const order = { critical: 0, high: 1, medium: 2 };
  return order[a.severity] - order[b.severity] || b.urls.size - a.urls.size;
});

const blocking = findings.filter((f) => f.blocking).length;

console.log(
  `\n${findings.length} hallazgo(s) en ${new Set(findings.map((f) => f.url)).size} ` +
    `pantalla(s) — ${blocking} bloqueante(s), ${findings.length - blocking} informativo(s).\n` +
    `Agrupados en ${ordered.length} causa(s) distinta(s):\n`,
);

for (const [index, group] of ordered.entries()) {
  const bloqueo = group.blocking ? 'BLOQUEA' : 'informativo';
  console.log(
    `${index + 1}. [${group.severity} · ${bloqueo}] ${group.rule}\n` +
      `   Causa:    ${group.cause}\n` +
      `   Alcance:  ${group.urls.size} ruta(s), ${group.count} nodo(s), anchos: ${[...group.projects].join(', ')}\n` +
      `   Rutas:    ${[...group.urls].slice(0, 8).join(', ')}${group.urls.size > 8 ? ` (+${group.urls.size - 8})` : ''}\n` +
      `   Ejemplo:  ${[...group.elements][0]}\n`,
  );
}
