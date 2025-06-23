// src/auth/auth.controller.ts
import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth') // Las rutas de este controlador comenzarán con /auth
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login') // Ruta para el login: /auth/login
  @HttpCode(HttpStatus.OK) // Devuelve 200 OK para un login exitoso
  async login(@Body() loginDto: LoginDto): Promise<{ accessToken: string }> {
    return this.authService.login(loginDto);
  }
}