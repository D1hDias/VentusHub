/**
 * Email Service - VentusHub
 * Powered by Resend for reliable email delivery
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration
const EMAIL_CONFIG = {
  from: `${process.env.RESEND_FROM_NAME || 'VentusHub'} <${process.env.RESEND_FROM_EMAIL || 'noreply@ventushub.com.br'}>`,
  replyTo: process.env.RESEND_REPLY_TO || 'contato@ventushub.com.br'
};

export interface B2BCredentialsEmailData {
  name: string;
  email: string;
  tempPassword: string;
  userType: 'CORRETOR_AUTONOMO' | 'IMOBILIARIA';
  businessName?: string;
}

/**
 * Send B2B user credentials via email
 */
export async function sendB2BCredentials(data: B2BCredentialsEmailData): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const userTypeLabel = data.userType === 'CORRETOR_AUTONOMO' ? 'Corretor Autônomo' : 'Imobiliária';
    const businessInfo = data.businessName ? `<p><strong>Empresa:</strong> ${data.businessName}</p>` : '';

    const emailResult = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [data.email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🎉 Bem-vindo ao VentusHub - Portal de Parceiros`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #001f3f 0%, #004286 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .credentials { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🏢 VentusHub</h1>
              <h2>Portal de Parceiros</h2>
              <p>Bem-vindo(a), ${data.name}!</p>
            </div>
            
            <div class="content">
              <h3>🎉 Sua conta foi criada com sucesso!</h3>
              
              <p>Olá <strong>${data.name}</strong>,</p>
              
              <p>Seja muito bem-vindo(a) ao <strong>VentusHub Portal de Parceiros</strong>! Sua conta como <strong>${userTypeLabel}</strong> foi criada e está pronta para uso.</p>
              
              ${businessInfo}
              
              <div class="credentials">
                <h4>🔐 Suas credenciais de acesso:</h4>
                <p><strong>Email:</strong> ${data.email}</p>
                <p><strong>Senha temporária:</strong> <code style="background: #e9ecef; padding: 4px 8px; border-radius: 4px; font-family: monospace;">${data.tempPassword}</code></p>
              </div>
              
              <div class="warning">
                <h4>⚠️ IMPORTANTE - Segurança</h4>
                <ul>
                  <li><strong>Altere sua senha</strong> no primeiro acesso</li>
                  <li><strong>Não compartilhe</strong> essas credenciais</li>
                  <li><strong>Guarde em local seguro</strong> essas informações</li>
                </ul>
              </div>
              
              <div style="text-align: center;">
                <a href="https://ventushub.com.br/b2b" class="button">🚀 Acessar Plataforma</a>
              </div>
              
              <h4>📋 O que você pode fazer na plataforma:</h4>
              <ul>
                <li>📊 Acompanhar seus imóveis e negociações</li>
                <li>💰 Utilizar simuladores financeiros</li>
                <li>📋 Gerenciar clientes e propostas</li>
                <li>📈 Acompanhar comissões e metas</li>
                <li>📄 Gerar relatórios personalizados</li>
              </ul>
              
              <hr style="margin: 30px 0; border: none; border-top: 1px solid #e1e5e9;">
              
              <p><strong>Precisa de ajuda?</strong></p>
              <p>Nossa equipe está aqui para ajudar: <a href="mailto:suporte@ventushub.com.br">suporte@ventushub.com.br</a></p>
              <p>WhatsApp: <a href="https://wa.me/5511999999999">(11) 99999-9999</a></p>
            </div>
            
            <div class="footer">
              <p><strong>VentusHub - Portal de Parceiros</strong></p>
              <p>Sistema completo de gestão imobiliária</p>
              <p>© ${new Date().getFullYear()} VentusHub. Todos os direitos reservados.</p>
              <p style="margin-top: 15px;">
                <a href="#">Política de Privacidade</a> | 
                <a href="#">Termos de Uso</a> | 
                <a href="#">Suporte</a>
              </p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (emailResult.error) {
      console.error('❌ Resend email error:', emailResult.error);
      return { success: false, error: emailResult.error.message };
    }

    console.log('✅ Email sent successfully:', emailResult.data?.id);
    return { success: true };

  } catch (error: any) {
    console.error('❌ Email service error:', error);
    return { success: false, error: error.message || 'Failed to send email' };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordReset(email: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `https://ventushub.com.br/reset-password?token=${resetToken}`;

    const emailResult = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '🔐 VentusHub - Redefinição de Senha',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #dc3545; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .button { display: inline-block; background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinição de Senha</h1>
              <p>VentusHub Portal de Parceiros</p>
            </div>
            
            <div class="content">
              <h3>Solicitação de redefinição de senha</h3>
              
              <p>Você solicitou a redefinição da sua senha no VentusHub Portal de Parceiros.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔄 Redefinir Senha</a>
              </div>
              
              <div class="warning">
                <h4>⚠️ Informações importantes:</h4>
                <ul>
                  <li>Este link é válido por <strong>1 hora</strong></li>
                  <li>Se você não solicitou, ignore este email</li>
                  <li>Sua senha atual continua válida até você alterá-la</li>
                </ul>
              </div>
              
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${resetUrl}
              </p>
            </div>
            
            <div class="footer">
              <p><strong>VentusHub - Portal de Parceiros</strong></p>
              <p>© ${new Date().getFullYear()} VentusHub. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (emailResult.error) {
      console.error('❌ Resend reset email error:', emailResult.error);
      return { success: false, error: emailResult.error.message };
    }

    console.log('✅ Password reset email sent:', emailResult.data?.id);
    return { success: true };

  } catch (error: any) {
    console.error('❌ Password reset email error:', error);
    return { success: false, error: error.message || 'Failed to send reset email' };
  }
}

/**
 * Health check for email service
 */
export async function testEmailService(): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    // Test by getting Resend domains (doesn't send email)
    const domains = await resend.domains.list();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export default { sendB2BCredentials, sendPasswordReset, testEmailService };