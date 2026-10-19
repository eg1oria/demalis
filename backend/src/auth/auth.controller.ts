import { Body, Controller, Get, HttpCode, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import { isAdminEmail } from '../shared/emails';
import { bearerToken } from './admin.guard';
import { AuthService, isDevLoginAllowed } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('magic-link')
  @HttpCode(200)
  magicLink(@Body() body: { email?: string }) {
    return this.auth.sendMagicLink(body.email);
  }

  @Post('verify')
  @HttpCode(200)
  verify(@Body() body: { token?: string }) {
    return this.auth.verify(body.token);
  }

  @Post('dev-login')
  @HttpCode(200)
  devLogin(@Body() body: { email?: string }) {
    return this.auth.devLogin(body.email);
  }

  /** Кто вошёл: anonymous — нет токена, forbidden — email больше не в ADMIN_EMAILS. */
  @Get('me')
  me(@Req() req: Request) {
    const email = this.auth.emailFromToken(bearerToken(req));
    if (!email) return { status: 'anonymous' as const };
    return {
      status: isAdminEmail(email) ? ('admin' as const) : ('forbidden' as const),
      email,
    };
  }

  @Get('config')
  config() {
    return { devLogin: isDevLoginAllowed() };
  }
}
