// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { ROLES_KEY } from 'src/common/constants/rbac.constants';

export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);