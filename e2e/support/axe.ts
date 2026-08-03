import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import type { UiFinding, Severity } from './ui-audit';

/**
 * axe-core cubre lo estructural que no tiene sentido reimplementar: roles ARIA
 * inválidos, controles sin etiqueta, `<img>` sin alternativa textual, orden de
 * tabulación, atributos duplicados.
 *
 * `color-contrast` va DESACTIVADA a propósito: el contraste se mide en
 * `ui-audit.ts` con la misma fórmula que usa la app y con la lista explícita
 * de excepciones que producto aprobó (verde de marca con texto blanco). Si se
 * dejara activa, cada botón primario aparecería como fallo en cada pantalla y
 * el informe se volvería inútil — el ruido es lo que mata una auditoría.
 */
const DISABLED_RULES = ['color-contrast'];

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

const IMPACT_TO_SEVERITY: Record<string, Severity> = {
  critical: 'critical',
  serious: 'high',
  moderate: 'medium',
  minor: 'medium',
};

export async function auditAccessibility(page: Page): Promise<UiFinding[]> {
  const results = await new AxeBuilder({ page })
    .withTags(AXE_TAGS)
    .disableRules(DISABLED_RULES)
    .analyze();

  return results.violations.map((violation) => ({
    rule: `axe:${violation.id}`,
    severity: IMPACT_TO_SEVERITY[violation.impact ?? 'moderate'] ?? 'medium',
    element: violation.nodes[0]?.target.join(' ') ?? 'document',
    detail:
      `${violation.help} (${violation.nodes.length} ` +
      `${violation.nodes.length === 1 ? 'elemento' : 'elementos'}). ` +
      `${violation.helpUrl}`,
  }));
}
