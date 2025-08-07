import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { setupAuth, setupAuthRoutes } from "./auth.js";
import { registerApiRoutes } from "./routes.js"; // Renomeado para maior clareza
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

  // 5. Registro de Rotas da API
  setupAuthRoutes(app); // Rotas de autenticação
  registerApiRoutes(app); // Outras rotas da API
  log("✅ Rotas registradas");

  // 6. Middleware de tratamento de erros (opcional, mas boa prática)
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    console.error(`❌ Erro ${status} em ${req.method} ${req.path}:`, err);
    console.error("Stack:", err.stack);
    
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
