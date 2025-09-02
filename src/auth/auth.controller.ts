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

  // -------------------------------
  // Registro (signup)
  // -------------------------------
  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    return this.authService.create(createUserDto);
  }

  // -------------------------------
  // Login cliente
  // -------------------------------
  @Post('login/client')
  async loginClient(@Body() loginDto: LoginDto) {
    return this.authService.loginClient(loginDto);
  }

  // -------------------------------
  // Login negocio (dueño o empleado)
  // -------------------------------
  @Post('login/business')
  async loginBusiness(@Body() loginDto: Omit<LoginDto, 'role'>) {
    return this.authService.loginBusiness(loginDto);
  }

  // -------------------------------
  // Login cadetería (dueño o empleado)
  // -------------------------------
  @Post('login/delivery')
  async loginDelivery(@Body() loginDto: Omit<LoginDto, 'role'>) {
    return this.authService.loginDelivery(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMe(@User() user: any): Promise<LoginResponseDto> {
    return this.authService.getMe(user.id);
  }
}
