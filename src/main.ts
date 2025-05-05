import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: [
      'https://prisism-frontend.vercel.app',
      'http://localhost:3000',
      'https://prisism.com',
      'https://www.prisism.com',
    ],
    credentials: true,
  });

  await app.listen(3001);
}
bootstrap();
