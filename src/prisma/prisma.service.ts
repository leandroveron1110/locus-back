import { INestApplication, Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    // Conectar a la base de datos cuando el módulo se inicializa
    await this.$connect();
    console.log('Conectado a la base de datos con Prisma.');
  }

  async onModuleDestroy() {
    // Desconectar de la base de datos cuando la aplicación se cierra
    await this.$disconnect();
    console.log('Desconectado de la base de datos con Prisma.');
  }

  // Este método es opcional pero útil para asegurar que la app se cierra correctamente
  // en caso de apagarla (ej. during testing o en un ambiente serverless).
  async enableShutdownHooks(app: INestApplication) {
    process.on('beforeExit', async () => {
      await app.close();
    });
  }
}