import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Ket noi Postgres.
 *
 * Ket noi LUOI: connect() goi trong onModuleInit, khong phai luc import
 * module. Ban Flask cu tao MySQLConnectionPool ngay luc import
 * (be/MySQL/db/__init__.py:23) nen database chet la ca process chet truoc
 * khi khoi try/except kip chay. Nest goi onModuleInit sau khi da dung xong
 * cay phu thuoc, va loi o day duoc bao cao dang dan chu khong lam sap
 * im lang.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
