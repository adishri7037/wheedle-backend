import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as crypto from 'crypto';

// Polyfill global crypto for older Node.js versions on the server
if (typeof global.crypto === 'undefined') {
  (global as any).crypto = (crypto as any).webcrypto || crypto;
}

// Explicitly load .env file before anything else
dotenv.config();

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.enableCors({
    origin: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  app.setGlobalPrefix('py/api');

  const port = process.env.PORT || 5000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}/py/api`);
}
bootstrap();
