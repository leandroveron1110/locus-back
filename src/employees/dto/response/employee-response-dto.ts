import { PermissionEnum } from '@prisma/client';

export class EmployeeOverrideDto {
  permission!: PermissionEnum;
  allowed!: boolean;

  static fromPrisma(override: {
    permission: PermissionEnum;
    allowed: boolean;
  }): EmployeeOverrideDto {
    const dto = new EmployeeOverrideDto();

    dto.permission = override.permission;
    dto.allowed = override.allowed;

    return dto;
  }

  static fromPrismaArray(
    overrides: {
      permission: PermissionEnum;
      allowed: boolean;
    }[],
  ): EmployeeOverrideDto[] {
    return overrides.map(EmployeeOverrideDto.fromPrisma);
  }
}

export class EmployeeRoleDto {
  id!: string;
  name!: string;
  permissions!: PermissionEnum[];

  static fromPrisma(role: {
    id: string;
    name: string;
    permissions: PermissionEnum[];
  }): EmployeeRoleDto {
    const dto = new EmployeeRoleDto();

    dto.id = role.id;
    dto.name = role.name;
    dto.permissions = role.permissions;

    return dto;
  }
}

export class EmployeePositionDto {
  id!: string;
  name!: string;

  static fromPrisma(position: {
    id: string;
    name: string;
  }): EmployeePositionDto {
    const dto = new EmployeePositionDto();

    dto.id = position.id;
    dto.name = position.name;

    return dto;
  }
}

export class EmployeeResponseDto {
  id!: string;

  businessId!: string;
  userId!: string | null;

  firstName!: string;
  lastName!: string;
  phone!: string | null;

  active!: boolean;

  paymentType!: string;
  paymentRate!: string;

  username!: string | null;

  position!: EmployeePositionDto | null;

  role!: EmployeeRoleDto | null;

  overrides!: EmployeeOverrideDto[];

  static fromPrisma(data: any): EmployeeResponseDto {
    const dto = new EmployeeResponseDto();

    dto.id = data.id;

    dto.businessId = data.businessId;
    dto.userId = data.userId;

    dto.firstName = data.firstName;
    dto.lastName = data.lastName;
    dto.phone = data.phone;

    dto.active = data.active;

    dto.paymentType = data.paymentType;
    dto.paymentRate = data.paymentRate.toString();

    dto.username = data.username;

    dto.position = data.position
      ? EmployeePositionDto.fromPrisma(data.position)
      : null;

    dto.role = data.role ? EmployeeRoleDto.fromPrisma(data.role) : null;

    dto.overrides = data.overrides
      ? EmployeeOverrideDto.fromPrismaArray(data.overrides)
      : [];

    return dto;
  }

  static fromPrismaArray(dataArray: any[]): EmployeeResponseDto[] {
    return dataArray.map(EmployeeResponseDto.fromPrisma);
  }
}
