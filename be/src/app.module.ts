import { Module } from '@nestjs/common';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { HealthController } from './health.controller';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [PrismaModule, AiModule, AuthModule, ChatModule],
  controllers: [HealthController],
})
export class AppModule {}
