import dotenv from 'dotenv';
dotenv.config();

import express, { type Request, Response, NextFunction } from "express";
import cors from "cors";
import { createServer } from "http";
import { setupAuth, setupAuthRoutes } from "./auth";
import { registerApiRoutes } from "./routes"; // Renomeado para maior clareza
import { setupVite, serveStatic, log } from "./vite";

// ====================================================================
// VERIFICAÇÃO DE AMBIENTE - VERIFIQUE ESTE LOG NO SEU SERVIDOR
log(`

*** O servidor está rodando em modo: [${process.env.NODE_ENV || 'INDEFINIDO'}] ***

`);
// ====================================================================

(async () => {
  const app = express();
  const httpServer = createServer(app);

  // 1. Confiar no proxy reverso (essencial para o secure cookie em produção)
  app.set('trust proxy', 1);

  // 2. Configuração de CORS (deve vir antes da sessão e das rotas)
  const allowedOrigins = [
    'https://ventushub.com.br',
    'https://www.ventushub.com.br',
    'http://localhost:5000' // Adicionado para desenvolvimento local
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

  // 3. Configuração da Sessão (essencial antes das rotas)
  setupAuth(app);

  // 4. Parsers de corpo de requisição
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 5. Registro de Rotas da API
  setupAuthRoutes(app); // Rotas de autenticação
  registerApiRoutes(app); // Outras rotas da API

  // 6. Middleware de tratamento de erros (opcional, mas boa prática)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  // 7. Configuração do Vite ou Servidor Estático (deve vir por último)
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, httpServer);
  } else {
    serveStatic(app);
  }

  // Iniciar o servidor
  const port = process.env.PORT || 5000;
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1";
  
  httpServer.listen(port, () => {
    log(`Server listening on port: ${port}`);
  });

})();

