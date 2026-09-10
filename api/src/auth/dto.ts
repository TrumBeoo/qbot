import { IsEmail, IsNotEmpty, IsObject, IsOptional, IsString, MinLength } from 'class-validator';

/**
 * Rang buoc dau vao o BIEN gioi tin cay.
 *
 * Ban Flask cu kiem tay trong tung route (email regex + do dai >= 6 trong
 * models/user.py). Chuyen thanh decorator de rang buoc nam canh kieu du lieu
 * va khong the quen o route moi.
 */

export class RegisterDto {
  @IsString()
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  // Giu nguyen nguong 6 ky tu cua User.validate_password() de nguoi dung
  // hien tai khong bi tu choi sau khi cat sang API moi.
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsObject()
  businessInfo?: Record<string, unknown>;
}

export class LoginDto {
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}

export class SocialLoginDto {
  // Frontend gui field ten "token" (fe/src/components/SocialLogin).
  @IsString()
  @IsNotEmpty({ message: 'Token is required' })
  token: string;
}

export class VerifyTokenDto {
  @IsOptional()
  @IsString()
  token?: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name?: string;

  @IsOptional()
  @IsString()
  profile_picture?: string;

  @IsOptional()
  @IsObject()
  businessInfo?: Record<string, unknown>;
}
