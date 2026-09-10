import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { toWireAdmin, toWireUser, type WireAdmin, type WireUser } from '../common/wire';
import type { RegisterDto, UpdateProfileDto } from './dto';

/**
 * Xac thuc nguoi dung va admin.
 *
 * MOT kieu hash duy nhat: bcrypt. Ban Python co ba kieu song song -
 * werkzeug (models/user.py), SHA-256 + salt (services/admin_auth_service.py)
 * va bcrypt (services/user_management_service.py). SHA-256 cho mat khau la
 * sai vi no qua nhanh nen brute-force re; bcrypt cham co chu dich.
 * Database dang trong nen thong nhat lai khong ton gi.
 */
@Injectable()
export class AuthService {
  // 12 vong: cham du de chong brute-force ma van duoi 100ms tren may thuong.
  private static readonly BCRYPT_ROUNDS = 12;

  constructor(
    private readonly db: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  private sign(subject: string, type: 'user' | 'admin'): string {
    // Giu ten claim "user_id" giong ban Python de token cu con doc duoc
    // trong giai doan cat, va them "type" de phan biet user voi admin -
    // ban cu phai thu giai ma hai lan moi biet.
    return this.jwt.sign({ user_id: subject, type });
  }

  async register(dto: RegisterDto): Promise<{ user: WireUser; token: string }> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.db.user.findUnique({ where: { email } });
    if (existing) {
      // Cung thong diep voi ban cu de frontend hien nguyen van.
      throw new Error('User with this email already exists');
    }

    const user = await this.db.user.create({
      data: {
        email,
        name: dto.name.trim(),
        passwordHash: await bcrypt.hash(dto.password, AuthService.BCRYPT_ROUNDS),
        provider: 'email',
        // Ban cu tu dien businessInfo mac dinh khi khong duoc gui
        // (models/user.py duong 22). Giu nguyen hanh vi do.
        // Cast o bien gioi Prisma: Record<string, unknown> khong tu khop
        // InputJsonValue vi Prisma phan biet undefined voi JsonNull.
        businessInfo: (dto.businessInfo ?? {
          business_name: dto.name.trim(),
          business_type: 'Du lịch',
          industry: 'Tourism',
          phone: '',
          address: '',
        }) as Prisma.InputJsonValue,
      },
    });

    return { user: toWireUser(user), token: this.sign(user.id, 'user') };
  }

