import type { Page } from '@playwright/test';
import {
  AA_LARGE_TEXT,
  AA_NORMAL_TEXT,
  contrastRatio,
} from '../../src/lib/a11y/contrast';

/**
 * Chequeos de UI/UX DETERMINISTAS sobre la pantalla ya renderizada.
 *
 * Esta es la capa que de verdad caza bugs visuales, y se distingue de las
 * otras dos por lo que puede afirmar:
 *
 *   * La regresión visual (`*.visual.spec.ts`) detecta que algo CAMBIÓ. No
 *     sabe si el estado anterior estaba bien.
 *   * El agente auditor (`e2e/AUDIT-PROTOCOL.md`) detecta que algo está mal
 *     DISEÑADO, pero no da el mismo veredicto dos veces.
 *   * Esto detecta que algo está objetivamente ROTO, siempre igual: texto que
 *     no se puede leer, contenido que se sale de la pantalla, un botón
 *     imposible de pulsar con el pulgar.
 *
 * La fórmula de contraste se importa de `src/lib/a11y/contrast.ts` — la misma
 * que usa `palette.test.ts` — para que la app y su auditoría no puedan medir
 * distinto.
 */

export type Severity = 'critical' | 'high' | 'medium';

export interface UiFinding {
  rule: string;
  severity: Severity;
  /** Descripción legible del elemento: etiqueta, clases y un trozo de texto. */
  element: string;
  detail: string;
}

/* ── Excepciones de contraste aprobadas por producto ─────────────────────────
 *
 * Estos pares INCUMPLEN AA y están así a sabiendas: el team-lead eligió
 * criterio visual sobre cumplimiento el 2026-07-30, con las mediciones
 * delante (ver los comentarios de `src/index.css`). No se silencia la regla
 * entera: se listan los pares concretos, con su ratio medido, para que
 * cualquier incumplimiento NUEVO siga saltando.
 *
 * El día que se quiera recuperar el cumplimiento, la palanca no es el color
 * del texto sino la SUPERFICIE (oscurecer el verde a #00784F da 5,53:1).
 */
const CONTRAST_EXCEPTIONS: ReadonlyArray<{
  foreground: string;
  background: string;
  ratio: string;
  reason: string;
}> = [
  {
    foreground: '#ffffff',
    background: '#00d170',
    ratio: '2,03:1',
    reason:
      'Verde de marca con texto blanco (--primary-foreground / --success-foreground). ' +
      'Decisión de producto del 2026-07-30: "resalta mucho más" que el navy.',
  },
  {
    foreground: '#ffffff',
    background: '#ef4343',
    ratio: '3,78:1',
    reason: 'Blanco sobre el rojo sólido (--destructive-foreground), documentado en index.css.',
  },
  {
    foreground: '#ffffff',
    background: '#f59f0a',
    ratio: '2,13:1',
    reason: 'Blanco sobre el ámbar sólido (--warning-foreground), documentado en index.css.',
  },
];

/** WCAG 2.5.8 (AA): objetivo mínimo de 24×24 px CSS. */
const MIN_TARGET_PX = 24;

/* ── Snapshot recogido en el navegador ─────────────────────────────────────── */

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TextSample {
  element: string;
  color: string;
  /** `null` si el fondo no es medible (degradado o imagen). */
  background: string | null;
  fontSizePx: number;
  fontWeight: number;
  textPreview: string;
}

interface InteractiveSample {
  element: string;
  rect: Rect;
  accessibleName: string;
  /** Un enlace en línea dentro de un párrafo no puede crecer a 24 px. */
  inlineInText: boolean;
}

interface OverflowSample {
  element: string;
  overflowPx: number;
}

interface HeadingSample {
  level: number;
  text: string;
  element: string;
}

interface PageSnapshot {
  documentScrollWidth: number;
  viewportWidth: number;
  textSamples: TextSample[];
  interactive: InteractiveSample[];
  horizontalOffenders: OverflowSample[];
  clippedText: OverflowSample[];
  headings: HeadingSample[];
}

/**
 * Todo el recorrido del DOM ocurre en una sola `evaluate`: cada ida y vuelta
 * al navegador cuesta milisegundos, y hacer una por elemento convertiría la
 * auditoría de una pantalla en decenas de segundos.
 */
