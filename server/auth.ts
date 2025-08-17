// server/auth.ts

import type { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage.js";
import { pool } from "./db.js"; // Importar o pool de conexão do Neon

// Configuração da sessão
export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isDevelopment = process.env.NODE_ENV === 'development';

  let sessionConfig: any = {
    secret: process.env.SESSION_SECRET || "default-secret-key-that-is-long-and-secure",
    resave: false,
    saveUninitialized: false,
    name: "connect.sid",
    genid: () => randomBytes(16).toString('hex'),
    cookie: {
      secure: isProduction,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
      sameSite: isProduction ? "none" : "lax",
      path: "/",
      domain: isProduction ? ".ventushub.com.br" : undefined,
    },
  };

  // Configuração robusta do store de sessão
  if (pool) {
    try {
      const PgSession = connectPgSimple(session);
      const store = new PgSession({
        pool: pool,
        tableName: 'sessions',
        createTableIfMissing: true,
        pruneSessionInterval: false,
        // Configurações de timeout mais robustas
        ttl: 86400, // 24 horas em segundos
        schemaName: 'public',
        errorLog: (error: any) => {
          // Só logar erros críticos, ignorar timeouts menores
          if (!error.message.includes('timeout') && !error.message.includes('Connection terminated')) {
            console.warn('⚠️ Session store warning:', error.message);
          }
        }
      });
      
      // Middleware de fallback para erros de sessão
      const originalTouch = store.touch;
      store.touch = function(sid: string, sess: any, callback: Function) {
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session touch timeout')), 3000)
        );
        
        Promise.race([
          new Promise(resolve => originalTouch.call(this, sid, sess, resolve)),
          timeoutPromise
        ]).then(() => callback()).catch(() => {
          // Falha silenciosa em caso de timeout
          callback();
        });
      };
      
      sessionConfig.store = store;
      console.log("✅ Sessão usando PostgreSQL store com fallback");
    } catch (error) {
      console.log("⚠️ Fallback para sessão em memória:", error.message);
    }
  } else {
    console.log("⚠️ Usando sessão em memória (desenvolvimento ou sem banco)");
  }

  app.use(session(sessionConfig));
}

// Middleware de autenticação
export function isAuthenticated(req: any, res: any, next: any) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
}

// Rotas de autenticação
export function setupAuthRoutes(app: Express) {
  console.log("🔧 Registrando rotas de autenticação legadas...");
  // Health check para autenticação
  app.get("/api/auth/status", (req: any, res: any) => {
    const isLoggedIn = !!(req.session && req.session.user);
    res.json({ 
      authenticated: isLoggedIn,
      user: isLoggedIn ? req.session.user : null,
      sessionId: req.sessionID || null
    });
  });

  // Registro
  app.post("/api/auth/register", async (req: any, res: any) => {
    try {
      const { firstName, lastName, email, password, cpf, creci, phone } = req.body;

      // Verificar se o usuário já existe
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "E-mail já cadastrado" });
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 10);

      // Criar usuário
      const user = await storage.createUser({
        firstName,
        lastName,
        email,
        password: hashedPassword,
        cpf,
        creci,
        phone,
      });

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "Usuário criado com sucesso",
        user: userWithoutPassword,
      });
    } catch (error: any) {
      console.error("=== ERROR REGISTERING USER ===");
      console.error("Error:", error);
      console.error("Stack:", error instanceof Error ? error.stack : "No stack");
      console.error("Request body:", req.body);
      console.error("================================");
      
      // Tratar erros de duplicação do PostgreSQL
      if (error.code === '23505') {
        if (error.constraint === 'users_email_unique') {
          return res.status(400).json({ message: "E-mail já cadastrado" });
        }
        if (error.constraint === 'users_cpf_unique') {
          return res.status(400).json({ message: "CPF já cadastrado" });
        }
        if (error.constraint === 'users_creci_unique') {
          return res.status(400).json({ message: "CRECI já cadastrado" });
        }
      }
      
      const errorMessage = error instanceof Error ? error.message : "Erro desconhecido";
      res.status(500).json({ 
        message: "Erro interno do servidor", 
        error: errorMessage,
        details: process.env.NODE_ENV === "development" ? error : undefined
      });
    }
  });

  // Login
  app.post("/api/auth/login", async (req: any, res: any) => {
    console.log("🔑 Login attempt received:", { email: req.body?.email, hasPassword: !!req.body?.password });
    try {
      const { email, password } = req.body;

      // Buscar usuário
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(400).json({ message: "E-mail ou senha incorretos" });
      }

      // Verificar senha
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(400).json({ message: "E-mail ou senha incorretos" });
      }

      // Criar sessão
      req.session.user = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        creci: user.creci,
      };

      // Salvar sessão explicitamente
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao salvar sessão" });
        }

        // Remover senha da resposta
        const { password: _, ...userWithoutPassword } = user;

        res.json({
          message: "Login realizado com sucesso",
          user: userWithoutPassword,
        });
      });
    } catch (error) {
      console.error("Error logging in:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Logout
  app.post("/api/auth/logout", (req: any, res: any) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Erro ao fazer logout" });
      }
      res.clearCookie("connect.sid");
      res.json({ message: "Logout realizado com sucesso" });
    });
  });

  // Verificar usuário atual
  app.get("/api/auth/user", isAuthenticated, async (req: any, res: any) => {
    try {
      const userId = req.session.user.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  
  console.log("✅ Rotas de autenticação legadas registradas: /api/auth/status, /api/auth/register, /api/auth/login, /api/auth/logout, /api/auth/user");
}