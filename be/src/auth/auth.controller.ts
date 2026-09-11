import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Put,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { AuthedRequest, JwtGuard } from './jwt.guard';
import {
  LoginDto,
  RegisterDto,
  SocialLoginDto,
  UpdateProfileDto,
  VerifyTokenDto,
} from './dto';

/**
 * Cong /api/auth/* - thay cho be/auth/auth.py.
 *
 * Hinh dang response giu Y NGUYEN ban Flask. Pha 05 cat sang API nay bang
 * mot dong doi VITE_API_BASE_URL, nen doi hop dong o day la vo frontend.
 * Xem ghi chu trong src/common/wire.ts.
 */
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly jwt: JwtService,
  ) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    try {
      const { user, token } = await this.auth.register(dto);
      return { message: 'User registered successfully', user, token };
    } catch (e) {
      // Ban cu tra 400 cho ValueError (email trung, mat khau yeu).
      throw new BadRequestException(e instanceof Error ? e.message : 'Registration failed');
    }
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto) {
    const { user, token, isAdmin } = await this.auth.login(dto.email, dto.password);
    return {
      message: isAdmin ? 'Admin login successful' : 'Login successful',
      user,
      token,
    };
  }

  @Post('google-login')
  @HttpCode(200)
  async googleLogin(@Body() dto: SocialLoginDto) {
    const { user, token } = await this.auth.googleLogin(dto.token);
    return { message: 'Google login successful', user, token };
  }

  @Post('facebook-login')
  @HttpCode(200)
  async facebookLogin(@Body() dto: SocialLoginDto) {
    const { user, token } = await this.auth.facebookLogin(dto.token);
    return { message: 'Facebook login successful', user, token };
  }

  @Post('verify-token')
  @HttpCode(200)
  async verifyToken(@Body() dto: VerifyTokenDto, @Req() req: AuthedRequest) {
    // Ban cu nhan token tu header Authorization HOAC tu body. Giu ca hai.
    const header = req.headers.authorization ?? '';
    const raw = header.startsWith('Bearer ') ? header.slice(7) : dto.token;
    if (!raw) throw new UnauthorizedException('Token is missing');

    let payload: { user_id: string; type?: string };
    try {
      payload = this.jwt.verify(raw);
    } catch (e) {
      throw new UnauthorizedException(
        e instanceof Error && e.name === 'TokenExpiredError'
          ? 'Token has expired'
          : 'Token is invalid',
      );
    }

    const { user, userType } = await this.auth.resolveSubject(
      payload.user_id,
      payload.type ?? 'user',
    );
    return { valid: true, user, user_type: userType };
  }

  @Post('logout')
  @HttpCode(200)
  logout() {
    // Token JWT khong luu server-side nen dang xuat la viec cua client
    // (xoa localStorage). Giu endpoint de frontend khong phai doi.
    return { message: 'Logout successful' };
  }

  @Get('profile')
  @UseGuards(JwtGuard)
  async getProfile(@Req() req: AuthedRequest) {
    const { user } = await this.auth.resolveSubject(req.auth!.id, req.auth!.type);
    return { user };
  }

  @Put('profile')
  @UseGuards(JwtGuard)
  async updateProfile(@Req() req: AuthedRequest, @Body() dto: UpdateProfileDto) {
    if (req.auth!.type === 'admin') {
      throw new BadRequestException('Admin profile is not editable here');
    }
    const user = await this.auth.updateProfile(req.auth!.id, dto);
    return { message: 'Profile updated successfully', user };
  }
}
