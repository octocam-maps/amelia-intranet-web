import { apiClient } from '@/lib/http/api-client';
import type { Manual } from '../domain/models';
import type { ManualsLibraryDTO } from './dtos';

export const manualsApiAdapter = {
  async list(): Promise<Manual[]> {
    // Ya llega ordenado (obligatorios primero, luego por orden de lectura) — no se
    // reordena aquí.
    const dto = await apiClient<ManualsLibraryDTO>('/manuals');
    return dto.manuals.map((manual) => ({
      id: manual.id,
      title: manual.title,
      version: manual.version,
      url: manual.url,
      requiredInOnboarding: manual.required_in_onboarding,
      acknowledged: manual.acknowledged,
    }));
  },
};