async function collectSnapshot(page: Page): Promise<PageSnapshot> {
  return page.evaluate(
    ({ minTargetPx }) => {
      const describe = (el: Element): string => {
        const tag = el.tagName.toLowerCase();
        const id = el.id ? `#${el.id}` : '';
        const classes =
          typeof el.className === 'string' && el.className.trim()
            ? `.${el.className.trim().split(/\s+/).slice(0, 3).join('.')}`
            : '';
        const text = (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40);
        return `${tag}${id}${classes}${text ? ` — "${text}"` : ''}`;
      };

      const toHex = (r: number, g: number, b: number): string =>
        `#${[r, g, b].map((c) => Math.round(c).toString(16).padStart(2, '0')).join('')}`;

      const parseRgb = (value: string): [number, number, number, number] | null => {
        const match = value.match(
          /rgba?\(\s*([\d.]+)[\s,]+([\d.]+)[\s,]+([\d.]+)(?:[\s,/]+([\d.]+))?/i,
        );
        if (!match) return null;
        return [
          Number(match[1]),
          Number(match[2]),
          Number(match[3]),
          match[4] === undefined ? 1 : Number(match[4]),
        ];
      };

      /**
       * Fondo efectivo: sube por los ancestros hasta el primer fondo opaco y
       * aplana las capas translúcidas que haya encontrado por el camino.
       * Devuelve `null` si topa con un degradado o una imagen — ahí el número
       * sería inventado, y un dato inventado es peor que ninguno.
       */
      const effectiveBackground = (start: Element): string | null => {
        const layers: Array<[number, number, number, number]> = [];
        let node: Element | null = start;

        while (node) {
          const style = getComputedStyle(node);
          if (style.backgroundImage && style.backgroundImage !== 'none') return null;

          const rgba = parseRgb(style.backgroundColor);
          if (rgba && rgba[3] > 0) {
            layers.push(rgba);
            if (rgba[3] >= 1) break;
          }
          node = node.parentElement;
        }

        if (layers.length === 0) return '#ffffff'; // lienzo por defecto del navegador
        const base = layers[layers.length - 1]!;
        if (base[3] < 1) return null; // ninguna capa llegó a ser opaca

        let [r, g, b] = [base[0], base[1], base[2]];
        for (let i = layers.length - 2; i >= 0; i -= 1) {
          const layer = layers[i]!;
          const alpha = layer[3];
          r = layer[0] * alpha + r * (1 - alpha);
          g = layer[1] * alpha + g * (1 - alpha);
          b = layer[2] * alpha + b * (1 - alpha);
        }
        return toHex(r, g, b);
      };

      const isVisible = (el: Element): boolean => {
        const style = getComputedStyle(el);
        if (style.visibility === 'hidden' || style.display === 'none') return false;
        if (Number(style.opacity) === 0) return false;
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      };

      /** Solo elementos con texto PROPIO: si no, se contaría el mismo texto
          una vez por cada ancestro y el informe se llenaría de duplicados. */
      const ownText = (el: Element): string => {
        let text = '';
        for (const node of Array.from(el.childNodes)) {
          if (node.nodeType === Node.TEXT_NODE) text += node.textContent ?? '';
        }
        return text.trim().replace(/\s+/g, ' ');
      };

      const textSamples: TextSample[] = [];
      const interactive: InteractiveSample[] = [];
      const horizontalOffenders: OverflowSample[] = [];
      const clippedText: OverflowSample[] = [];
      const headings: HeadingSample[] = [];

      const viewportWidth = document.documentElement.clientWidth;

      for (const el of Array.from(document.body.querySelectorAll('*'))) {
        if (!isVisible(el)) continue;

        const style = getComputedStyle(el);
        const rect = el.getBoundingClientRect();
        const text = ownText(el);

        if (text) {
          const color = parseRgb(style.color);
          const background = effectiveBackground(el);
          if (color) {
            /* El color del texto también puede ser translúcido (un `muted` al
               60%): sin aplanarlo sobre su fondo, el ratio saldría optimista. */
            let [r, g, b] = [color[0], color[1], color[2]];
            if (color[3] < 1 && background) {
              const bg = parseRgb(
                `rgb(${parseInt(background.slice(1, 3), 16)}, ${parseInt(
                  background.slice(3, 5),
                  16,
                )}, ${parseInt(background.slice(5, 7), 16)})`,
              )!;
              r = r * color[3] + bg[0] * (1 - color[3]);
              g = g * color[3] + bg[1] * (1 - color[3]);
              b = b * color[3] + bg[2] * (1 - color[3]);
            }
            textSamples.push({
              element: describe(el),
              color: toHex(r, g, b),
              background,
              fontSizePx: parseFloat(style.fontSize),
              fontWeight: Number(style.fontWeight) || 400,
              textPreview: text.slice(0, 60),
            });
          }

          /* Texto recortado: el contenedor esconde parte de su propio texto y
             no lo declara con puntos suspensivos. Con ellipsis es una decisión
             de diseño; sin ella, el usuario simplemente no ve la palabra. */
          const hiddenX = el.scrollWidth - el.clientWidth;
          if (
            style.overflow !== 'visible' &&
            style.textOverflow !== 'ellipsis' &&
            hiddenX > 2 &&
            el.clientWidth > 0
          ) {
            clippedText.push({ element: describe(el), overflowPx: hiddenX });
          }
        }

        if (/^h[1-6]$/.test(el.tagName.toLowerCase())) {
          headings.push({
            level: Number(el.tagName.slice(1)),
            text: (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 60),
            element: describe(el),
          });
        }

        const interactiveTag = ['button', 'a', 'input', 'select', 'textarea'].includes(
          el.tagName.toLowerCase(),
        );
        const interactiveRole = ['button', 'link', 'checkbox', 'radio', 'switch', 'tab'].includes(
          el.getAttribute('role') ?? '',
        );
        if (interactiveTag || interactiveRole) {
          const isHiddenInput =
            el.tagName.toLowerCase() === 'input' &&
            (el as HTMLInputElement).type === 'hidden';
          if (!isHiddenInput) {
            const parentText = el.parentElement ? ownText(el.parentElement) : '';
            interactive.push({
              element: describe(el),
              rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
              accessibleName:
                el.getAttribute('aria-label') ??
                (el.textContent ?? '').trim().replace(/\s+/g, ' ').slice(0, 40),
              inlineInText: style.display === 'inline' && parentText.length > 0,
            });
          }
        }

        /* Overflow horizontal: se busca al CULPABLE, no solo el síntoma.
           `scrollWidth > innerWidth` dice que la página se desplaza de lado;
           esto dice qué elemento lo provoca. Se ignoran los fijos/absolutos
           colocados fuera a propósito (menús cerrados, carruseles). */
        if (style.position !== 'fixed' && style.position !== 'absolute') {
          const overflowPx = Math.round(rect.right - viewportWidth);
          if (overflowPx > 1) {
            horizontalOffenders.push({ element: describe(el), overflowPx });
          }
        }

        void minTargetPx;
      }

      return {
        documentScrollWidth: document.documentElement.scrollWidth,
        viewportWidth,
        textSamples,
        interactive,
        horizontalOffenders,
        clippedText,
        headings,
      };
    },
    { minTargetPx: MIN_TARGET_PX },
  );
}

/* ── Reglas (puras, sobre el snapshot) ─────────────────────────────────────── */

function normalizeHex(hex: string): string {
  return hex.trim().toLowerCase();
}

function isApprovedException(foreground: string, background: string): boolean {
  return CONTRAST_EXCEPTIONS.some(
    (exception) =>
      normalizeHex(exception.foreground) === normalizeHex(foreground) &&
      normalizeHex(exception.background) === normalizeHex(background),
  );
}

/** Umbral AA aplicable: el texto grande baja de 4,5:1 a 3:1. */
function requiredRatio(fontSizePx: number, fontWeight: number): number {
  const isLarge = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);
  return isLarge ? AA_LARGE_TEXT : AA_NORMAL_TEXT;
}

