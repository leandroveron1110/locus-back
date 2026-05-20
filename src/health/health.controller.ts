// src/health/health.controller.ts
import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  
  @Get('ping')
  @HttpCode(HttpStatus.OK)
  @Public()
  ping() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}