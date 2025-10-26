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
