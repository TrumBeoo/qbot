import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

// Global: moi module khac inject PrismaService duoc ma khong phai import lai.
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
