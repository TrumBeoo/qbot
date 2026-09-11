import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

/**
 * Healthcheck bao TRANG THAI thay vi lam sap app.
 *
 * Bai hoc tu ban cu: be/MySQL/db/__init__.py tao connection pool luc import
 * nen database chet la process chet. O day database chet thi endpoint tra
 * 200 voi database: "down" - container van song, van tra loi duoc, va
 * nguoi van doc duoc log de biet chuyen gi.
 */
@Controller()
export class HealthController {
  constructor(private readonly db: PrismaService) {}

  @Get('health')
  async health(): Promise<{ status: string; database: string }> {
    try {
      await this.db.$queryRaw`SELECT 1`;
      return { status: 'healthy', database: 'up' };
    } catch {
      return { status: 'degraded', database: 'down' };
    }
  }
}
