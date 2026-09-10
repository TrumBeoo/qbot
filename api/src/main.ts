import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { HttpErrorFilter } from './common/http-error.filter';

/**
 * Diem vao cua API TypeScript (pha 04).
 *
 * Chay o cong 4000, khong phai 5555: ca hai backend cung song trong giai
 * doan port. Pha 05 doi VITE_API_BASE_URL sang cong nay roi xoa Flask.
 */
async function bootstrap(): Promise<void> {
  // Bat buoc co truoc khi phuc vu request nao: thieu JWT_SECRET thi ban
  // Python cu am tham dung chuoi hardcode nam trong repo.
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required - refusing to start with a default secret');
  }
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is required');
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors({
    // Cung bien CORS_ORIGINS voi Flask, cung dinh dang ngan cach dau phay.
    origin: (process.env.CORS_ORIGINS ?? 'http://localhost:3000,http://localhost:5173')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  // Phai dat truoc pipe: loi validation cung phai qua filter nay.
  app.useGlobalFilters(new HttpErrorFilter());

  app.useGlobalPipes(
    new ValidationPipe({
      // Bo field khong khai bao trong DTO: client khong the ghi de cot
      // ma API khong co y cho sua.
      whitelist: true,
      transform: true,
    }),
  );

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port, '0.0.0.0');
  new Logger('bootstrap').log(`API TypeScript dang chay tren cong ${port}`);
}

void bootstrap();
