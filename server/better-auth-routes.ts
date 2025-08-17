import type { Express } from "express";
import { auth } from "./better-auth";

export function setupBetterAuthRoutes(app: Express) {
  console.log('🔧 Configurando rotas Better Auth...');
  
  // Endpoint de teste para listar rotas disponíveis do Better Auth
  app.get("/api/auth-debug", (req, res) => {
    res.json({
      message: "Better Auth está ativo",
      availableRoutes: [
        "POST /api/auth/sign-in/email",
        "POST /api/auth/sign-up/email", 
        "POST /api/auth/forget-password",
        "POST /api/auth/reset-password",
        "GET /api/auth/session"
      ],
      timestamp: new Date().toISOString()
    });
  });
  
  // Better Auth API routes - specific routes only to avoid conflicts with legacy auth
  const betterAuthRoutes = [
    '/api/auth/sign-in/email',
    '/api/auth/sign-up/email',
    '/api/auth/forget-password',
    '/api/auth/reset-password',
    '/api/auth/session'
  ];
  
  betterAuthRoutes.forEach(route => {
    app.all(route, async (req, res) => {
      console.log(`📞 Better Auth: ${req.method} ${req.path}`);
      
      // Remove the "/api" prefix for Better Auth
      const path = req.path.replace("/api", "");
      console.log(`🔄 Path corrigido: ${path}`);
      
      try {
        // Create a new request with the corrected path
        const filteredHeaders: Record<string, string> = {};
        Object.entries(req.headers).forEach(([key, value]) => {
          if (typeof value === 'string') {
            filteredHeaders[key] = value;
          } else if (Array.isArray(value)) {
            filteredHeaders[key] = value.join(', ');
          }
        });
        
        const request = new Request(`${req.protocol}://${req.get('host')}${path}`, {
          method: req.method,
          headers: {
            'Content-Type': 'application/json',
            ...filteredHeaders,
          },
          body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
        });

        console.log(`🚀 Enviando para Better Auth handler...`);
        const response = await auth.handler(request);
        console.log(`✅ Response status: ${response.status}`);
        
        // Set response headers
        response.headers.forEach((value, key) => {
          res.setHeader(key, value);
        });
        
        res.status(response.status);
        
        const contentType = response.headers.get('content-type');
        if (contentType?.includes('application/json')) {
          const data = await response.json();
          res.json(data);
        } else {
          const text = await response.text();
          res.send(text);
        }
      } catch (error) {
        console.error('❌ Better Auth error:', error);
        console.error('❌ Error details:', {
          message: error.message,
          stack: error.stack,
          path: req.path,
          method: req.method,
          body: req.body
        });
        res.status(500).json({ error: 'Internal server error', details: error.message });
      }
    });
  });

  // Better Auth routes for password reset pages
  app.get("/reset-password", (req, res) => {
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Token Inválido - VentusHub</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #e74c3c; }
              .logo { width: 120px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" class="logo">
            <h1 class="error">Token Inválido</h1>
            <p>O link para redefinição de senha é inválido ou expirou.</p>
            <p>Por favor, solicite um novo link de redefinição.</p>
            <a href="/login">Voltar ao Login</a>
          </body>
        </html>
      `);
    }

    // Redirect to frontend with token
    res.redirect(`/?reset-password=true&token=${token}`);
  });

  app.get("/verify-email", (req, res) => {
    const token = req.query.token;
    
    if (!token) {
      return res.status(400).send(`
        <html>
          <head>
            <title>Token Inválido - VentusHub</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <style>
              body { font-family: Arial, sans-serif; max-width: 500px; margin: 50px auto; padding: 20px; text-align: center; }
              .error { color: #e74c3c; }
              .logo { width: 120px; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <img src="https://i.ibb.co/GQgj134N/logo2.png" alt="VentusHub" class="logo">
            <h1 class="error">Token Inválido</h1>
            <p>O link de verificação de email é inválido ou expirou.</p>
            <a href="/login">Voltar ao Login</a>
          </body>
        </html>
      `);
    }

    // Redirect to frontend with token
    res.redirect(`/?verify-email=true&token=${token}`);
  });
}