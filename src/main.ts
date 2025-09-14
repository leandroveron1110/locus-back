import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as os from 'os';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

    // Leer CORS desde variable de entorno y convertir a array
  const corsOrigins = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',')
    : [];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT) || 3001;
  await app.listen(port);

  // Obtener IP local de red (LAN)
  const getLocalNetworkIp = () => {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const iface of interfaces[name]!) {
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
    return 'localhost';
  };

  const localIp = getLocalNetworkIp();

  console.log('');
  console.log('🚀 NestJS server running at:');
  console.log(`   - Local:   http://localhost:${port}`);
  console.log(`   - Network: http://${localIp}:${port}`);
  console.log(`   - Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log('');
}

bootstrap();
