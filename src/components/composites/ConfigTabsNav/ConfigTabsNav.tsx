import { Link } from 'react-router-dom';
import styles from './ConfigTabsNav.module.css';

export type ConfigTab = 'festivos' | 'tipos-ausencia' | 'onboarding' | 'plantillas-email';

const TABS: { value: ConfigTab; label: string; to: string }[] = [
  { value: 'festivos', label: 'Festivos', to: '/administracion/festivos' },
  { value: 'tipos-ausencia', label: 'Tipos de ausencia', to: '/administracion/tipos-ausencia' },
  { value: 'onboarding', label: 'Onboarding', to: '/administracion/onboarding' },
  {
    value: 'plantillas-email',
    label: 'Plantillas de correo',
    to: '/administracion/plantillas-email',
  },
];

interface ConfigTabsNavProps {
  active: ConfigTab;
}

/**
 * deck-fase6/14-festivos.png, 15-tipos-ausencia.png y 16-onboarding-config.png
 * — "Festivos", "Tipos de ausencia" y "Onboarding" comparten una misma
 * cabecera "Configuración" con pestañas subrayadas. Se comparte entre las
 * páginas de `holidays`, `absences` y `onboarding/admin` en vez de duplicar
 * el marcado.
 *
 * "Plantillas de correo" (migración backend 041) se suma aquí y NO como una
 * pantalla aislada: es configuración de la intranet, del mismo tipo que los
 * festivos o los tipos de ausencia, y el admin espera encontrarla donde ya está
 * el resto.
 *
 * ## Son ENLACES, no pestañas — y eso importa
 *
 * Esto usaba el primitivo `Tabs` de Radix con un `onValueChange` que llamaba a
 * `navigate()`. Parecía inofensivo y tenía dos defectos:
 *
 * 1. Radix pone `aria-controls` en cada trigger apuntando al panel que le
 *    corresponde, pero aquí NO hay ningún `TabsContent` — cada pestaña es una
 *    ruta distinta. El atributo señalaba a un `id` inexistente en las cuatro
 *    pantallas: es el hallazgo `aria-valid-attr-value` de la auditoría E2E del
 *    2026-08-03. Un lector de pantalla anunciaba "pestaña, controla…" y no
 *    encontraba nada que controlar.
 * 2. Un `<button>` que navega no es un enlace: no se podía abrir una sección
 *    con ⌘-clic ni con el botón central, ni copiar su dirección, ni verla en la
 *    barra de estado al pasar por encima.
 *
 * Con enlaces desaparecen las dos cosas, y el estado activo se marca con
 * `aria-current="page"`, que es además lo que se anuncia. El aspecto es
 * idéntico: la hoja de estilos replica el de `Tabs.module.css`.
 *
 * Se usa `Link` y no `NavLink` a propósito: `NavLink` pone su PROPIO
 * `aria-current` comparando la ruta, que competiría con el que se deriva del
 * prop `active`. Con dos fuentes para el mismo atributo, cuál gana depende del
 * orden en que el primitivo esparce las props — no es algo que deba decidirse
 * por accidente. El prop `active` ya lo pasan las cuatro páginas y es la única
 * fuente de verdad del subrayado.
 */
export function ConfigTabsNav({ active }: ConfigTabsNavProps) {
  return (
    <nav className={styles.nav} aria-label="Secciones de configuración">
      {TABS.map((tab) => (
        <Link
          key={tab.value}
          to={tab.to}
          className={styles.link}
          aria-current={tab.value === active ? 'page' : undefined}
        >
          {tab.label}
        </Link>
      ))}
    </nav>
  );
}
