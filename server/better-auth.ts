import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db.js";
import { user, session, account, verification } from "../shared/schema.js";
import { randomUUID } from "crypto";

// Email service integration
async function sendEmail(to: string, subject: string, html: string) {
  if (process.env.NODE_ENV === 'development') {
    console.log('📧 Email would be sent to:', to);
    console.log('📧 Subject:', subject);
    console.log('📧 HTML content:', html);
    return;
  }

  // Production email service - Configure based on your preference
  if (process.env.RESEND_API_KEY) {
    // Using Resend (recommended)
    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: process.env.FROM_EMAIL || 'noreply@ventushub.com.br',
          to: [to],
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Email failed: ${error}`);
      }

      console.log('✅ Email sent successfully to:', to);
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  } else if (process.env.SENDGRID_API_KEY) {
    // Using SendGrid
    try {
      const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to }] }],
          from: { email: process.env.FROM_EMAIL || 'noreply@ventushub.com.br' },
          subject,
          content: [{ type: 'text/html', value: html }],
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`SendGrid error: ${error}`);
      }

      console.log('✅ Email sent via SendGrid to:', to);
    } catch (error) {
      console.error('❌ SendGrid email failed:', error);
      throw error;
    }
  } else {
    console.warn('⚠️ No email service configured. Set RESEND_API_KEY or SENDGRID_API_KEY');
  }
}

// Better Auth initialized successfully

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification
    }
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: process.env.NODE_ENV === 'production',
    minPasswordLength: 8,
    maxPasswordLength: 128,
    // Password configuration
    password: {
      // Use default password hashing and verification
    },
    // Configure password reset emails
    sendResetPassword: async ({ user, url, token }, request) => {
      const resetUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:5000'}/reset-password?token=${token}`;
      
      await sendEmail(
        user.email,
        "Redefinir senha - VentusHub",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <div style="text-align: center;">
              <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" style="width: 120px; margin-bottom: 20px;">
            </div>
            <h2 style="color: #333; text-align: center;">Redefinir sua senha</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Olá <strong>${user.name || user.email.split('@')[0]}</strong>,
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Recebemos uma solicitação para redefinir a senha da sua conta VentusHub.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #3b82f6; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(59, 130, 246, 0.2);">
                🔐 Redefinir Senha
              </a>
            </div>
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; font-size: 14px; margin: 0;">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança. Se você não solicitou esta redefinição, ignore este email.
              </p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
              VentusHub - Sistema de Gestão Imobiliária<br>
              Este é um email automático, não responda.
            </p>
          </div>
        </div>
        `
      );
    },
    resetPasswordTokenExpiresIn: 3600, // 1 hour
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url, token }, request) => {
      const verifyUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:5000'}/verify-email?token=${token}`;
      
      await sendEmail(
        user.email,
        "Verificar email - VentusHub", 
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
            <div style="text-align: center;">
              <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" style="width: 120px; margin-bottom: 20px;">
            </div>
            <h2 style="color: #333; text-align: center;">Bem-vindo ao VentusHub! 🎉</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Olá <strong>${user.name || user.email.split('@')[0]}</strong>,
            </p>
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Obrigado por se cadastrar no VentusHub! Para completar seu cadastro e começar a usar nossa plataforma, precisamos verificar seu email.
            </p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background: #10b981; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; box-shadow: 0 2px 4px rgba(16, 185, 129, 0.2);">
                ✅ Verificar Email
              </a>
            </div>
            <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
              <p style="color: #0c5460; font-size: 14px; margin: 0;">
                <strong>💡 Próximos passos:</strong> Após verificar seu email, você terá acesso completo ao painel de controle, simuladores financeiros e todas as funcionalidades da plataforma.
              </p>
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 20px; border-top: 1px solid #eee; padding-top: 15px;">
              VentusHub - Sistema de Gestão Imobiliária<br>
              Este é um email automático, não responda.
            </p>
          </div>
        </div>
        `
      );
    },
    sendOnSignUp: process.env.NODE_ENV === 'production',
    autoSignInAfterVerification: true
  },
  session: {
    expiresIn: 7 * 24 * 60 * 60, // 7 days
    updateAge: 24 * 60 * 60, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60 * 1000, // 5 minutes
    },
  },
  advanced: {
    crossSubDomainCookies: {
      enabled: process.env.NODE_ENV === 'production',
      domain: process.env.NODE_ENV === 'production' ? '.ventushub.com.br' : undefined,
    },
    database: {
      generateId: () => randomUUID(),
    },
  },
  rateLimit: {
    enabled: true,
    window: 60 * 1000, // 1 minute
    max: 10, // 10 requests per minute per IP
    storage: "memory", // Use memory storage for rate limiting
  },
  logger: {
    level: process.env.NODE_ENV === 'development' ? 'debug' : 'error',
    disabled: false,
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production-must-be-at-least-32-characters-long",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:5000", 
  trustedOrigins: [
    "http://localhost:5000",
    "http://localhost:5173",
    "https://ventushub.com.br",
    "https://www.ventushub.com.br",
    "https://ventus-hub.onrender.com"
  ],
});

// Export the auth object
export type Auth = typeof auth;