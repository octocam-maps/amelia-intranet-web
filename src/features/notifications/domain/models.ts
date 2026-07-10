/** El backend puede añadir tipos nuevos (onboarding, documentos…) sin previo
 * aviso — se deja como string abierto en vez de un union cerrado para no
 * romper el cliente ante un tipo desconocido (se trata con ícono genérico). */
export type NotificationType = string;

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string | null;
  /** Destino de navegación al hacer click, si el backend lo envía. */
  url: string | null;
  read: boolean;
  createdAt: string;
}

export interface NotificationPage {
  items: Notification[];
  nextBefore: string | null;
}
