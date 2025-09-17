// src/auth/decorators/permissions.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { PERMISSIONS_KEY } from 'src/common/constants/rbac.constants';

export const Permissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
