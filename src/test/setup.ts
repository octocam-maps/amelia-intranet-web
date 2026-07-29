import '@testing-library/jest-dom/vitest';

/**
 * jsdom no implementa `ResizeObserver`. `@radix-ui/react-switch` lo usa para
 * medir el thumb — no importaba hasta ahora porque ningún test anterior
 * renderizaba un componente con `Switch` (`StaffForm` es el primero, en modo
 * edición). Sin este stub, cualquier test que monte un `Switch` de Radix
 * revienta con `ReferenceError: ResizeObserver is not defined` antes de
 * llegar a la aserción — no es un fallo del componente, es un hueco del
 * entorno de test.
 */
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;
