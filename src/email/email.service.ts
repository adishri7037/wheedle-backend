import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com', // Replace with your actual SMTP host
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendClientOnboardingEmail(email: string, passwordString: string): Promise<boolean> {
    try {
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.warn('SMTP credentials missing. Skipping onboarding email.');
        return false;
      }

      const mailOptions = {
        from: '"Wheedle Technologies" <support@wheedletechnologies.ai>',
        to: email,
        subject: 'Welcome to Wheedle Technologies - Your Client Account',
        html: `
          <h3>Welcome to Wheedle Technologies!</h3>
          <p>Your client dashboard account has been successfully created.</p>
          <p>You can log in to your account using the following credentials:</p>
          <ul>
            <li><strong>Login URL:</strong> <a href="http://localhost:3000/admin/login">http://localhost:3000/admin/login</a></li>
            <li><strong>Email:</strong> ${email}</li>
            <li><strong>Password:</strong> ${passwordString}</li>
          </ul>
          <p>If you have any issues, please feel free to reach out to us by raising a query on the dashboard or replying to this email.</p>
          <br/>
          <p>Best regards,</p>
          <p>Wheedle Technologies Support Team</p>
        `,
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log('Client onboarding email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send client onboarding email:', error);
      return false;
    }
  }
}
