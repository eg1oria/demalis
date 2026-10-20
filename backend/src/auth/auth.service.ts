import { createHash, randomBytes } from 'node:crypto';
import {
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaClient } from '../generated/prisma/client';
import { siteUrl } from '../common/site';
import { isAdminEmail } from '../shared/emails';
import { SITE_NAME } from '../shared/site';
import { MailService } from './mail.service';
import { str } from '../common/uuid';

/** Ссылка из письма действует 15 минут. */
const LINK_TTL_MS = 15 * 60 * 1000;
/** Не чаще одного письма в минуту на адрес. */
const LINK_COOLDOWN_MS = 60 * 1000;

export type AdminTokenPayload = { sub: string };

const hash = (token: string) =>
  createHash('sha256').update(token).digest('hex');

const LOOPBACK = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/**
 * Вход без письма: не production и запрос с этого же компьютера (сервер
 * Next.js при локальной разработке). Бэкенд, запущенный на сервере без
 * NODE_ENV=production, так не откроет админку всем, кто знает email.
 */
export function isDevLoginAllowed(
  ip: string | undefined,
  env: string | undefined = process.env.NODE_ENV,
): boolean {
  return env !== 'production' && ip !== undefined && LOOPBACK.has(ip);
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaClient,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  private checkEmail(raw: unknown): string {
    const email = str(raw).trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new HttpException(
        { error: 'Введите корректный email' },
        HttpStatus.BAD_REQUEST,
      );
    if (!isAdminEmail(email))
      throw new ForbiddenException({
        error: 'У этого email нет доступа к админке',
      });
    return email;
  }

  private issue(email: string): string {
    return this.jwt.sign({ sub: email } satisfies AdminTokenPayload);
  }

  async sendMagicLink(rawEmail: unknown): Promise<{ sentTo: string }> {
    const email = this.checkEmail(rawEmail);
    const site = siteUrl();
    if (!site)
      throw new ServiceUnavailableException({ error: 'Не задан SITE_URL' });

    const recent = await this.prisma.loginToken.findFirst({
      where: {
        email,
        created_at: { gt: new Date(Date.now() - LINK_COOLDOWN_MS) },
      },
    });
    if (recent)
      throw new HttpException(
        {
          error:
            'Слишком много писем подряд. Подождите минуту и попробуйте снова.',
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );

    const token = randomBytes(32).toString('base64url');
    await this.prisma.loginToken.create({
      data: {
        email,
        token_hash: hash(token),
        expires_at: new Date(Date.now() + LINK_TTL_MS),
      },
    });
    const link = `${site}/admin/auth/callback?token=${token}`;
    try {
      await this.mail.send(
        email,
        `Вход в админку ${SITE_NAME}`,
        `Чтобы войти в админку ${SITE_NAME}, откройте ссылку (действует 15 минут):\n\n${link}\n\nЕсли вы не запрашивали вход — просто удалите письмо.`,
      );
    } catch (e) {
      this.logger.error('sendMagicLink', e);
      throw new ServiceUnavailableException({
        error: 'Не удалось отправить письмо. Попробуйте ещё раз.',
      });
    }
    return { sentTo: email };
  }

  /** Обменивает одноразовую ссылку из письма на токен сессии. */
  async verify(rawToken: unknown): Promise<{ token: string; email: string }> {
    const token = str(rawToken);
    if (!token) throw new UnauthorizedException({ error: 'Нет токена' });
    const row = await this.prisma.loginToken.findUnique({
      where: { token_hash: hash(token) },
    });
    if (!row)
      throw new UnauthorizedException({ error: 'Ссылка недействительна' });
    // Условие на used_at: ссылку нельзя использовать дважды, даже параллельно.
    const used = await this.prisma.loginToken.updateMany({
      where: { id: row.id, used_at: null, expires_at: { gt: new Date() } },
      data: { used_at: new Date() },
    });
    if (used.count === 0)
      throw new UnauthorizedException({ error: 'Ссылка устарела' });
    if (!isAdminEmail(row.email))
      throw new ForbiddenException({ error: 'Нет доступа' });
    return { token: this.issue(row.email), email: row.email };
  }

  /** Вход без письма — только при локальной разработке. */
  devLogin(
    rawEmail: unknown,
    ip: string | undefined,
  ): { token: string; email: string } {
    if (!isDevLoginAllowed(ip))
      throw new NotFoundException({ error: 'Вход без письма отключён' });
    const email = this.checkEmail(rawEmail);
    return { token: this.issue(email), email };
  }

  /** Email из токена сессии; null — токена нет или он недействителен. */
  emailFromToken(token: string | undefined): string | null {
    if (!token) return null;
    try {
      return this.jwt.verify<AdminTokenPayload>(token).sub;
    } catch {
      return null;
    }
  }
}
