export type NotificationCategory =
  | "ORDER"
  | "PRODUCT"
  | "PROMOTION"
  | "SYSTEM";

export type NotificationPriority = "LOW" | "MEDIUM" | "HIGH";

export interface INotification {
  /** ID único generado por el servidor */
  id: string;

  /** Categoría general del evento */
  category: NotificationCategory;

  /** Subtipo o acción específica dentro de la categoría */
  type: string;

  /** Mensaje principal visible */
  title: string;

  /** Descripción o detalle extendido */
  message: string;

  /** Fecha y hora en formato ISO */
  timestamp: string;

  /** Usuario o negocio que recibe la notificación */
  recipientId: string;

  /** Prioridad de la notificación */
  priority?: NotificationPriority;
}
