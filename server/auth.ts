import type { Express } from "express";
import session from "express-session";
import bcrypt from "bcryptjs";
import { storage } from "./storage";

// Configuração da sessão
export function setupAuth(app: Express) {
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "default-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000, // 24 horas
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
    } catch (error) {
      console.error("Error registering user:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
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

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login realizado com sucesso",
        user: userWithoutPassword,
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
}