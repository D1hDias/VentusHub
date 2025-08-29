/**
 * B2B ROUTES - Business-to-Business User Management
 * Routes for managing B2B user profiles, authentication and business operations
 */

import type { Express } from "express";
import { db } from './db.js';
import { user, b2bUserProfiles } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import { emailService } from './email-service.js';

export function setupB2BRoutes(app: Express) {
  
  // B2B User Profile Creation
  app.post("/api/b2b/users", async (req, res) => {
    try {
      const {
        email,
        name,
        userType,
        businessName,
        document,
        creci,
        tradeName,
        phone
      } = req.body;

      // Validate required fields
      if (!email || !name || !userType || !businessName || !document) {
        return res.status(400).json({
          success: false,
          error: 'Campos obrigatórios: email, name, userType, businessName, document'
        });
      }

      // Check if user already exists
      const existingUser = await db
        .select()
        .from(user)
        .where(eq(user.email, email))
        .limit(1);

      if (existingUser.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Usuário já existe com este email'
        });
      }

      // Create user in Better Auth user table
      const newUsers = await db
        .insert(user)
        .values({
          id: crypto.randomUUID(),
          name,
          email,
          role: 'B2B_USER'
        })
        .returning();

      const newUser = newUsers[0];

      // Create B2B profile
      const b2bProfile = await db
        .insert(b2bUserProfiles)
        .values({
          userId: newUser.id,
          userType,
          businessName,
          document,
          creci,
          tradeName,
          phone
        })
        .returning();

      // Send welcome email
      try {
        await emailService.sendB2BCredentials({
          email: newUser.email,
          name: newUser.name,
          businessName,
          userType,
          tempPassword: 'Temp123456' // In real implementation, generate secure temp password
        });
      } catch (emailError) {
        console.error('Failed to send B2B credentials email:', emailError);
      }

      res.json({
        success: true,
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          b2bProfile: b2bProfile[0]
        }
      });

    } catch (error) {
      console.error('B2B user creation error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Get B2B User Profile
  app.get("/api/b2b/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          // B2B Profile fields
          profileId: b2bUserProfiles.id,
          userType: b2bUserProfiles.userType,
          businessName: b2bUserProfiles.businessName,
          document: b2bUserProfiles.document,
          creci: b2bUserProfiles.creci,
          tradeName: b2bUserProfiles.tradeName,
          phone: b2bUserProfiles.phone
        })
        .from(user)
        .leftJoin(b2bUserProfiles, eq(user.id, b2bUserProfiles.userId))
        .where(eq(user.id, id))
        .limit(1);

      if (users.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Usuário não encontrado'
        });
      }

      const userData = users[0];
      
      res.json({
        success: true,
        user: {
          id: userData.id,
          name: userData.name,
          email: userData.email,
          role: userData.role,
          emailVerified: userData.emailVerified,
          isActive: userData.isActive,
          b2bProfile: userData.profileId ? {
            id: userData.profileId,
            userType: userData.userType,
            businessName: userData.businessName,
            document: userData.document,
            creci: userData.creci,
            tradeName: userData.tradeName,
            phone: userData.phone
          } : null
        }
      });

    } catch (error) {
      console.error('Get B2B user error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // List All B2B Users
  app.get("/api/b2b/users", async (req, res) => {
    try {
      const users = await db
        .select({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          createdAt: user.createdAt,
          // B2B Profile fields
          userType: b2bUserProfiles.userType,
          businessName: b2bUserProfiles.businessName,
          document: b2bUserProfiles.document,
          creci: b2bUserProfiles.creci
        })
        .from(user)
        .leftJoin(b2bUserProfiles, eq(user.id, b2bUserProfiles.userId))
        .where(eq(user.role, 'B2B_USER'));

      res.json({
        success: true,
        users
      });

    } catch (error) {
      console.error('List B2B users error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Update B2B User Profile
  app.put("/api/b2b/users/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;

      // Update user table
      if (updates.name || updates.email) {
        await db
          .update(user)
          .set({
            ...(updates.name && { name: updates.name }),
            ...(updates.email && { email: updates.email })
          })
          .where(eq(user.id, id));
      }

      // Update B2B profile
      if (updates.userType || updates.businessName || updates.document || updates.creci || updates.tradeName || updates.phone) {
        await db
          .update(b2bUserProfiles)
          .set({
            ...(updates.userType && { userType: updates.userType }),
            ...(updates.businessName && { businessName: updates.businessName }),
            ...(updates.document && { document: updates.document }),
            ...(updates.creci && { creci: updates.creci }),
            ...(updates.tradeName && { tradeName: updates.tradeName }),
            ...(updates.phone && { phone: updates.phone })
          })
          .where(eq(b2bUserProfiles.userId, id));
      }

      res.json({
        success: true,
        message: 'Usuário B2B atualizado com sucesso'
      });

    } catch (error) {
      console.error('Update B2B user error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });

  // Deactivate B2B User
  app.delete("/api/b2b/users/:id", async (req, res) => {
    try {
      const { id } = req.params;

      // Deactivate the B2B profile (user table doesn't have isActive field)
      await db
        .update(b2bUserProfiles)
        .set({
          isActive: false
        })
        .where(eq(b2bUserProfiles.userId, id));

      res.json({
        success: true,
        message: 'Usuário B2B desativado com sucesso'
      });

    } catch (error) {
      console.error('Deactivate B2B user error:', error);
      res.status(500).json({
        success: false,
        error: 'Erro interno do servidor'
      });
    }
  });
}