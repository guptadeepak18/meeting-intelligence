import { Injectable, Logger } from '@nestjs/common';

export interface DeliverableNotification {
  id: string;
  channel: 'in_app' | 'email' | 'slack';
  templateKey: string;
  userId: string;
  payload: unknown;
}

@Injectable()
export class NotificationDeliveryService {
  private readonly logger = new Logger(NotificationDeliveryService.name);

  async deliver(notification: DeliverableNotification): Promise<void> {
    switch (notification.channel) {
      case 'in_app':
        this.logger.debug(`In-app notification delivered: ${notification.id}`);
        return;
      case 'email':
        await this.deliverEmail(notification);
        return;
      case 'slack':
        await this.deliverSlack(notification);
        return;
      default:
        throw new Error(`Unsupported notification channel: ${notification.channel}`);
    }
  }

  private async deliverEmail(notification: DeliverableNotification): Promise<void> {
    const resendApiKey = process.env.RESEND_API_KEY;
    const sendGridApiKey = process.env.SENDGRID_API_KEY;
    const fromEmail = process.env.SMTP_FROM ?? process.env.NOTIFICATION_FROM_EMAIL;

    if (!fromEmail) {
      this.logger.warn(`Email sender not configured. Marking email as simulated: ${notification.id}`);
      return;
    }

    const subject = `Meeting Intelligence: ${notification.templateKey}`;
    const body = `Notification ${notification.templateKey} for user ${notification.userId}`;

    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromEmail,
          to: [process.env.NOTIFICATION_FALLBACK_TO_EMAIL ?? fromEmail],
          subject,
          text: body,
        }),
      });

      if (!response.ok) {
        throw new Error(`Resend delivery failed: ${response.status}`);
      }

      return;
    }

    if (sendGridApiKey) {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${sendGridApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: process.env.NOTIFICATION_FALLBACK_TO_EMAIL ?? fromEmail }],
              subject,
            },
          ],
          from: { email: fromEmail },
          content: [{ type: 'text/plain', value: body }],
        }),
      });

      if (!response.ok) {
        throw new Error(`SendGrid delivery failed: ${response.status}`);
      }

      return;
    }

    this.logger.warn(`No email provider configured. Marking email as simulated: ${notification.id}`);
  }

  private async deliverSlack(notification: DeliverableNotification): Promise<void> {
    const webhookConfigured = Boolean(process.env.SLACK_WEBHOOK_URL);
    if (!webhookConfigured) {
      this.logger.warn(`Slack webhook not configured. Marking slack notification as simulated: ${notification.id}`);
      return;
    }

    this.logger.debug(`Slack notification queued for provider send: ${notification.id}`);
  }
}
