import type { Express } from "express";
import { db } from "./db.js";
import { eq, desc } from "drizzle-orm";
import { users, userSettings, activityLogs } from "../shared/schema.js";
import multer from "multer";
import path from "path";
import fs from "fs";
import { createNotification } from "./notifications.js";

// Configurar multer para upload de avatar
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    const uploadDir = './uploads/avatars';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req: any, file: any, cb: any) => {
    const userId = req.session.user.id;
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${userId}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use JPG, PNG, GIF ou WebP.'));
    }
  }
});

export function setupProfile(app: Express) {

  // Get user profile
  app.get("/api/profile", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;
      
      // Buscar dados do usuário
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));

      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Buscar configurações do usuário
      let [settings] = await db
        .select()
        .from(userSettings)
        .where(eq(userSettings.userId, userId));

      // Se não existir configurações, criar padrão
      if (!settings) {
        [settings] = await db
          .insert(userSettings)
          .values({ userId })
          .returning();
      }

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        user: userWithoutPassword,
        settings
      });

    } catch (error) {
      console.error("Error fetching profile:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update user profile
  app.patch("/api/profile", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;
      const { firstName, lastName, phone, cpf, creci, bio } = req.body;

      const [updatedUser] = await db
        .update(users)
        .set({
          firstName,
          lastName,
          phone,
          cpf,
          creci,
          bio,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        return res.status(404).json({ message: "Usuário não encontrado" });
      }

      // Log da atividade
      await db.insert(activityLogs).values({
        userId,
        action: 'updated',
        entity: 'profile',
        entityId: userId,
        description: 'Perfil atualizado',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Criar notificação
      await createNotification({
        userId,
        type: 'success',
        title: 'Perfil atualizado',
        message: 'Suas informações de perfil foram atualizadas com sucesso.',
        category: 'system'
      });

      // Remover senha da resposta
      const { password: _, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);

    } catch (error) {
      console.error("Error updating profile:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Upload avatar
  app.post("/api/profile/avatar", upload.single('avatar'), async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    try {
      const userId = req.session.user.id;
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;

      // Buscar avatar anterior para deletar
      const [currentUser] = await db
        .select({ avatarUrl: users.avatarUrl })
        .from(users)
        .where(eq(users.id, userId));

      // Atualizar URL do avatar no banco
      const [updatedUser] = await db
        .update(users)
        .set({
          avatarUrl,
          updatedAt: new Date()
        })
        .where(eq(users.id, userId))
        .returning();

      // Deletar avatar anterior se existir
      if (currentUser?.avatarUrl) {
        const oldAvatarPath = path.join('.', currentUser.avatarUrl);
        if (fs.existsSync(oldAvatarPath)) {
          fs.unlinkSync(oldAvatarPath);
        }
      }

      // Log da atividade
      await db.insert(activityLogs).values({
        userId,
        action: 'updated',
        entity: 'avatar',
        entityId: userId,
        description: 'Avatar atualizado',
        ipAddress: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Criar notificação
      await createNotification({
        userId,
        type: 'success',
        title: 'Avatar atualizado',
        message: 'Seu avatar foi atualizado com sucesso.',
        category: 'system'
      });

      res.json({ avatarUrl });

    } catch (error) {
      console.error("Error uploading avatar:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update user settings
  app.patch("/api/profile/settings", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;
      const settingsData = req.body;

      const [updatedSettings] = await db
        .update(userSettings)
        .set({
          ...settingsData,
          updatedAt: new Date()
        })
        .where(eq(userSettings.userId, userId))
        .returning();

      if (!updatedSettings) {
        return res.status(404).json({ message: "Configurações não encontradas" });
      }

      res.json(updatedSettings);

    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get activity logs
  app.get("/api/profile/activity", async (req: any, res: any) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Não autorizado" });
    }

    try {
      const userId = req.session.user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;

      const activities = await db
        .select()
        .from(activityLogs)
        .where(eq(activityLogs.userId, userId))
        .orderBy(desc(activityLogs.createdAt))
        .limit(limit)
        .offset(offset);

      res.json({
        activities,
        pagination: {
          page,
          limit,
          hasMore: activities.length === limit
        }
      });

    } catch (error) {
      console.error("Error fetching activity logs:", error);
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
}