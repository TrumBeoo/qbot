import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Dua moi loi ve hinh dang {error: "..."} giong ban Flask.
 *
 * Vi sao can: Nest mac dinh tra {statusCode, message, error} va voi loi
 * validation thi message la MOT MANG. Nhung frontend hien tai doc
 * `data.error` (fe/src/services/authService.js duong 50, 99, 136, 173).
 * Khong co filter nay thi moi loi deu hien thong diep mac dinh
 * ("Registration failed") thay vi ly do that, va nguoi dung khong biet
 * mat khau minh ngan hay email da ton tai.
 *
 * Mang validation duoc gop thanh mot cau: frontend chi hien duoc mot chuoi.
 */
/**
 * Hai nhom endpoint cua ban Flask dung HAI hinh dang loi khac nhau:
 *   - /api/auth/*  tra {error: "..."}          -> authService.js doc data.error
 *   - /api/chat/*  tra {status:"error", message:"..."} -> mysqlConversationService.js
 *                                                doc data.message
 * Tra ca ba field cung luc: re hon la rai logic theo tung route, va khong
 * co client nao vo vi co them field.
 */
function errorBody(message: string): Record<string, string> {
  return { error: message, status: 'error', message };
}

@Catch()
export class HttpErrorFilter implements ExceptionFilter {
  private readonly log = new Logger('HttpError');

  catch(e: unknown, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();

    if (e instanceof HttpException) {
      const status = e.getStatus();
      const body = e.getResponse();
      let message: string;

      if (typeof body === 'string') {
        message = body;
      } else {
        const m = (body as { message?: unknown }).message;
        message = Array.isArray(m) ? m.join('; ') : String(m ?? e.message);
      }

      res.status(status).json(errorBody(message));
      return;
    }

    // Loi khong luong truoc: log day du ve phia server, tra ra ngoai mot cau
    // chung chung. Khong ro ri stack trace hay chuoi ket noi database.
    this.log.error(e instanceof Error ? e.stack ?? e.message : String(e));
    res.status(HttpStatus.INTERNAL_SERVER_ERROR).json(errorBody('Internal server error'));
  }
}