  async login(email: string, password: string): Promise<{
    user: WireUser | WireAdmin;
    token: string;
    isAdmin: boolean;
  }> {
    const key = email.toLowerCase().trim();

    // Thu admin truoc roi moi den user - giu dung thu tu cua ban Flask
    // (be/auth/auth.py duong 90), vi cung mot email co the ton tai o ca hai
    // bang va Dashboard dua vao viec admin duoc uu tien.
    const admin = await this.db.admin.findUnique({ where: { email: key } });
    if (admin?.isActive && (await bcrypt.compare(password, admin.passwordHash))) {
      // Dung KET QUA cua update, khong dung `admin` doc truoc do: neu tra ve
      // object cu thi response luon co last_login = null du DB da ghi dung.
      const fresh = await this.db.admin.update({
        where: { id: admin.id },
        data: { lastLoginAt: new Date() },
      });
      return { user: toWireAdmin(fresh), token: this.sign(fresh.id, 'admin'), isAdmin: true };
    }

    const user = await this.db.user.findUnique({ where: { email: key } });
    if (!user || !user.isActive || !user.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (!(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const fresh = await this.db.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });
    return { user: toWireUser(fresh), token: this.sign(fresh.id, 'user'), isAdmin: false };
  }

  /** Nguoi dung hoac admin ung voi token da giai ma. */
  async resolveSubject(
    id: string,
    type: string,
  ): Promise<{ user: WireUser | WireAdmin; userType: 'user' | 'admin' }> {
    if (type === 'admin') {
      const a = await this.db.admin.findUnique({ where: { id } });
      if (!a || !a.isActive) throw new UnauthorizedException('Admin not found or inactive');
      return { user: toWireAdmin(a), userType: 'admin' };
    }
    const u = await this.db.user.findUnique({ where: { id } });
    if (!u || !u.isActive) throw new UnauthorizedException('User not found or inactive');
    return { user: toWireUser(u), userType: 'user' };
  }

  async googleLogin(idToken: string): Promise<{ user: WireUser; token: string }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) throw new UnauthorizedException('Google authentication not configured');

    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    );
    if (!res.ok) throw new UnauthorizedException('Invalid Google token');

    const info = (await res.json()) as Record<string, string>;
    // Kiem audience: khong kiem thi bat ky ID token Google nao cung dang
    // nhap duoc, ke ca token phat cho ung dung khac.
    if (info.aud !== clientId) throw new UnauthorizedException('Invalid token audience');

    const email = (info.email ?? '').toLowerCase();
    if (!email || !info.sub) throw new UnauthorizedException('Invalid Google user data');

    return this.upsertSocial({
      email,
      name: info.name ?? email,
      provider: 'google',
      googleId: info.sub,
      profilePicture: info.picture ?? null,
    });
  }

  async facebookLogin(accessToken: string): Promise<{ user: WireUser; token: string }> {
    const appId = process.env.FACEBOOK_APP_ID;
    const appSecret = process.env.FACEBOOK_APP_SECRET;
    if (!appId || !appSecret) {
      throw new UnauthorizedException('Facebook authentication not configured');
    }

    const debugRes = await fetch(
      `https://graph.facebook.com/debug_token?input_token=${encodeURIComponent(accessToken)}` +
        `&access_token=${encodeURIComponent(`${appId}|${appSecret}`)}`,
    );
    if (!debugRes.ok) throw new UnauthorizedException('Invalid Facebook token');
    const debug = (await debugRes.json()) as { data?: { is_valid?: boolean; app_id?: string } };
    if (!debug.data?.is_valid) throw new UnauthorizedException('Invalid Facebook token');
    // Ban Python khong kiem app_id tra ve. Kiem o day de token cua ung dung
    // Facebook khac khong dung duoc.
    if (debug.data.app_id && debug.data.app_id !== appId) {
      throw new UnauthorizedException('Token issued for another application');
    }

    const meRes = await fetch(
      `https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!meRes.ok) throw new UnauthorizedException('Failed to read Facebook profile');
    const me = (await meRes.json()) as {
      id?: string;
      name?: string;
      email?: string;
      picture?: { data?: { url?: string } };
    };
    const email = (me.email ?? '').toLowerCase();
    if (!email || !me.id) {
      // Facebook cho phep tai khoan khong co email; ban cu cung that bai o
      // day nhung khong noi ro ly do.
      throw new UnauthorizedException('Facebook account has no email address');
    }

    return this.upsertSocial({
      email,
      name: me.name ?? email,
      provider: 'facebook',
      facebookId: me.id,
      profilePicture: me.picture?.data?.url ?? null,
    });
  }

  /** Tao user moi hoac gan id social vao user da co cung email. */
  private async upsertSocial(p: {
    email: string;
    name: string;
    provider: 'google' | 'facebook';
    googleId?: string;
    facebookId?: string;
    profilePicture: string | null;
  }): Promise<{ user: WireUser; token: string }> {
    const link = p.provider === 'google' ? { googleId: p.googleId } : { facebookId: p.facebookId };

    const user = await this.db.user.upsert({
      where: { email: p.email },
      // Da co tai khoan cung email: gan id social vao thay vi tao ban trung.
      update: { ...link, lastLoginAt: new Date(), profilePicture: p.profilePicture },
      create: {
        email: p.email,
        name: p.name,
        provider: p.provider,
        profilePicture: p.profilePicture,
        lastLoginAt: new Date(),
        ...link,
      },
    });

    return { user: toWireUser(user), token: this.sign(user.id, 'user') };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<WireUser> {
    const user = await this.db.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.profile_picture !== undefined ? { profilePicture: dto.profile_picture } : {}),
        ...(dto.businessInfo !== undefined
          ? { businessInfo: dto.businessInfo as Prisma.InputJsonValue }
          : {}),
      },
    });
    return toWireUser(user);
  }
}
