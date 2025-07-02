// src/auth/jwt.strategy.ts
import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from './interfaces/jwt-payload.interface'; // Importa tu interfaz de payload
import { TOKENS } from 'src/common/constants/tokens';
import { IUserService } from 'src/users/interfaces/User-service.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') { // 'jwt' es el nombre de la estrategia
 constructor(
    private configService: ConfigService,
    @Inject(TOKENS.IUserService)
    private usersService: IUserService,
  ) {
    // Obtener la clave secreta y lanzar un error si no está definida
    // Esto asegura que 'secret' sea siempre un string
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables.');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret, // Aquí 'secret' ya es garantizado un string
    });
  }

  // Este método se ejecuta DESPUÉS de que el token ha sido validado (firma y expiración).
  // El 'payload' es el objeto decodificado del token.
  async validate(payload: JwtPayload) {
    // Aquí puedes realizar validaciones adicionales, como:
    // 1. Buscar al usuario en la DB para asegurar que aún existe.
    // 2. Verificar si el rol del usuario ha cambiado desde que se emitió el token.
    const user = await this.usersService.findById(payload.sub); // 'sub' es el ID del usuario

    if (!user) {
      throw new UnauthorizedException('Token inválido: usuario no encontrado o eliminado.');
    }

    // Retorna el objeto que quieres que se adjunte a 'request.user'.
    // Este objeto estará disponible en tus controladores y guards.
    // Asegúrate de que el 'rol' que retornas aquí sea del mismo tipo que espera RolesGuard.
    return { id: user.id, email: user.email, rol: user.role };
  }
}