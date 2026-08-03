import { expect, type Page, type TestInfo } from '@playwright/test';
import { auditAccessibility } from './axe';
import { logFindings } from './findings-log';
import { auditUi, formatFindings, type UiFinding } from './ui-audit';

/**
 * Ejecuta la auditoría completa (reglas propias + axe-core) y decide qué
 * rompe el test.
 *
 * `critical` y `high` FALLAN: son cosas que un usuario no puede sortear —
 * texto ilegible, contenido fuera de la pantalla, un control sin nombre
 * accesible.
 *
 * `medium` no rompe nada. No es indulgencia: son hallazgos reales que casi
 * siempre exigen una decisión de diseño (agrandar un icono cambia el ritmo
 * visual de una barra entera). Si rompieran el test, la suite estaría roja de
 * forma permanente por trabajo pendiente de decidir, y una suite
 * permanentemente roja no la mira nadie.
 *
 * TODOS los hallazgos, bloqueantes o no, van a `e2e-report/hallazgos.jsonl`
 * para poder revisar la auditoría completa de una pasada (`pnpm e2e:hallazgos`).
 */
export async function expectNoUiDefects(page: Page, testInfo: TestInfo): Promise<UiFinding[]> {
  const findings = [...(await auditUi(page)), ...(await auditAccessibility(page))];

  const blocking = findings.filter((f) => f.severity === 'critical' || f.severity === 'high');
  const advisory = findings.filter((f) => f.severity === 'medium');

  logFindings(
    findings.map((finding) => ({
      ...finding,
      url: page.url(),
      project: testInfo.project.name,
      /* La ruta de títulos ("Pantallas del rol empleado › /ausencias …") lleva
         el rol dentro. No se lee de `testInfo.project.use`: el rol se fija con
         `test.use` a nivel de describe y ahí no aparece. */
      test: testInfo.titlePath.join(' › '),
      blocking: finding.severity !== 'medium',
    })),
  );

  await testInfo.attach('auditoria-ui.txt', {
    body: formatFindings(findings),
    contentType: 'text/plain',
  });

  for (const finding of advisory) {
    testInfo.annotations.push({
      type: `ui:${finding.rule}`,
      description: `${finding.element} — ${finding.detail}`,
    });
  }

  expect(
    blocking,
    `Defectos de UI bloqueantes en ${page.url()} (${testInfo.project.name}):\n\n` +
      `${formatFindings(blocking)}\n`,
  ).toHaveLength(0);

  return findings;
}
