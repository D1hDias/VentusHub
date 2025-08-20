/**
 * NOTIFICATION PROVIDERS
 * 
 * Flexible structure for email/SMS provider integration
 * Supports multiple providers with easy configuration
 */

import { z } from 'zod';

// ======================================
// PROVIDER INTERFACES
// ======================================

interface NotificationPayload {
  to: string;
  subject?: string;
  message: string;
  template?: string;
  templateData?: Record<string, any>;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

interface NotificationResult {
  success: boolean;
  providerId: string;
  messageId?: string;
  error?: string;
  metadata?: Record<string, any>;
}

interface NotificationProvider {
  id: string;
  name: string;
  type: 'email' | 'sms';
  enabled: boolean;
  priority: number; // Lower number = higher priority
  sendNotification(payload: NotificationPayload): Promise<NotificationResult>;
}

// ======================================
// EMAIL PROVIDERS
// ======================================

/**
 * Resend Email Provider
 * Modern email API with excellent deliverability
 */
class ResendEmailProvider implements NotificationProvider {
  id = 'resend';
  name = 'Resend';
  type = 'email' as const;
  enabled = false;
  priority = 1;

  constructor(private apiKey?: string) {
    this.enabled = !!apiKey;
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        providerId: this.id,
        error: 'Resend API key not configured'
      };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'noreply@ventushub.com',
          to: payload.to,
          subject: payload.subject || 'Notificação VentusHub',
          html: this.formatEmailContent(payload),
          text: payload.message,
          metadata: payload.metadata
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          providerId: this.id,
          error: result.message || 'Failed to send email'
        };
      }

      return {
        success: true,
        providerId: this.id,
        messageId: result.id,
        metadata: result
      };

    } catch (error) {
      return {
        success: false,
        providerId: this.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatEmailContent(payload: NotificationPayload): string {
    if (payload.template && payload.templateData) {
      // Use template engine here (Handlebars, Mustache, etc.)
      return this.renderTemplate(payload.template, payload.templateData);
    }

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">VentusHub</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
          <p style="color: #333; line-height: 1.6; margin-bottom: 20px;">${payload.message}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #888; font-size: 12px; text-align: center;">
            Esta é uma notificação automática do VentusHub. Para dúvidas, entre em contato conosco.
          </p>
        </div>
      </div>
    `;
  }

  private renderTemplate(template: string, data: Record<string, any>): string {
    // Simple template engine - replace with Handlebars/Mustache for production
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }
    return result;
  }
}

/**
 * SendGrid Email Provider
 * Enterprise-grade email delivery service
 */
class SendGridEmailProvider implements NotificationProvider {
  id = 'sendgrid';
  name = 'SendGrid';
  type = 'email' as const;
  enabled = false;
  priority = 2;

  constructor(private apiKey?: string) {
    this.enabled = !!apiKey;
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.apiKey) {
      return {
        success: false,
        providerId: this.id,
        error: 'SendGrid API key not configured'
      };
    }

    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: payload.to }],
            subject: payload.subject || 'Notificação VentusHub'
          }],
          from: { 
            email: process.env.SENDGRID_FROM_EMAIL || 'noreply@ventushub.com',
            name: 'VentusHub'
          },
          content: [
            {
              type: 'text/html',
              value: this.formatEmailContent(payload)
            }
          ],
          custom_args: payload.metadata || {}
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        return {
          success: false,
          providerId: this.id,
          error: error || 'Failed to send email'
        };
      }

      const messageId = response.headers.get('X-Message-Id');
      return {
        success: true,
        providerId: this.id,
        messageId: messageId || undefined,
        metadata: { status: response.status }
      };

    } catch (error) {
      return {
        success: false,
        providerId: this.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatEmailContent(payload: NotificationPayload): string {
    // Same format as Resend for consistency
    const resendProvider = new ResendEmailProvider();
    // Use public method or recreate formatting logic
    return `
      <h2>${payload.subject || 'Notificação VentusHub'}</h2>
      <p>${payload.message}</p>
      <hr>
      <p><small>Enviado via VentusHub</small></p>
    `;
  }
}

// ======================================
// SMS PROVIDERS
// ======================================

/**
 * Twilio SMS Provider
 * Leading SMS service provider
 */
class TwilioSMSProvider implements NotificationProvider {
  id = 'twilio';
  name = 'Twilio';
  type = 'sms' as const;
  enabled = false;
  priority = 1;

  constructor(
    private accountSid?: string,
    private authToken?: string,
    private fromNumber?: string
  ) {
    this.enabled = !!(accountSid && authToken && fromNumber);
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    if (!this.accountSid || !this.authToken || !this.fromNumber) {
      return {
        success: false,
        providerId: this.id,
        error: 'Twilio credentials not configured'
      };
    }

    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            From: this.fromNumber,
            To: payload.to,
            Body: this.formatSMSContent(payload)
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          providerId: this.id,
          error: result.message || 'Failed to send SMS'
        };
      }

      return {
        success: true,
        providerId: this.id,
        messageId: result.sid,
        metadata: result
      };

    } catch (error) {
      return {
        success: false,
        providerId: this.id,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  private formatSMSContent(payload: NotificationPayload): string {
    const maxLength = 160; // SMS character limit
    let message = `VentusHub: ${payload.message}`;
    
    if (message.length > maxLength) {
      message = message.substring(0, maxLength - 3) + '...';
    }
    
    return message;
  }
}

/**
 * Amazon SNS SMS Provider
 * AWS-based SMS service
 */
class AmazonSNSSMSProvider implements NotificationProvider {
  id = 'amazon-sns';
  name = 'Amazon SNS';
  type = 'sms' as const;
  enabled = false;
  priority = 2;

  constructor(
    private accessKeyId?: string,
    private secretAccessKey?: string,
    private region?: string
  ) {
    this.enabled = !!(accessKeyId && secretAccessKey && region);
  }

  async sendNotification(payload: NotificationPayload): Promise<NotificationResult> {
    // Implementation would require AWS SDK
    // For now, return a placeholder
    return {
      success: false,
      providerId: this.id,
      error: 'Amazon SNS integration not implemented yet'
    };
  }
}

// ======================================
// NOTIFICATION MANAGER
// ======================================

export class NotificationProviderManager {
  private emailProviders: NotificationProvider[] = [];
  private smsProviders: NotificationProvider[] = [];

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    // Initialize email providers
    this.emailProviders = [
      new ResendEmailProvider(process.env.RESEND_API_KEY),
      new SendGridEmailProvider(process.env.SENDGRID_API_KEY),
    ].filter(provider => provider.enabled)
     .sort((a, b) => a.priority - b.priority);

    // Initialize SMS providers
    this.smsProviders = [
      new TwilioSMSProvider(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN,
        process.env.TWILIO_FROM_NUMBER
      ),
      new AmazonSNSSMSProvider(
        process.env.AWS_ACCESS_KEY_ID,
        process.env.AWS_SECRET_ACCESS_KEY,
        process.env.AWS_REGION
      ),
    ].filter(provider => provider.enabled)
     .sort((a, b) => a.priority - b.priority);

    console.log(`✅ Notification providers initialized:`);
    console.log(`📧 Email providers: ${this.emailProviders.map(p => p.name).join(', ') || 'None'}`);
    console.log(`📱 SMS providers: ${this.smsProviders.map(p => p.name).join(', ') || 'None'}`);
  }

  async sendEmail(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.emailProviders.length === 0) {
      return {
        success: false,
        providerId: 'none',
        error: 'No email providers configured'
      };
    }

    // Try providers in priority order
    for (const provider of this.emailProviders) {
      try {
        const result = await provider.sendNotification(payload);
        if (result.success) {
          console.log(`📧 Email sent successfully via ${provider.name} to ${payload.to}`);
          return result;
        }
        console.warn(`⚠️ Email failed via ${provider.name}: ${result.error}`);
      } catch (error) {
        console.error(`❌ Email provider ${provider.name} error:`, error);
      }
    }

    return {
      success: false,
      providerId: 'all-failed',
      error: 'All email providers failed'
    };
  }

  async sendSMS(payload: NotificationPayload): Promise<NotificationResult> {
    if (this.smsProviders.length === 0) {
      return {
        success: false,
        providerId: 'none',
        error: 'No SMS providers configured'
      };
    }

    // Try providers in priority order
    for (const provider of this.smsProviders) {
      try {
        const result = await provider.sendNotification(payload);
        if (result.success) {
          console.log(`📱 SMS sent successfully via ${provider.name} to ${payload.to}`);
          return result;
        }
        console.warn(`⚠️ SMS failed via ${provider.name}: ${result.error}`);
      } catch (error) {
        console.error(`❌ SMS provider ${provider.name} error:`, error);
      }
    }

    return {
      success: false,
      providerId: 'all-failed',
      error: 'All SMS providers failed'
    };
  }

  getAvailableProviders() {
    return {
      email: this.emailProviders.map(p => ({
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        priority: p.priority
      })),
      sms: this.smsProviders.map(p => ({
        id: p.id,
        name: p.name,
        enabled: p.enabled,
        priority: p.priority
      }))
    };
  }

  /**
   * Test all providers with a test message
   */
  async testProviders(testEmail: string, testPhone?: string) {
    const results: Record<string, NotificationResult> = {};

    // Test email providers
    if (testEmail) {
      for (const provider of this.emailProviders) {
        results[`email_${provider.id}`] = await provider.sendNotification({
          to: testEmail,
          subject: 'Teste VentusHub - Provider de Email',
          message: `Este é um teste do provider ${provider.name}. Se você recebeu esta mensagem, o provider está funcionando corretamente.`,
          priority: 'low',
          metadata: { test: true, provider: provider.id }
        });
      }
    }

    // Test SMS providers
    if (testPhone) {
      for (const provider of this.smsProviders) {
        results[`sms_${provider.id}`] = await provider.sendNotification({
          to: testPhone,
          message: `Teste VentusHub via ${provider.name}`,
          priority: 'low',
          metadata: { test: true, provider: provider.id }
        });
      }
    }

    return results;
  }
}

// ======================================
// SINGLETON INSTANCE
// ======================================

export const notificationProviderManager = new NotificationProviderManager();

// ======================================
// TYPES
// ======================================

export type {
  NotificationPayload,
  NotificationResult,
  NotificationProvider
};