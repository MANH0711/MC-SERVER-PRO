import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global Security Exception Filter
 * Ngăn chặn rò rỉ thông tin nhạy cảm (Oracle TNS, DB Credentials, File Paths, Stack Traces)
 * ra ngoài phản hồi HTTP cho phía Client.
 */
@Catch()
export class GlobalSecurityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalSecurityExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Nếu không phải HTTP Context (ví dụ gRPC), bỏ qua
    if (!response || typeof response.status !== 'function') {
      return;
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal Server Error';
    let errorCode = 'ERR_INTERNAL';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        message = (res as any).message || message;
        errorCode = (res as any).error || errorCode;
      }
    } else if (exception instanceof Error) {
      const errMsg = exception.message || '';

      // Phát hiện lỗi Oracle Database hoặc mạng
      if (errMsg.includes('ORA-') || errMsg.includes('NJS-') || errMsg.includes('Oracle')) {
        this.logger.error(`🚨 [Bảo Mật DB] Phát hiện lỗi Oracle nội bộ: ${errMsg}`);
        message = 'Database operation encountered a secured internal error.';
        errorCode = 'ERR_DATABASE_SECURED';
      } else {
        this.logger.error(`🚨 [Bảo Mật Hệ Thống] Unhandled Exception: ${errMsg}`, exception.stack);
        message = 'A secure server error occurred. Details have been logged safely.';
      }
    }

    // Đảm bảo không bao giờ trả về stack trace ra ngoài response
    response.status(status).json({
      success: false,
      statusCode: status,
      errorCode,
      message,
      timestamp: new Date().toISOString(),
      path: request?.url || '',
    });
  }
}
