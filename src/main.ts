import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as helmet from 'helmet';
import * as compression from 'compression';
import * as path from 'path';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.use(helmet.default());
  app.use(compression());
  app.useStaticAssets(path.resolve(process.env.UPLOAD_DIR || 'uploads'), {
    prefix: '/uploads/',
  });

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  });

  app.setGlobalPrefix('api/v1');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const config = new DocumentBuilder()
    .setTitle('HealthSphere API')
    .setDescription('Unified Health Intelligence Platform — Full REST API with AI/ML capabilities')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Patients', 'Patient profiles and medical timelines')
    .addTag('AI Assistant', 'Gemini-powered AI health chat and analysis')
    .addTag('AI Models', 'Hugging Face medical ML predictions')
    .addTag('Documents', 'OCR digitization and Cloudinary storage')
    .addTag('Medications', 'Medication reminders and interaction checks')
    .addTag('Symptoms', 'Symptom logging and AI triage')
    .addTag('Reports', 'AI-generated health reports')
    .addTag('Notifications', 'User notification management')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3001;
  await app.listen(port);
  console.log(`🏥 HealthSphere API running on http://localhost:${port}`);
  console.log(`📚 Swagger docs at http://localhost:${port}/api/docs`);
  console.log(`🤖 AI features: Gemini Chat + HF Models (use real keys for production)`);
}
bootstrap();
