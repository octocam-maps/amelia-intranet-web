import { expect, type Page, type TestInfo } from '@playwright/test';
import { auditAccessibility } from './axe';
import { auditUi, formatFindings, type UiFinding } from './ui-audit';

/**
 * Ejecuta la auditoría completa (reglas propias + axe-core) y decide qué
 * rompe el test.
 *
 * `critical` y `high` FALLAN: son cosas que un usuario no puede sortear —
 * texto ilegible, contenido fuera de la pantalla, un control sin nombre
 * accesible.
 *
 * `medium` se adjunta al informe pero no rompe nada. No es indulgencia: son
 * hallazgos reales que casi siempre exigen una decisión de diseño (agrandar un
 * icono cambia el ritmo visual de una barra entera). Si rompieran el test, la
 * suite estaría roja de forma permanente por trabajo pendiente de decidir, y
 * una suite permanentemente roja no la mira nadie.
 */
export async function expectNoUiDefects(page: Page, testInfo: TestInfo): Promise<UiFinding[]> {
  const findings = [...(await auditUi(page)), ...(await auditAccessibility(page))];

  await testInfo.attach('auditoria-ui.txt', {
    body: formatFindings(findings),
    contentType: 'text/plain',
  });

  const blocking = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');
  const advisory = findings.filter((f) => f.severity === 'medium');

  for (const finding of advisory) {
    testInfo.annotations.push({
      type: `ui:${finding.rule}`,
      description: `${finding.element} — ${finding.detail}`,
    });
  }

  /* Se imprimen en consola además de anotarse. Playwright borra los adjuntos
     de los tests que PASAN, así que un hallazgo `medium` en un test verde solo
     existiría dentro del informe HTML — y nadie abre el informe de una
     ejecución que salió en verde. Un hallazgo que no se ve no existe. */
  if (advisory.length > 0) {
    console.log(
      `\nℹ  ${advisory.length} hallazgo(s) no bloqueante(s) en ` +
        `${page.url()} [${testInfo.project.name}]:\n${formatFindings(advisory)}\n`,
    );
  }

  expect(
    blocking,
    `Defectos de UI bloqueantes en ${page.url()} (${testInfo.project.name}):\n\n` +
      `${formatFindings(blocking)}\n`,
  ).toHaveLength(0);

  return findings;
}
