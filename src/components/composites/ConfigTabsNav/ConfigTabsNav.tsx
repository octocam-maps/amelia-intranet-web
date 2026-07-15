import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import styles from './ConfigTabsNav.module.css';

export type ConfigTab = 'festivos' | 'tipos-ausencia';

const TABS: { value: ConfigTab; label: string; to: string }[] = [
  { value: 'festivos', label: 'Festivos', to: '/administracion/festivos' },
  { value: 'tipos-ausencia', label: 'Tipos de ausencia', to: '/administracion/tipos-ausencia' },
];

interface ConfigTabsNavProps {
  active: ConfigTab;
}

/**
 * deck-fase6/14-festivos.png y 15-tipos-ausencia.png — "Festivos", "Tipos de
 * ausencia" y "Onboarding" comparten una misma cabecera "Configuración" con
 * pestañas subrayadas. Se comparte entre las páginas de `holidays` y
 * `absences` en vez de duplicar el marcado. "Onboarding" (16-onboarding-config.png)
 * queda fuera de esta ronda — misma convención "comingSoon" que el sidebar
 * (docs/permisos-roles.md): se muestra pero deshabilitada.
 */
export function ConfigTabsNav({ active }: ConfigTabsNavProps) {
  const navigate = useNavigate();

  return (
    <Tabs
      value={active}
      onValueChange={(value) => {
        const tab = TABS.find((t) => t.value === value);
        if (tab) navigate(tab.to);
      }}
    >
      <TabsList>
        {TABS.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
        <span className={styles.disabledTab} title="Disponible en una fase posterior">
          Onboarding
        </span>
      </TabsList>
    </Tabs>
  );
}
