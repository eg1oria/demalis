import { Injectable, Logger } from '@nestjs/common';
import { createTransport, type Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transport: Transporter | null = null;

  /** Письмо отправлено (true) или SMTP не настроен и ссылка выведена в лог (false). */
  async send(to: string, subject: string, text: string): Promise<boolean> {
    const url = process.env.SMTP_URL;
    if (!url) {
      this.logger.warn(
        `SMTP_URL не задан — письмо для ${to} не отправлено:\n${text}`,
      );
      return false;
    }
    this.transport ??= createTransport(url);
    await this.transport.sendMail({
      from: process.env.MAIL_FROM || 'Демалыс <no-reply@localhost>',
      to,
      subject,
      text,
    });
    return true;
  }
}
