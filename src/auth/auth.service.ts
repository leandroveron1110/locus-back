// src/auth/auth.service.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { User, PermissionEnum } from '@prisma/client';
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
      businesses: [],
      deliveries: [],
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

    if (!user || user.role !== 'CLIENT') {
      throw new UnauthorizedException('Credenciales inválidas para cliente.');
    }

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
      businesses: [],
      deliveries: [],
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

    // 1️⃣ Negocios del usuario
    const [ownedBusinesses, employeeBusinesses] = await Promise.all([
      this.businessService.findByOwner(user.id),
      this.employeesService.findBusinessesByUser(user.id), // <-- asegúrate de que incluya role y overrides
    ]);

    if (ownedBusinesses.length === 0 && employeeBusinesses.length === 0) {
      throw new UnauthorizedException(
        'No tiene negocios asignados ni empleo en ninguno.',
      );
    }

    // 2️⃣ Construimos businesses con permisos efectivos
    const businesses = [
      ...ownedBusinesses.map((b) => ({
        id: b.id,
        role: 'OWNER' as const,
        permissions: Object.values(PermissionEnum), // dueño tiene todos los permisos
      })),
      ...employeeBusinesses.map((e) => {
        const rolePermissions = e.role?.permissions ?? [];
        const permissionsSet = new Set(rolePermissions);

        e.overrides?.forEach((o) => {
          if (o.allowed) permissionsSet.add(o.permission);
          else permissionsSet.delete(o.permission);
        });

        return {
          id: e.businessId,
          role: e.role?.name ?? 'UNASSIGNED',
          permissions: Array.from(permissionsSet),
        };
      }),
    ];

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
      businesses,
      deliveries: [],
    };

    const userDto = LoginResponseDto.fromPrisma(user);
    // Correcto: asignamos el array de negocios al objeto DTO
    userDto.businesses = businesses;

    return {
      user: userDto, // Correcto: devolvemos el objeto DTO completo
      accessToken: this.jwtService.sign(payload),
    };
  }

  // -------------------------------
  // LOGIN DELIVERY
  // -------------------------------
  async loginDelivery(
    loginDto: Omit<LoginDto, 'role'>,
  ): Promise<{ user: LoginResponseDto; accessToken: string }> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas.');
    }

    const ownedDeliveries = await this.deliveryService.findCompaniesByOwner(
      user.id,
    );

    if (!ownedDeliveries.length) {
      throw new UnauthorizedException('No tiene acceso a cadeterías.');
    }

    const deliveries = ownedDeliveries.map((d) => ({
      id: d.id,
      role: 'OWNER' as const,
      permissions: [], // Aquí podrías aplicar permisos si existen en delivery
    }));

    const payload: JwtPayload = {
      sub: user.id,
      rol: user.role,
      email: user.email,
      businesses: [],
      deliveries,
    };

    const userDto = LoginResponseDto.fromPrisma(user);
    userDto.deliveries = deliveries;

    return {
      user: userDto,
      accessToken: this.jwtService.sign(payload),
    };
  }

  async loginAdmin(loginDto: LoginDto){
  const user = await this.validateUser(loginDto.email, loginDto.password);

  if (!user || user.role !== 'ADMIN') {
    throw new UnauthorizedException('Credenciales inválidas para admin.');
  }

  const payload: JwtPayload = {
    sub: user.id,
    rol: user.role,
    email: user.email,
    businesses: [],
    deliveries: [],
  };

  const userDto = LoginResponseDto.fromPrisma(user);

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