export function checkTextContrast(snapshot: PageSnapshot): UiFinding[] {
  const findings: UiFinding[] = [];
  const seen = new Set<string>();

  for (const sample of snapshot.textSamples) {
    if (!sample.background) continue; // degradado/imagen: no medible
    if (isApprovedException(sample.color, sample.background)) continue;

    const ratio = contrastRatio(sample.color, sample.background);
    const required = requiredRatio(sample.fontSizePx, sample.fontWeight);
    if (ratio >= required) continue;

    /* Un mismo par color/fondo suele repetirse en decenas de nodos (toda una
       tabla). Agrupar por par mantiene el informe legible y accionable: el
       arreglo es uno, no cuarenta. */
    const key = `${sample.color}|${sample.background}|${required}`;
    if (seen.has(key)) continue;
    seen.add(key);

    findings.push({
      rule: 'contraste-texto',
      severity: ratio < 3 ? 'critical' : 'high',
      element: sample.element,
      detail:
        `Texto ${sample.color} sobre ${sample.background} da ` +
        `${ratio.toFixed(2)}:1 y AA pide ${required}:1 ` +
        `(${sample.fontSizePx}px, peso ${sample.fontWeight}). ` +
        `Texto: "${sample.textPreview}"`,
    });
  }

  return findings;
}

