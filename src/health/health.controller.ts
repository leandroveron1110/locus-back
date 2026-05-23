// src/health/health.controller.ts

import {
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { Public } from 'src/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Get('ping')
  @Public()
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  @Header('Pragma', 'no-cache')
  @Header('Expires', '0')
  @Header('Surrogate-Control', 'no-store')
  ping() {
    return {
      ok: true,
      timestamp: Date.now(),
    };
  }
}