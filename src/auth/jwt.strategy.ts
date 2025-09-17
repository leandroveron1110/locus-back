// src/auth/jwt.strategy.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { TOKENS } from 'src/common/constants/tokens';
import { IUserService, BusinessEmployeeWithRole } from 'src/users/interfaces/User-service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @Inject(TOKENS.IUserService)
    private usersService: IUserService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findAuthByUserId(payload.sub);

    if (!user) {
      throw new UnauthorizedException(
        'Token inválido: usuario no encontrado o eliminado.',
      );
    }

    // Procesamos roles de negocio y permisos finales
    const businessRoles = user.businessEmployee?.map((be: BusinessEmployeeWithRole) => {
      const roleName = be.role?.name ?? 'EMPLOYEE';
      const rolePermissions = be.role?.permissions ?? [];

      // Aplicamos overrides
      const overridePermissions = be.overrides
        ?.filter((o) => o.allowed)
        .map((o) => o.permission) ?? [];

      // Permisos revocados
      const revokedPermissions = be.overrides
        ?.filter((o) => !o.allowed)
        .map((o) => o.permission) ?? [];

      // Combinamos y eliminamos permisos revocados
      const permissions = rolePermissions
        .concat(overridePermissions)
        .filter((p) => !revokedPermissions.includes(p));

      return {
        businessId: be.businessId,
        role: roleName,
        permissions,
      };
    });

    // Para delivery seguimos usando lo que esté en deliveryEmployee
    const deliveryRoles = user.deliveryEmployee?.map((de) => ({
      deliveryCompanyId: de.deliveryCompanyId,
      role: de.role,
      permissions: de.permissions || [],
    }));

    return {
      id: user.id,
      email: user.email,
      rol: user.role,
      businesses: businessRoles,
      deliveryRoles,
    };
  }
}
