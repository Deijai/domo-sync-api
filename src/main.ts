import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const corsOrigins = (process.env.CORS_ORIGIN ?? '*')
    .split(',')
    .map((origin) => origin.trim());

  app.enableCors({
    origin: corsOrigins.includes('*') ? true : corsOrigins,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  const config = new DocumentBuilder()
    .setTitle('Poupa Fila DMA — API')
    .setDescription(
      'API de gestão de fichas de atendimento médico do sistema Poupa Fila DMA.\n\n' +
        '**Fluxo principal:**\n' +
        '1. Admin/operador cria um lote de fichas (especialidade, profissional, unidade, data).\n' +
        '2. Paciente visualiza fichas disponíveis pelo app mobile.\n' +
        '3. Paciente reserva uma ficha específica.\n' +
        '4. A API garante, via transação, que a mesma ficha nunca seja reservada duas vezes.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.API_PORT ?? 3333;
  await app.listen(port);
  console.log(`Application running on http://localhost:${port}`);
  console.log(`Swagger docs at http://localhost:${port}/docs`);
}
bootstrap();
