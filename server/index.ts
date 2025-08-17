import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { setupAuth, setupAuthRoutes } from "./auth.js";
import { setupBetterAuthRoutes } from "./better-auth-routes.js";
import { registerApiRoutes } from "./routes.js"; // Renomeado para maior clareza
import { initializeDB } from "./db.js";
import { initCRMServices } from "./crm-service.js";
// Vite imports condicionais

// Função de log simples
const log = (message: string) => console.log(message);

// ====================================================================
// VERIFICAÇÃO DE AMBIENTE - VERIFIQUE ESTE LOG NO SEU SERVIDOR
log(`

*** O servidor está rodando em modo: [${process.env.NODE_ENV || 'INDEFINIDO'}] ***

`);
// ====================================================================

(async () => {
  try {
    log("🚀 Iniciando servidor...");
    
    const app = express();
    const httpServer = createServer(app);

    log("✅ Express criado");
    
    // 0. Inicializar banco de dados
    try {
      await initializeDB();
      log("✅ Banco de dados inicializado");
    } catch (error) {
      log(`❌ Erro fatal na inicialização do banco: ${error.message}`);
      process.exit(1);
    }

    // 1. Confiar no proxy reverso (essencial para o secure cookie em produção)
    app.set('trust proxy', 1);

  // 2. Configuração de CORS (deve vir antes da sessão e das rotas)
  const allowedOrigins = [
    'https://www.ventushub.com.br',
    'https://ventushub.com.br',
    'http://localhost:5000',
    'https://ventus-hub.onrender.com'
  ];

  const corsOptions = {
    origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
      if (!origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  };

  app.use(cors(corsOptions));
  log("✅ CORS configurado");

  // 3. Configuração da Sessão (essencial antes das rotas)
  setupAuth(app);
  log("✅ Auth configurado");

  // 4. Parsers de corpo de requisição
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Logs de requisições removidos para terminal limpo
  
  log("✅ Middlewares configurados");

  // Middleware para logar requisições problemáticas
  app.use((req: Request, res: Response, next: NextFunction) => {
    // Só logar rotas que podem causar timeout
    if (req.path.includes('/api/') || req.path.includes('/@vite/')) {
      console.log(`📥 ${req.method} ${req.path}`);
    }
    next();
  });

  // 5. Registro de Rotas da API
  
  // Rota de teste para verificar se o servidor está funcionando
  app.get('/api/health', (req, res) => {
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      message: 'Server is running',
      environment: process.env.NODE_ENV || 'development'
    });
  });
  
  setupBetterAuthRoutes(app); // Better Auth routes (PRIMEIRO!)
  setupAuthRoutes(app); // Rotas de autenticação legadas
  registerApiRoutes(app); // Outras rotas da API
  
  // 6. Inicializar serviços CRM
  try {
    initCRMServices();
    log("✅ Serviços CRM inicializados");
  } catch (error) {
    log(`⚠️ Erro ao inicializar serviços CRM: ${error.message}`);
  }
  log("✅ Rotas registradas");

  // 6. Middleware de tratamento de erros com tratamento especial para timeouts
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    let message = err.message || "Internal Server Error";
    
    // Tratamento especial para erros de timeout do Neon
    if (err.message && (
      err.message.includes('Connection terminated due to connection timeout') ||
      err.message.includes('WebSocket was closed before the connection was established') ||
      err.message.includes('timeout')
    )) {
      console.warn(`⚠️ Timeout de banco em ${req.method} ${req.path} - usando fallback`);
      message = "Serviço temporariamente indisponível - tente novamente";
      
      // Para requisições do Vite client, retornar resposta mais amigável
      if (req.path.includes('/@vite/client') || req.path.includes('vite')) {
        return res.status(200).json({ status: 'ok', message: 'Development server running' });
      }
      
      return res.status(503).json({ 
        message,
        path: req.path,
        method: req.method,
        retry: true 
      });
    }
    
    // Log normal para outros erros
    console.error(`❌ Erro ${status} em ${req.method} ${req.path}:`, message);
    if (process.env.NODE_ENV === 'development') {
      console.error("Stack:", err.stack);
    }
    
    res.status(status).json({ message, path: req.path, method: req.method });
  });

  // 7. Configuração do Vite ou Servidor Estático (deve vir por último)
  if (process.env.NODE_ENV === "development") {
    try {
      const { setupVite } = await import("./vite.js");
      await setupVite(app, httpServer);
      log("✅ Vite configurado com sucesso");
    } catch (error) {
      console.error("❌ Erro no Vite:", error.message);
      console.error("Stack:", error.stack);
      
      // Modo desenvolvimento simples sem Vite
      app.get("*", (req, res) => {
        res.send(`
          <html>
            <head><title>VentusHub - Dev Mode</title></head>
            <body>
              <h1>VentusHub - Servidor de Desenvolvimento</h1>
              <p>APIs disponíveis em <a href="/api/">/api/</a></p>
              <p>Para frontend completo, configure o Vite.</p>
              <p>Erro: ${error.message}</p>
            </body>
          </html>
        `);
      });
    }
  } else {
    // Servir arquivos estáticos em produção
    app.use(express.static("dist/public"));
    
    // Catch-all handler: enviar back to index.html
    app.get("*", (req, res) => {
      res.sendFile("index.html", { root: "dist/public" });
    });
  }

  // Iniciar o servidor
  const port = parseInt(process.env.PORT || "5000");
  const host = "0.0.0.0"; // Configuração original
  
  log(`🔧 Variáveis: PORT=${process.env.PORT}, port=${port}`);
  
  httpServer.listen(port, host, () => {
    log(`✅ Server listening on ${host}:${port}`);
    log(`🌐 Acesse: http://localhost:${port}`);
    log(`🔧 Host: ${host}, Port: ${port}`);
  });

} catch (error) {
  console.error("❌ Erro fatal no servidor:", error);
  process.exit(1);
}

})();
