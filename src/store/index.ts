import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { type AuthSlice, createAuthSlice } from '@/features/auth/store/auth.slice';

// Fase 1: un único slice (auth). Futuras fases añaden slices aquí siguiendo
// el mismo patrón (createXSlice + StateCreator con middleware immer).
export type StoreState = AuthSlice;

export const useStore = create<StoreState>()(
  immer((...a) => ({
    ...createAuthSlice(...a),
  }))
);
