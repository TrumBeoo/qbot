import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { JwtGuard } from '../auth/jwt.guard';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: Number(process.env.JWT_EXPIRATION_HOURS ?? 24) * 3600 },
    }),
  ],
  controllers: [ChatController],
  providers: [ChatService, JwtGuard],
})
export class ChatModule {}
