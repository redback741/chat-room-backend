import { Injectable } from '@nestjs/common';
import { createTransport, Transporter } from 'nodemailer';

@Injectable()
export class EmailService {

  transporter: Transporter

  constructor() {
    this.transporter = createTransport({
      host: 'smtp.qq.com',
      port: 587,
      secure: false,
      auth: {
        user: '1050062540@qq.com',
        pass: 'ryzhsdgirmbkbece'
      }
    })
  }

  async sendEmail({to, subject, html}) {
    await this.transporter.sendMail({
      from: {
        name: 'chat-room',
        address: '1050062540@qq.com'
      },
      to,
      subject,
      html
    })
  }
}
