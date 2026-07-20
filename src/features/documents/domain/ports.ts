import type {
  Document,
  DriveSyncRun,
  ListDocumentsParams,
  UploadDocumentInput,
} from './models';

export interface DocumentsRepository {
  list(params?: ListDocumentsParams): Promise<Document[]>;
  /** Sube el binario a Drive + inserta metadatos (admin-only en el backend) —
   * multipart, no JSON. */
  upload(input: UploadDocumentInput): Promise<Document>;
  /** Descarga el binario como blob — el backend hace streaming server-side,
   * nunca redirige a una URL de Drive (oculta su existencia + aplica RGPD
   * antes de soltar el byte). */
  download(id: string): Promise<Blob>;
  /** Soft-delete SOLO en Postgres — no borra el archivo maestro en Drive. */
  remove(id: string): Promise<void>;
  /** Dispara la conciliación Drive → Postgres (admin-only); devuelve el
   * resumen de la corrida. */
  sync(): Promise<DriveSyncRun>;
}
