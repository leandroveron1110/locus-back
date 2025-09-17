// src/common/enums/permissions-manager.ts

import { BusinessPermissions, EmployeePermissions, OrderPermissions, ProductPermissions } from "./rolees-permissions";


// Combina todos los enums en un solo objeto.
export const Permissions = {
  ...EmployeePermissions,
  ...ProductPermissions,
  ...BusinessPermissions,
  ...OrderPermissions,
} as const;

// Crea un tipo que sea la unión de todos los enums.
export type PermissionsType =
  | EmployeePermissions
  | ProductPermissions
  | BusinessPermissions
  | OrderPermissions;

// Genera un array con todos los valores de los permisos.
export const ALL_PERMISSIONS_ARRAY: PermissionsType[] = [
  ...Object.values(EmployeePermissions),
  ...Object.values(ProductPermissions),
  ...Object.values(BusinessPermissions),
  ...Object.values(OrderPermissions),
];

// Opcional: una función para verificar si un valor es un permiso válido.
export function isValidPermission(permission: any): permission is PermissionsType {
  return ALL_PERMISSIONS_ARRAY.includes(permission);
}