export function checkHorizontalOverflow(snapshot: PageSnapshot): UiFinding[] {
  /* 1 px de margen: los redondeos de layout producen scrollWidth un píxel por
     encima del viewport sin que nada se salga de verdad. */
  if (snapshot.documentScrollWidth <= snapshot.viewportWidth + 1) return [];

  const worst = [...snapshot.horizontalOffenders]
    .sort((a, b) => b.overflowPx - a.overflowPx)
    .slice(0, 5);

  const detail =
    `El documento mide ${snapshot.documentScrollWidth}px en un viewport de ` +
    `${snapshot.viewportWidth}px: la página se desplaza en horizontal.` +
    (worst.length
      ? ` Elementos que más sobresalen: ${worst
          .map((o) => `${o.element} (+${o.overflowPx}px)`)
          .join('; ')}`
      : '');

  return [
    {
      rule: 'overflow-horizontal',
      severity: 'critical',
      element: 'document',
      detail,
    },
  ];
}

export function checkClippedText(snapshot: PageSnapshot): UiFinding[] {
  return snapshot.clippedText.slice(0, 10).map((sample) => ({
    rule: 'texto-recortado',
    severity: 'high' as Severity,
    element: sample.element,
    detail:
      `Esconde ${sample.overflowPx}px de su propio texto con overflow oculto y ` +
      `sin text-overflow: ellipsis, así que la parte cortada no se anuncia.`,
  }));
}

export function checkTargetSize(snapshot: PageSnapshot): UiFinding[] {
  const findings: UiFinding[] = [];

  for (const target of snapshot.interactive) {
    /* WCAG 2.5.8 exceptúa explícitamente los enlaces en línea dentro de un
       párrafo: no pueden crecer sin romper la línea de texto. */
    if (target.inlineInText) continue;

    const { width, height } = target.rect;
    if (width >= MIN_TARGET_PX && height >= MIN_TARGET_PX) continue;

    findings.push({
      rule: 'target-size',
      severity: 'medium',
      element: target.element,
      detail:
        `Área táctil de ${Math.round(width)}×${Math.round(height)}px; ` +
        `WCAG 2.5.8 (AA) pide ${MIN_TARGET_PX}×${MIN_TARGET_PX}px. ` +
        `Nombre accesible: "${target.accessibleName || '(ninguno)'}"`,
    });
  }

  return findings;
}

export function checkHeadingHierarchy(snapshot: PageSnapshot): UiFinding[] {
  const findings: UiFinding[] = [];
  const h1s = snapshot.headings.filter((h) => h.level === 1);

  if (h1s.length === 0 && snapshot.headings.length > 0) {
    findings.push({
      rule: 'jerarquia-encabezados',
      severity: 'medium',
      element: 'document',
      detail:
        'La pantalla tiene encabezados pero ninguno de nivel 1: no se anuncia ' +
        `de qué va. Primero encontrado: ${snapshot.headings[0]!.element}`,
    });
  }

  if (h1s.length > 1) {
    findings.push({
      rule: 'jerarquia-encabezados',
      severity: 'medium',
      element: 'document',
      detail:
        `${h1s.length} encabezados de nivel 1 compiten por ser el título: ` +
        h1s.map((h) => `"${h.text}"`).join(', '),
    });
  }

  let previous = 0;
  for (const heading of snapshot.headings) {
    if (previous > 0 && heading.level > previous + 1) {
      findings.push({
        rule: 'jerarquia-encabezados',
        severity: 'medium',
        element: heading.element,
        detail:
          `Salto de h${previous} a h${heading.level} ("${heading.text}"): ` +
          'la navegación por encabezados de un lector de pantalla se rompe.',
      });
    }
    previous = heading.level;
  }

  return findings;
}

/* ── Entrada pública ──────────────────────────────────────────────────────── */

export const UI_RULES = [
  checkHorizontalOverflow,
  checkTextContrast,
  checkClippedText,
  checkTargetSize,
  checkHeadingHierarchy,
] as const;

/** Ejecuta todas las reglas sobre la pantalla tal y como está ahora mismo. */
export async function auditUi(page: Page): Promise<UiFinding[]> {
  const snapshot = await collectSnapshot(page);
  return UI_RULES.flatMap((rule) => rule(snapshot));
}

/** Informe legible para el mensaje de fallo de un `expect`. */
export function formatFindings(findings: UiFinding[]): string {
  if (findings.length === 0) return 'Sin hallazgos.';

  const order: Severity[] = ['critical', 'high', 'medium'];
  return findings
    .slice()
    .sort((a, b) => order.indexOf(a.severity) - order.indexOf(b.severity))
    .map((f, i) => `${i + 1}. [${f.severity}] ${f.rule}\n   ${f.element}\n   ${f.detail}`)
    .join('\n\n');
}

export { CONTRAST_EXCEPTIONS };
