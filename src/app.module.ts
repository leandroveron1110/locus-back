// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config'; // Importa ConfigModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module'; // ¡Importa tu nuevo AuthModule!
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    // Carga las variables de entorno desde un archivo .env
    // isGlobal: true hace que ConfigService esté disponible en toda la aplicación
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule, // Agrega AuthModule a los imports
    UsersModule, // UsersModule debe estar aquí y exportar UsersService
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}