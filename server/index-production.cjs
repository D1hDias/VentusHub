// Servidor de produção em JavaScript - conversão do TypeScript
require('dotenv').config();

const express = require("express");
const cors = require("cors");
const { createServer } = require("http");

// Função de log simples
const log = (message) => console.log(message);

// ====================================================================
// VERIFICAÇÃO DE AMBIENTE
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
    
    // BANCO TEMPORARIAMENTE DESABILITADO ATÉ RESOLVERMOS IMPORTS
    log("⚠️ Banco temporariamente desabilitado - usando mock");

    // 1. Confiar no proxy reverso
    app.set('trust proxy', 1);

    // 2. Configuração de CORS
    const allowedOrigins = [
      'https://www.ventushub.com.br',
      'https://ventushub.com.br',
      'http://localhost:5000',
      'https://ventus-hub.onrender.com'
    ];

    const corsOptions = {
      origin: (origin, callback) => {
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

    // 3. Parsers de corpo de requisição
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    
    log("✅ Middlewares configurados");

    // 4. Rotas básicas (sem auth por enquanto)
    app.get('/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        version: '1.0.0-production'
      });
    });

    app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'ok', 
        database: 'mock', 
        timestamp: new Date().toISOString() 
      });
    });

    // Middleware de tratamento de erros
    app.use((err, req, res, next) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      
      console.error(`❌ Erro ${status} em ${req.method} ${req.path}:`, message);
      
      res.status(status).json({ 
        message, 
        path: req.path, 
        method: req.method 
      });
    });

    // 5. Servir arquivos estáticos em produção
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static("dist/public"));
      
      // Catch-all handler: enviar back to index.html
      app.get("*", (req, res) => {
        res.sendFile("index.html", { root: "dist/public" });
      });
    }

    log("✅ Rotas configuradas");

    // Iniciar o servidor
    const port = parseInt(process.env.PORT || "5000");
    const host = "0.0.0.0";
    
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