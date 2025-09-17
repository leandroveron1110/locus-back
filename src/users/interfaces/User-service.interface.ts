import { DeliveryEmployeeRole, PermissionEnum, User, UserRole } from '@prisma/client';
import { CreateUserDto } from '../dto/Request/create-user.dto';
import { UpdateUserDto } from '../dto/Request/update-user.dto';
import { IExistenceValidator } from 'src/common/interfaces/existence-validator.interface';

export interface BusinessEmployeeWithRole {
  id: string;
  userId: string;
  businessId: string;
  roleId: string | null;
  role: {
    id: string;
    businessId: string;
    name: string;
    permissions: PermissionEnum[];
  } | null;
  overrides: {
    id: string;
    employeeId: string;
    permission: PermissionEnum;
    allowed: boolean;
  }[];
}

export interface IUserService {
  create(data: CreateUserDto): Promise<User>;
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User>;
  findAuthByUserId(userId: string): Promise<{
  id: string;
  email: string;
  role: UserRole;
  businessEmployee?: BusinessEmployeeWithRole[];
  deliveryEmployee?: {
    deliveryCompanyId: string;
    role: DeliveryEmployeeRole;
    permissions?: any;
  }[];
}>;
  findByEmail(email: string): Promise<User | null>;
  update(id: string, data: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<User>;
}

export interface IUserValidator extends IExistenceValidator {
  existBusinessAndOwner(businessId: string, owenerId: string): Promise<void>;
}
