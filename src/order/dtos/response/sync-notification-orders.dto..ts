import { INotification } from "src/common/lib/notification.factory";

interface IOrderPending {
  id: string;
  businessId: string;
  customerName: string;
  createdAt: string;
  total: String;
}

export interface SyncNotificationResponse {
  newOrders: IOrderPending[];
}

export interface SyncNotificationUserResponse {
  notification: INotification[]
}
