import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

// Create a simple database connection for Better Auth
const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql);

// Simple email sender for development - replace with your preferred email service
async function sendEmail(to: string, subject: string, html: string) {
  console.log('=== EMAIL SENDING ===');
  console.log('To:', to);
  console.log('Subject:', subject);
  console.log('Content:', html);
  console.log('====================');
  
  // TODO: Replace with actual email service (SendGrid, Resend, etc.)
  // For now, we just log to console for development
}

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false, // We'll enable this later
    minPasswordLength: 6,
    maxPasswordLength: 128,
    autoSignIn: true,
    // Configure password reset emails
    sendResetPassword: async ({ user, url, token }, request) => {
      const resetUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/reset-password?token=${token}`;
      
      await sendEmail(
        user.email,
        "Redefinir senha - VentusHub",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" style="width: 120px; margin-bottom: 20px;">
            <h2 style="color: #333;">Redefinir sua senha</h2>
            <p style="color: #666; font-size: 16px;">
              Olá ${user.name || user.email},
            </p>
            <p style="color: #666; font-size: 16px;">
              Recebemos uma solicitação para redefinir a senha da sua conta VentusHub.
            </p>
            <div style="margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Redefinir Senha
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Se você não solicitou esta redefinição, pode ignorar este email com segurança.
            </p>
            <p style="color: #666; font-size: 14px;">
              Este link expira em 1 hora por motivos de segurança.
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
      const verifyUrl = `${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
      
      await sendEmail(
        user.email,
        "Verificar email - VentusHub", 
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" style="width: 120px; margin-bottom: 20px;">
            <h2 style="color: #333;">Verificar seu email</h2>
            <p style="color: #666; font-size: 16px;">
              Olá ${user.name || user.email},
            </p>
            <p style="color: #666; font-size: 16px;">
              Obrigado por se cadastrar no VentusHub! Para completar seu cadastro, precisamos verificar seu email.
            </p>
            <div style="margin: 30px 0;">
              <a href="${verifyUrl}" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Verificar Email
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              Se você não criou uma conta, pode ignorar este email com segurança.
            </p>
          </div>
        </div>
        `
      );
    },
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
  },
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",
  baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000", 
  trustedOrigins: ["http://localhost:3000", "http://localhost:5173"],
});

export default auth;
export type Auth = typeof auth;