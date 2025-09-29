import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseInterceptor } from './common/interceptors/response.interceptor';

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

    // 1. Aplicar el Filtro de Excepción (para errores)
  app.useGlobalFilters(new HttpExceptionFilter());

  // 2. Aplicar el Interceptor de Respuesta (para éxitos)
  app.useGlobalInterceptors(new ResponseInterceptor());

  const port = Number(process.env.PORT) || 3001;

  // 🔑 Escuchar en 0.0.0.0 para aceptar conexiones desde otros dispositivos
  await app.listen(port, '0.0.0.0');

  const networkInterfaces = require('os').networkInterfaces();
  const addresses: string[] = [];

  for (const key in networkInterfaces) {
    for (const net of networkInterfaces[key]) {
      if (net.family === 'IPv4' && !net.internal) {
        addresses.push(net.address);
      }
    }
  }

  console.log('');
  console.log('🚀 NestJS server running at:');
  console.log(`   - Local:   http://localhost:${port}`);
  addresses.forEach((addr) =>
    console.log(`   - Network: http://${addr}:${port}`)
  );
  console.log(`   - Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log('');
}

bootstrap();
