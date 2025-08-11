// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Get,
  Inject,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/response/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { User } from './decorators/user.decorator';
import { TOKENS } from 'src/common/constants/tokens';
import { CreateUserDto } from 'src/users/dto/Request/create-user.dto';

@Controller('auth') // Las rutas de este controlador comenzarán con /auth
export class AuthController {
  constructor(
    @Inject(TOKENS.IAuthService)
    private authService: AuthService,
  ) {}

  @Post('login') // Ruta para el login: /auth/login
  @HttpCode(HttpStatus.OK) // Devuelve 200 OK para un login exitoso
  async login(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('login/delivery') // Ruta para el login: /auth/login
  @HttpCode(HttpStatus.OK) // Devuelve 200 OK para un login exitoso
  async loginDelivery(
    @Body() loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    return this.authService.login(loginDto);
  }

  @Post('register') // Ruta para el login: /auth/login
  @HttpCode(HttpStatus.OK) // Devuelve 200 OK para un login exitoso
  async register(
    @Body() loginDto: CreateUserDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    return this.authService.create(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@User() user: any): Promise<LoginResponseDto> {
    return this.authService.getMe(user.id);
  }
}
