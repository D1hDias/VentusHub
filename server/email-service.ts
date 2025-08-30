/**
 * Email Service - VentusHub
 * Powered by Resend for reliable email delivery
 */

import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

// Initialize Resend client only if API key is available
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Email configuration
const EMAIL_CONFIG = {
  // Use verified B2B subdomain for sending emails
  from: `${process.env.RESEND_FROM_NAME || 'VentusHub'} <noreply@app.ventushub.com.br>`,
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
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const userTypeLabel = data.userType === 'CORRETOR_AUTONOMO' ? 'Corretor Autônomo' : 'Imobiliária';
    const businessInfo = data.businessName ? `<p style="margin: 15px 0;"><strong>Empresa:</strong> ${data.businessName}</p>` : '';

    const emailResult = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [data.email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: `🎉 Bem-vindo à Ventus - Portal de Parceiros`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Bem-vindo à Ventus - Portal de Parceiros</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
              line-height: 1.6; 
              color: #333333; 
              background-color: #f5f5f5;
              margin: 0;
              padding: 0;
            }
            
            .email-container { 
              max-width: 600px; 
              margin: 20px auto; 
              background: white; 
              border-radius: 12px; 
              overflow: hidden;
              box-shadow: 0 4px 20px rgba(0, 31, 63, 0.15);
            }
            
            .header { 
              background: linear-gradient(135deg, #001f3f 0%, #003366 100%); 
              color: white; 
              padding: 40px 30px; 
              text-align: center;
              position: relative;
            }
            
            .logo-section {
              margin-bottom: 20px;
            }
            
            .company-name {
              font-size: 32px;
              font-weight: 700;
              margin: 0;
              letter-spacing: -1px;
            }
            
            .tagline {
              font-size: 16px;
              opacity: 0.9;
              margin: 8px 0 0 0;
              font-weight: 400;
            }
            
            .welcome-title {
              font-size: 20px;
              margin: 25px 0 0 0;
              font-weight: 600;
            }
            
            .content { 
              background: white; 
              padding: 40px 30px; 
            }
            
            .greeting {
              font-size: 18px;
              margin-bottom: 20px;
              color: #001f3f;
              font-weight: 600;
            }
            
            .intro-text {
              margin-bottom: 30px;
              font-size: 16px;
              line-height: 1.7;
            }
            
            .credentials-box { 
              background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); 
              border: 2px solid #001f3f;
              padding: 25px; 
              border-radius: 10px; 
              margin: 25px 0;
            }
            
            .credentials-title {
              color: #001f3f;
              margin-bottom: 15px;
              font-size: 18px;
              font-weight: 600;
            }
            
            .credential-item {
              margin: 12px 0;
              font-size: 16px;
            }
            
            .password-code {
              background: #001f3f; 
              color: white; 
              padding: 8px 12px; 
              border-radius: 6px; 
              font-family: 'Courier New', monospace;
              font-weight: 600;
              font-size: 18px;
              letter-spacing: 1px;
            }
            
            .warning-box { 
              background: linear-gradient(135deg, #fff8e1 0%, #fff3c4 100%); 
              border-left: 4px solid #fdd700; 
              padding: 20px; 
              border-radius: 8px; 
              margin: 25px 0;
            }
            
            .warning-title {
              color: #e65100;
              margin-bottom: 12px;
              font-weight: 600;
              font-size: 16px;
            }
            
            .warning-list {
              margin: 0;
              padding-left: 20px;
            }
            
            .warning-list li {
              margin: 8px 0;
              color: #bf360c;
            }
            
            .cta-section { 
              text-align: center; 
              margin: 35px 0;
            }
            
            .cta-button { 
              display: inline-block; 
              background: linear-gradient(135deg, #001f3f 0%, #003366 100%);
              color: white; 
              padding: 16px 40px; 
              text-decoration: none; 
              border-radius: 8px; 
              font-weight: 600;
              font-size: 16px;
              transition: transform 0.2s ease;
            }
            
            .cta-button:hover {
              transform: translateY(-2px);
            }
            
            .features-section {
              margin: 35px 0;
            }
            
            .features-title {
              color: #001f3f;
              margin-bottom: 20px;
              font-size: 18px;
              font-weight: 600;
            }
            
            .features-list {
              list-style: none;
              padding: 0;
              margin: 0;
            }
            
            .features-list li {
              padding: 8px 0;
              border-bottom: 1px solid #f0f0f0;
              font-size: 15px;
            }
            
            .features-list li:last-child {
              border-bottom: none;
            }
            
            .divider {
              height: 1px;
              background: linear-gradient(90deg, transparent 0%, #e0e0e0 50%, transparent 100%);
              margin: 40px 0;
              border: none;
            }
            
            .support-section {
              background: #f8f9fa;
              padding: 25px;
              border-radius: 8px;
              margin: 30px 0;
            }
            
            .support-title {
              color: #001f3f;
              margin-bottom: 15px;
              font-weight: 600;
            }
            
            .contact-item {
              margin: 12px 0;
              font-size: 15px;
            }
            
            .contact-item a {
              color: #001f3f;
              text-decoration: none;
              font-weight: 600;
            }
            
            .footer { 
              background: linear-gradient(135deg, #001f3f 0%, #003366 100%); 
              color: white; 
              padding: 30px;
              text-align: center;
            }
            
            .footer-company {
              font-size: 18px;
              font-weight: 600;
              margin-bottom: 8px;
            }
            
            .footer-address {
              font-size: 14px;
              opacity: 0.9;
              margin: 15px 0;
              line-height: 1.5;
            }
            
            .footer-links {
              margin-top: 20px;
              font-size: 12px;
            }
            
            .footer-links a {
              color: white;
              text-decoration: none;
              margin: 0 10px;
              opacity: 0.8;
            }
            
            .footer-links a:hover {
              opacity: 1;
            }
            
            @media only screen and (max-width: 600px) {
              .email-container { margin: 0; border-radius: 0; }
              .content, .header, .footer { padding: 25px 20px; }
              .company-name { font-size: 28px; }
              .credentials-box, .warning-box, .support-section { margin: 20px 0; padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <div class="logo-section">
                <h1 class="company-name">Ventus</h1>
                <p class="tagline">Assessoria de Crédito</p>
              </div>
              <h2 class="welcome-title">Portal de Parceiros</h2>
            </div>
            
            <div class="content">
              <div class="greeting">🎉 Sua conta foi criada com sucesso!</div>
              
              <p class="intro-text">
                Olá <strong>${data.name}</strong>,<br><br>
                Seja muito bem-vindo(a) ao <strong>Portal de Parceiros da Ventus</strong>! 
                Sua conta como <strong>${userTypeLabel}</strong> foi criada e está pronta para uso.
              </p>
              
              ${businessInfo}
              
              <div class="credentials-box">
                <h4 class="credentials-title">🔐 Suas credenciais de acesso</h4>
                <div class="credential-item"><strong>Email:</strong> ${data.email}</div>
                <div class="credential-item">
                  <strong>Senha temporária:</strong> 
                  <span class="password-code">${data.tempPassword}</span>
                </div>
              </div>
              
              <div class="warning-box">
                <h4 class="warning-title">⚠️ IMPORTANTE - Segurança da sua conta</h4>
                <ul class="warning-list">
                  <li><strong>Altere sua senha</strong> no primeiro acesso por segurança</li>
                  <li><strong>Não compartilhe</strong> essas credenciais com terceiros</li>
                  <li><strong>Guarde em local seguro</strong> essas informações de acesso</li>
                </ul>
              </div>
              
              <div class="cta-section">
                <a href="https://app.ventushub.com.br" class="cta-button">🚀 Acessar Plataforma Agora</a>
              </div>
              
              <div class="features-section">
                <h4 class="features-title">📋 Recursos disponíveis na plataforma</h4>
                <ul class="features-list">
                  <li>📊 Acompanhar seus imóveis e negociações em tempo real</li>
                  <li>💰 Utilizar mais de 15 simuladores financeiros especializados</li>
                  <li>📋 Gerenciar clientes, propostas e documentos</li>
                  <li>📈 Acompanhar comissões, metas e performance</li>
                  <li>📄 Gerar relatórios personalizados e análises</li>
                  <li>🤝 Acesso a parcerias e oportunidades de negócio</li>
                </ul>
              </div>
              
              <hr class="divider">
              
              <div class="support-section">
                <h4 class="support-title">💬 Precisa de ajuda ou suporte?</h4>
                <div class="contact-item">
                  📧 Email: <a href="mailto:contato@ventushub.com.br">contato@ventushub.com.br</a>
                </div>
                <div class="contact-item">
                  📱 WhatsApp: <a href="https://wa.me/5521998060863" target="_blank">(21) 99806-0863</a>
                </div>
                <div class="contact-item">
                  🕒 Horário de atendimento: Segunda a Sexta, 9h às 20h
                </div>
                <div class="contact-item">
                  📱 Instagram: <a href="https://instagram.com/ventushub" target="_blank">@ventushub</a>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-company">Ventus - Assessoria de Crédito</div>
              <div class="footer-address">
                Avenida Embaixador Abelardo Bueno, 8500, sala 820<br>
                Barra Olímpica - Rio de Janeiro/RJ
              </div>
              <div class="footer-address">
                🌐 <a href="http://www.ventushub.com.br" style="color: white;">www.ventushub.com.br</a>
              </div>
              <div style="margin: 15px 0; font-size: 12px; opacity: 0.8;">
                © ${new Date().getFullYear()} Ventus. Todos os direitos reservados.
              </div>
              <div class="footer-links">
                <a href="https://app.ventushub.com.br/privacy">Política de Privacidade</a>
                <a href="https://app.ventushub.com.br/terms">Termos de Uso</a>
                <a href="mailto:contato@ventushub.com.br">Suporte</a>
              </div>
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
    if (!process.env.RESEND_API_KEY || !resend) {
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
    if (!process.env.RESEND_API_KEY || !resend) {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    // Test by getting Resend domains (doesn't send email)
    const domains = await resend.domains.list();
    
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Send B2B password reset email (specific to B2B users)
 */
export async function sendB2BPasswordEmail(email: string, resetToken: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY || !resend) {
      console.error('❌ RESEND_API_KEY not configured');
      return { success: false, error: 'Email service not configured' };
    }

    const resetUrl = `https://app.ventushub.com.br/reset-password?token=${resetToken}`;

    const emailResult = await resend.emails.send({
      from: EMAIL_CONFIG.from,
      to: [email],
      replyTo: EMAIL_CONFIG.replyTo,
      subject: '🔐 VentusHub B2B - Redefinição de Senha',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #001f3f; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: white; padding: 30px; border: 1px solid #e1e5e9; }
            .button { display: inline-block; background: #001f3f; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 20px 0; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; margin: 20px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 8px 8px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Redefinição de Senha B2B</h1>
              <p>VentusHub Portal de Parceiros</p>
            </div>
            
            <div class="content">
              <h3>Solicitação de redefinição de senha - Conta B2B</h3>
              
              <p>Você solicitou a redefinição da sua senha no VentusHub Portal de Parceiros B2B.</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="button">🔄 Redefinir Senha B2B</a>
              </div>
              
              <div class="warning">
                <h4>⚠️ Informações importantes:</h4>
                <ul>
                  <li>Este link é válido por <strong>1 hora</strong></li>
                  <li>Se você não solicitou, ignore este email</li>
                  <li>Sua senha atual continua válida até você alterá-la</li>
                  <li>Esta solicitação é específica para contas B2B</li>
                </ul>
              </div>
              
              <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
              <p style="word-break: break-all; background: #f8f9fa; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
                ${resetUrl}
              </p>
            </div>
            
            <div class="footer">
              <p><strong>VentusHub - Portal de Parceiros B2B</strong></p>
              <p>© ${new Date().getFullYear()} VentusHub. Todos os direitos reservados.</p>
            </div>
          </div>
        </body>
        </html>
      `
    });

    if (emailResult.error) {
      console.error('❌ Resend B2B reset email error:', emailResult.error);
      return { success: false, error: emailResult.error.message };
    }

    console.log('✅ B2B password reset email sent:', emailResult.data?.id);
    return { success: true };

  } catch (error: any) {
    console.error('❌ B2B password reset email error:', error);
    return { success: false, error: error.message || 'Failed to send B2B reset email' };
  }
}

// Export emailService object
export const emailService = {
  sendB2BCredentials,
  sendPasswordReset,
  sendB2BPasswordEmail,
  testEmailService
};

export default { sendB2BCredentials, sendPasswordReset, sendB2BPasswordEmail, testEmailService };