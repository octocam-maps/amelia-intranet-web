import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import styles from './AppLayout.module.css';

/**
 * Shell responsive (RF §8): en escritorio el sidebar es la columna fija de
 * siempre; bajo el breakpoint móvil (`Sidebar.module.css`, 768px — mismo
 * corte que `LoginPage.module.css`) pasa a ser un drawer fuera del flujo,
 * controlado por el botón hamburguesa de la Topbar. El estado vive acá
 * porque Sidebar y Topbar son hermanos (ninguno puede controlarlo solo).
 */
export function AppLayout() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const location = useLocation();
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const sidebarRef = useRef<HTMLElement>(null);
  const isFirstRender = useRef(true);

  // Al navegar a una ruta el drawer se cierra — no debe sobrevivir a un
  // cambio de pantalla.
  useEffect(() => {
    setIsMobileNavOpen(false);
  }, [location.pathname]);

  // Escape cierra el drawer, igual que el clic en el overlay.
  useEffect(() => {
    if (!isMobileNavOpen) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsMobileNavOpen(false);
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileNavOpen]);

  // Gestión de foco: al abrir entra al primer enlace del drawer; al cerrar
  // vuelve al botón hamburguesa que lo disparó. Se salta en el primer
  // render para no robarle el foco a la página al cargarla.
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    if (isMobileNavOpen) {
      sidebarRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    } else {
      menuButtonRef.current?.focus();
    }
  }, [isMobileNavOpen]);

  return (
    <div className={styles.shell}>
      <Sidebar navRef={sidebarRef} isOpen={isMobileNavOpen} />

      {/* Overlay del drawer — empieza debajo de la topbar (top: 4rem) a
          propósito: así el botón hamburguesa queda siempre clicable, sin
          necesitar trucos de z-index frente al propio overlay. */}
      {isMobileNavOpen && (
        <div
          className={styles.overlay}
          aria-hidden="true"
          onClick={() => setIsMobileNavOpen(false)}
        />
      )}

      <div className={styles.content}>
        <Topbar
          menuButtonRef={menuButtonRef}
          isMobileNavOpen={isMobileNavOpen}
          onToggleMobileNav={() => setIsMobileNavOpen((open) => !open)}
        />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
