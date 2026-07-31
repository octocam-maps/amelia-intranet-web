/** Contrato verificado contra
 * `amelia-intranet-back/src/features/onboarding/infrastructure/schemas.py`
 * (`ManualDTO`). `content_hash` NO viaja: es el registro de integridad interno. */

export interface ManualDTO {
  id: string;
  title: string;
  version: number;
  url: string | null;
  required_in_onboarding: boolean;
  acknowledged: boolean;
}

export interface ManualsLibraryDTO {
  manuals: ManualDTO[];
}
