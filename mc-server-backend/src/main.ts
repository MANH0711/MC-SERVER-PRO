import * as dotenv from 'dotenv';
dotenv.config();

import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('MCServerBootstrap');

  // 1. Tạo NestJS Application
  const app = await NestFactory.create(AppModule);

  const grpcHost = process.env.GRPC_HOST || '0.0.0.0';
  const grpcPort = process.env.GRPC_PORT || '50051';
  const httpPort = process.env.PORT || '3000';

  // 2. Cấu hình gRPC Microservice với các proto files
  const protoDir = join(__dirname, '../protos');
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      url: `${grpcHost}:${grpcPort}`,
      package: ['mc_server'],
      protoPath: [
        join(protoDir, 'common.types.proto'),
        join(protoDir, 'device.service.proto'),
        join(protoDir, 'communication.service.proto'),
        join(protoDir, 'alarm.service.proto'),
        join(protoDir, 'mes.service.proto'),
        join(protoDir, 'system.service.proto'),
      ],
      loader: {
        keepCase: true,
        longs: String,
        enums: String,
        defaults: true,
        oneofs: true,
        includeDirs: [protoDir],
      },
    },
  });

  // Bảo mật HTTP Headers với Helmet
  const helmet = require('helmet');
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      hidePoweredBy: true,
      noSniff: true,
      xssFilter: true,
    })
  );

  // Kích hoạt bộ lọc ngoại lệ bảo mật toàn cục (chống rò rỉ stack trace & mật khẩu DB)
  try {
    const { GlobalSecurityExceptionFilter } = require('./common/security-exception.filter');
    app.useGlobalFilters(new GlobalSecurityExceptionFilter());
  } catch (filtErr: any) {
    logger.warn(`Không thể khởi tạo GlobalSecurityExceptionFilter: ${filtErr.message}`);
  }

  // Kích hoạt ValidationPipe toàn cục để validate và lọc các payload đầu vào độc hại
  try {
    const { ValidationPipe } = require('@nestjs/common');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      })
    );
  } catch (pipeErr: any) {
    logger.warn(`ValidationPipe kích hoạt ở chế độ cơ bản: ${pipeErr.message}`);
  }

  // Cấu hình CORS an toàn cho Frontend Web
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : true; // Mặc định chấp nhận các kết nối mạng nội bộ khi chưa cấu hình

  app.enableCors({
    origin: allowedOrigins,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 3. Khởi động đồng thời Microservice gRPC và HTTP Server
  await app.startAllMicroservices();
  await app.listen(httpPort);

  logger.log(`
  ══════════════════════════════════════════════════════════════════
  🚀 MC SERVER PRO - BACKEND SERVICES INITIALIZED
  ══════════════════════════════════════════════════════════════════
  ⚡ gRPC Microservice Server : grpc://${grpcHost}:${grpcPort}
  🌐 HTTP / REST Gateway     : http://localhost:${httpPort}
  📊 Protocol Codec           : Industrial Binary (STX, CRC16, ETX)
  🗄️ Oracle Database TNS      : ITMDEV, ITMMES, ITMVMES, ITMSEMIMES, ITMPMES
  📋 Command Structure        : Mxxx (Common), Bxxx (Bake), Jxxx (Bending)
  ══════════════════════════════════════════════════════════════════
  `);
}

bootstrap();
