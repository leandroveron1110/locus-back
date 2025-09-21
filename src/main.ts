import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

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

  console.log('');
  console.log('🚀 NestJS server running at:');
  console.log(`   - Local:   http://localhost:${port}`);
  console.log(`   - Environment: ${process.env.NODE_ENV ?? 'development'}`);
  console.log('');
}

bootstrap();
