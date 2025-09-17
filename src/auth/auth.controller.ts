// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Inject,
  BadRequestException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LoginResponseDto } from './dto/response/login.dto';
import { User } from './decorators/user.decorator';
import { TOKENS } from 'src/common/constants/tokens';
import { CreateUserDto } from 'src/users/dto/Request/create-user.dto';
import { Public } from './decorators/public.decorator';

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
@Public()
async register(@Body() createUserDto: CreateUserDto) {
  // Si no se pasa role, se crea como CLIENT automáticamente
  if (!createUserDto.role || createUserDto.role === 'CLIENT') {
    return this.authService.create(createUserDto);
  }

  // OWNER necesita JWT_SECRET
  if (createUserDto.role === 'OWNER') {
    if (createUserDto.secretKey !== process.env.JWT_SECRET) {
      throw new BadRequestException('Clave secreta inválida para crear OWNER');
    }
  }

  // ADMIN necesita ADMIN_SECRET_KEY
  if (createUserDto.role === 'ADMIN') {
    if (createUserDto.secretKey !== process.env.ADMIN_SECRET_KEY) {
      throw new BadRequestException('Clave secreta inválida para crear ADMIN');
    }
  }

  return this.authService.create(createUserDto);
}


  // -------------------------------
  // Login cliente
  // -------------------------------
  @Post('login/client')
  @Public()
  async loginClient(@Body() loginDto: LoginDto) {
    return this.authService.loginClient(loginDto);
  }

  // -------------------------------
  // Login negocio (dueño o empleado)
  // -------------------------------
  @Post('login/business')
  @Public()
  async loginBusiness(@Body() loginDto: Omit<LoginDto, 'role'>) {
    return this.authService.loginBusiness(loginDto);
  }

  // -------------------------------
  // Login cadetería (dueño o empleado)
  // -------------------------------
  @Post('login/delivery')
  @Public()
  async loginDelivery(@Body() loginDto: Omit<LoginDto, 'role'>) {
    return this.authService.loginDelivery(loginDto);
  }

  @Get('me')
  async getMe(@User() user: any): Promise<LoginResponseDto> {
    return this.authService.getMe(user.id);
  }
}
