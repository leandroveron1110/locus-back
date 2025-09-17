import { SetMetadata } from '@nestjs/common';
import { AccessStrategyEnum } from './access-strategy.enum';
import { ACCESS_STRATEGY_KEY } from 'src/common/constants/rbac.constants';


export const AccessStrategy = (strategy: AccessStrategyEnum) =>
  SetMetadata(ACCESS_STRATEGY_KEY, strategy);