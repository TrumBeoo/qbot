import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

export type AuthedRequest = Request & {
  auth?: { id: string; type: 'user' | 'admin' };
};

/**
 * Thay cho decorator @token_required cua Flask (be/auth/auth.py duong 10).
 *
 * Khac biet co y: ban cu tra ve {'error': 'Token is missing'} voi 401 cho
 * moi truong hop. Giu nguyen ma 401 va hinh dang {error: ...} de frontend
 * xu ly khong doi, nhung tach thong diep ro hon giua thieu token, token
 * het han va token khong hop le.
 */
@Injectable()
export class JwtGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest<AuthedRequest>();
    const header = req.headers.authorization ?? '';
    const prefix = 'Bearer ';

    if (!header.startsWith(prefix)) throw new UnauthorizedException('Token is missing');
    const token = header.slice(prefix.length);
    if (!token) throw new UnauthorizedException('Token is missing');

    try {
      const payload = this.jwt.verify<{ user_id: string; type?: string }>(token);
      req.auth = {
        id: payload.user_id,
        // Token do ban Python phat khong co claim "type". Coi la user, dung
        // nhu ban cu vi no thu giai ma user truoc.
        type: payload.type === 'admin' ? 'admin' : 'user',
      };
      return true;
    } catch (e) {
      const msg = e instanceof Error && e.name === 'TokenExpiredError'
        ? 'Token has expired'
        : 'Token is invalid';
      throw new UnauthorizedException(msg);
    }
  }
}
