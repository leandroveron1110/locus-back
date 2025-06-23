// src/auth/auth.module.ts
import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport'; // Módulo de Passport
import { JwtModule } from '@nestjs/jwt';           // Módulo para JWT
import { ConfigModule, ConfigService } from '@nestjs/config'; // Para variables de entorno
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module'; // Importa UsersModule para que AuthService y JwtStrategy lo usen
import { JwtStrategy } from './jwt.strategy';
// Importa tus Guards
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { AdminSecretGuard } from './guards/admin-secret.guard';

@Module({
  imports: [
    // 1. Cargar variables de entorno:
    // Si ya tienes ConfigModule.forRoot({ isGlobal: true }) en tu AppModule,
    // NO lo repitas aquí. Simplemente importa ConfigModule.
    // Si no es global, lo pondrías aquí: ConfigModule.forRoot().
    ConfigModule,

    // 2. Importar UsersModule:
    // Permite que AuthService y JwtStrategy accedan a UsersService
    UsersModule,

    // 3. Configurar PassportModule:
    // Define la estrategia 'jwt' como la predeterminada para Passport
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // 4. Configurar JwtModule para firmar y verificar tokens:
    // Usamos registerAsync para inyectar ConfigService y obtener JWT_SECRET.
    JwtModule.registerAsync({
      imports: [ConfigModule], // Necesario para inyectar ConfigService
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Obtiene el secreto de las variables de entorno
        signOptions: { expiresIn: '60m' }, // Opciones de firma: el token expira en 60 minutos
      }),
      inject: [ConfigService], // Especifica qué servicios inyectar en useFactory
    }),
  ],
  controllers: [AuthController], // Tus controladores de autenticación
  providers: [
    AuthService,
    JwtStrategy, // Tu estrategia de JWT
    // Provee los Guards para que puedan ser usados con @UseGuards()
    JwtAuthGuard,
    RolesGuard,
    AdminSecretGuard,
  ],
  exports: [
    AuthService, // Exporta AuthService si otros módulos necesitan sus métodos (ej. para registrarse)
    // Exporta los Guards para que puedan ser utilizados en otros módulos (ej. UsersModule)
    JwtAuthGuard,
    RolesGuard,
    AdminSecretGuard,
    // También puedes exportar JwtModule y PassportModule si otros módulos los necesitan directamente
    JwtModule,
    PassportModule,
  ],
})
export class AuthModule {}