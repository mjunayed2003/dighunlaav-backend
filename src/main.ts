import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Enable CORS for frontend
  await app.listen(process.env.PORT ?? 3001); // Run on 3001 so Next.js can run on 3000
}
bootstrap();
