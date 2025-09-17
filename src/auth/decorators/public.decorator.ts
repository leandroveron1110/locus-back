// src/auth/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { IS_PUBLIC_KEY } from 'src/common/constants/rbac.constants';

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
