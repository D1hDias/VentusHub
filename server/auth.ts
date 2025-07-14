// server/auth.ts

import type { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import connectPgSimple from "connect-pg-simple";
import { storage } from "./storage";
import { pool } from "./db"; // Importar o pool de conexão do Neon

// Configuração da sessão
export function setupAuth(app: Express) {
  const isProduction = process.env.NODE_ENV === 'production';
  const PgSession = connectPgSimple(session);

  const store = new PgSession({
    pool: pool, // Usar o pool de conexão existente
    tableName: 'user_sessions', // Nome da tabela para armazenar sessões
    createTableIfMissing: true,
  });

  app.use(
    session({
      store: store, // Usar o armazenamento do PostgreSQL
      secret: process.env.SESSION_SECRET || "default-secret-key-that-is-long-and-secure",
      resave: false,
      saveUninitialized: false,
      name: "connect.sid",
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
        sameSite: "lax",
        path: "/",
        domain: isProduction ? ".ventushub.com.br" : undefined,
      },
    })
  );
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

      console.log("=== LOGIN DEBUG ===");
      console.log("Session created:", req.session.user);
      console.log("Session ID:", req.sessionID);
      console.log("Session:", req.session);
      console.log("==================");

      // Salvar sessão explicitamente
      req.session.save((err: any) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ message: "Erro ao salvar sessão" });
        }

        console.log("Session saved successfully");
        console.log("Headers before response:", res.getHeaders());
        
        // Forçar definição do cookie manualmente
        res.cookie('connect.sid', req.sessionID, {
          httpOnly: true,
          secure: false,
          sameSite: 'lax',
          path: '/',
          maxAge: 24 * 60 * 60 * 1000
        });
        
        console.log("Cookie set manually");
        console.log("Headers after cookie:", res.getHeaders());
        
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
  app.get("/api/auth/user", (req: any, res: any, next: any) => {
    // DEBUG: Logar cabeçalhos e sessão recebidos
    console.log("\n--- DEBUG INCOMING REQUEST /api/auth/user ---");
    console.log("TIMESTAMP:", new Date().toISOString());
    console.log("HEADERS RECEBIDOS:", JSON.stringify(req.headers, null, 2));
    console.log("SESSÃO RECEBIDA:", req.session);
    console.log("--- FIM DEBUG ---\n");

    isAuthenticated(req, res, next);
  }, async (req: any, res: any) => {
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
}