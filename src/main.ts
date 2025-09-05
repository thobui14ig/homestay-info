import { NestFactory } from '@nestjs/core';
import * as bodyParser from 'body-parser'; // Import body-parser
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  const configService = app.get(ConfigService);
  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
}
bootstrap();
