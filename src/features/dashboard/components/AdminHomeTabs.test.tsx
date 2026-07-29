import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, expect, it } from 'vitest';
import { AdminHomeTabs } from './AdminHomeTabs';

/** `AbsenceApprovalList`, dentro de la pestaña Ausencias, consulta el catálogo
 *  de tipos de ausencia — de ahí el QueryClient. `retry: false` para que un
 *  fetch fallido no alargue el test. */
function renderTabs() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <AdminHomeTabs pendingAbsenceRequests={[]} metricsKpis={undefined} isMetricsLoading={false} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

/** Radix Tabs cambia de pestaña con `mouseDown`, no con `click` — ya
 *  documentado en `AbsenceRequestsTabs.test.tsx`. */
function abrirPestana(nombre: RegExp) {
  fireEvent.mouseDown(screen.getByRole('tab', { name: nombre }));
}

describe('AdminHomeTabs — composición de las tres pestañas', () => {
  // U9: la Fase 4 (Documentos + Drive) está en producción — hay página de
  // administración, subida manual y "Sincronizar ahora" contra Drive. La
  // pestaña seguía anunciándola como futura, igual que el "próximamente" de
  // Equipo en el onboarding: un control muerto que parece una avería.
  it('la pestaña Documentos no anuncia la Fase 4 como futura', () => {
    renderTabs();
    abrirPestana(/documentos/i);

    expect(screen.queryByText(/próximamente/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Fase 4/i)).not.toBeInTheDocument();
  });

  it('la pestaña Documentos lleva a la gestión real', () => {
    renderTabs();
    abrirPestana(/documentos/i);

    const enlace = screen.getByRole('link', { name: /documentos/i });
    expect(enlace).toHaveAttribute('href', '/administracion/documentos');
  });

  // U11: solo la pestaña "Ausencias" anidaba su propia Card dentro de la Card
  // de AdminHomeTabs; sus dos hermanas son divs planos. Doble marco y doble
  // sombra visibles en una sola pestaña, y su <h3> quedaba al mismo nivel que
  // el <h3> del contenedor que lo envuelve.
  it('ninguna pestaña anida una Card dentro de la Card del contenedor', () => {
    const { container } = renderTabs();

    // `Card` es el único componente que aplica un borde con sombra; se cuentan
    // sus raíces reales en el DOM.
    for (const nombre of [/ausencias/i, /control horario/i, /documentos/i]) {
      abrirPestana(nombre);
      const panel = screen.getByRole('tabpanel');
      expect(panel.querySelectorAll('[data-slot="card"]')).toHaveLength(0);
    }

    // Y sigue habiendo exactamente UNA Card: la del contenedor.
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(1);
  });

  it('el título de la bandeja es subordinado al del contenedor, no su hermano', () => {
    renderTabs();

    expect(screen.getByRole('heading', { level: 3, name: /resumen operativo/i })).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { level: 4, name: /solicitudes de ausencia por aprobar/i })
    ).toBeInTheDocument();
  });
});
