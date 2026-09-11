import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtGuard } from './jwt.guard';

@Module({
  imports: [
    JwtModule.register({
      // Cung JWT_SECRET voi ban Flask: token da phat truoc khi cat van con
      // giai ma duoc, nen nguoi dung khong bi dang xuat het o pha 05.
      secret: process.env.JWT_SECRET,
      // Ban cu dat 24 gio (AuthService.JWT_EXPIRATION_HOURS). Tinh bang
      // GIAY vi kieu cua expiresIn khong nhan chuoi dung template.
      signOptions: { expiresIn: Number(process.env.JWT_EXPIRATION_HOURS ?? 24) * 3600 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtGuard],
  exports: [AuthService],
})
export class AuthModule {}
