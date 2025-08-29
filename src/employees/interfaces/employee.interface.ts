import { BusinessEmployeeRole, DeliveryEmployeeRole } from '@prisma/client';

export interface IBusinessEmployee {
  id: string;
  userId: string;
  businessId: string;
  role: BusinessEmployeeRole;
  permissions?: string[];
}

export interface IDeliveryEmployee {
  id: string;
  userId: string;
  deliveryCompanyId: string;
  role: DeliveryEmployeeRole;
  permissions?: string[];
}
