import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { isAdminEmail } from '../shared/emails';
import { AuthService } from './auth.service';

export function bearerToken(req: Request): string | undefined {
  const header = req.header('authorization');
  return header?.startsWith('Bearer ') ? header.slice(7) : undefined;
}

/** Пускает только с действующим токеном сессии и email из ADMIN_EMAILS. */
@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const email = this.auth.emailFromToken(bearerToken(req));
    if (!email) throw new UnauthorizedException({ error: 'Нужен вход' });
    if (!isAdminEmail(email))
      throw new ForbiddenException({ error: 'Нет доступа' });
    return true;
  }
}
