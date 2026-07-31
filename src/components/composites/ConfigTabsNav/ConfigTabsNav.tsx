import { useNavigate } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs';

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
 * el marcado. "Onboarding" ya tiene página real — deja de mostrarse
 * deshabilitada.
 *
 * "Plantillas de correo" (migración backend 041) se suma aquí y NO como una
 * pantalla aislada: es configuración de la intranet, del mismo tipo que los
 * festivos o los tipos de ausencia, y el admin espera encontrarla donde ya está
 * el resto.
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
      </TabsList>
    </Tabs>
  );
}
