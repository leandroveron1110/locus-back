// src/auth/auth.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import {
  BusinessEmployeeRole,
  DeliveryEmployeeRole,
  User,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserService } from 'src/users/interfaces/User-service.interface';
import { LoginResponseDto } from './dto/response/login.dto';
import { IAuthService } from './interfaces/Auth-service.interface';
import { CreateUserDto } from 'src/users/dto/Request/create-user.dto';
import { IDeliveryService } from 'src/delivery/interfaces/delivery-service.interface';
import { IBusinessService } from 'src/business/interfaces/business.interface';
import { EmployeesService } from 'src/employees/services/employees.service';

@Injectable()
export class AuthService implements IAuthService {
  constructor(
    @Inject(TOKENS.IUserService)
    private usersService: IUserService,

    private jwtService: JwtService,

    @Inject(TOKENS.IDeliveryService)
    private deliveryService: IDeliveryService,

    @Inject(TOKENS.IBusinessService)
    private businessService: IBusinessService,

    private employeesService: EmployeesService,
  ) {}

  // -------------------------------
  // Validación base de usuario
  // -------------------------------
  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersService.findByEmail(email);

    if (user && (await bcrypt.compare(password, user.passwordHash))) {
      const { passwordHash, ...result } = user;
      return result as User;
    }
    return null;
  }

  // -------------------------------
  // Crear usuario (registro)
  // -------------------------------
  async create(
    data: CreateUserDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    const user = await this.usersService.create(data);

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
    };

    const userDto = LoginResponseDto.fromPrisma(user);

    return {
      user: userDto,
      accessToken: this.jwtService.sign(payload),
    };
  }

  // -------------------------------
  // LOGIN CLIENT
  // -------------------------------
  async loginClient(
    loginDto: LoginDto,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    console.log(user);
    console.log('dto', loginDto);

    if (!user || user.role !== 'CLIENT') {
      throw new UnauthorizedException('Credenciales inválidas para cliente.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
    };

    const userDto = LoginResponseDto.fromPrisma(user);

    return {
      user: userDto,
      accessToken: this.jwtService.sign(payload),
    };
  }

  // -------------------------------
  // LOGIN BUSINESS (dueño o empleado)
  // -------------------------------
  async loginBusiness(
    loginDto: Omit<LoginDto, 'role'>,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const ownedBusinesses = await this.businessService.findByOwner(user.id);
    const employeeBusinesses =
      await this.employeesService.findBusinessEmployees(user.id);

    if (!ownedBusinesses.length && !employeeBusinesses.length) {
      throw new UnauthorizedException('No tiene acceso a negocios.');
    }

    const businesses = [
      ...ownedBusinesses.map((b) => ({
        id: b.id,
        role: 'OWNER' as const, // 👈 asegura que TS lo lea como literal
        permissions: [] as string[],
      })),
      ...employeeBusinesses.map((e) => ({
        id: e.businessId,
        role: e.role as BusinessEmployeeRole,
        permissions: (e.permissions as string[]) || [],
      })),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
      businesses,
    };

    let userDto = LoginResponseDto.fromPrisma(user);
    userDto.businesses = businesses;

    return {
      user: userDto,
      accessToken: this.jwtService.sign(payload),
    };
  }

  // -------------------------------
  // LOGIN DELIVERY (dueño o empleado)
  // -------------------------------
  async loginDelivery(
    loginDto: Omit<LoginDto, 'role'>,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    console.log("loginDto", loginDto)
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const ownedDeliveries = await this.deliveryService.findCompaniesByOwner(
      user.id,
    );
    const employeeDeliveries =
      await this.employeesService.findDeliveryEmployees(user.id);

    if (!ownedDeliveries.length && !employeeDeliveries.length) {
      throw new UnauthorizedException('No tiene acceso a cadeterías.');
    }

    const deliveries = [
      ...ownedDeliveries.map((d) => ({
        id: d.id,
        role: 'OWNER' as const,
        permissions: [] as string[],
      })),
      ...employeeDeliveries.map((e) => ({
        id: e.deliveryCompanyId,
        role: e.role as DeliveryEmployeeRole,
        permissions: (e.permissions as string[]) || [],
      })),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
      deliveries,
    };

    const userDto = LoginResponseDto.fromPrisma(user);
    userDto.deliveries = deliveries;

    return {
      user: userDto,
      accessToken: this.jwtService.sign(payload),
    };
  }

  // -------------------------------
  // Obtener perfil del usuario
  // -------------------------------
  async getMe(userId: string): Promise<LoginResponseDto> {
    const user = await this.usersService.findById(userId);
    return LoginResponseDto.fromPrisma(user);
  }
}
