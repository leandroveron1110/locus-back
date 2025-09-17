// src/common/enums/business-roles.enum.ts
export enum BusinessRoles {
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
  STOCK = 'STOCK',
  WAITER = 'WAITER',
  // etc, los que uses en tu BD
}

export enum EmployeePermissions {
  CREATE_EMPLOYEE = "CREATE_EMPLOYEE",
  EDIT_EMPLOYEE = "EDIT_EMPLOYEE",
  DELETE_EMPLOYEE = "DELETE_EMPLOYEE",
}

// permissions/products.ts
export enum ProductPermissions {
  CREATE_PRODUCT = "CREATE_PRODUCT",
  EDIT_PRODUCT = "EDIT_PRODUCT",
  DELETE_PRODUCT = "DELETE_PRODUCT",
  MANAGE_PRODUCTS = "MANAGE_PRODUCTS", // ya lo tenías
}

// permissions/business.ts
export enum BusinessPermissions {
  CREATE_BUSINESS = "CREATE_BUSINESS",
  EDIT_BUSINESS = "EDIT_BUSINESS",
  DELETE_BUSINESS = "DELETE_BUSINESS",

  VIEW_DASHBOARD = "VIEW_DASHBOARD",
  CLOSE_CASH_REGISTER = "CLOSE_CASH_REGISTER",
  VIEW_REPORTS = "VIEW_REPORTS",
  MANAGE_DELIVERY_ZONES = "MANAGE_DELIVERY_ZONES",
}

// permissions/orders.ts
export enum OrderPermissions {
  VIEW_ORDERS = "VIEW_ORDERS",
  CREATE_ORDER = "CREATE_ORDER",
  EDIT_ORDER = "EDIT_ORDER",
  CANCEL_ORDER = "CANCEL_ORDER",
  PROCESS_ORDER = "PROCESS_ORDER",
  DELIVER_ORDER = "DELIVER_ORDER",
  COMPLETE_ORDER = "COMPLETE_ORDER",
}