import { eq, and, desc, count } from "drizzle-orm";
import { db, safeQuery } from "./db.js";
import { 
  user, 
  b2bUserProfiles,
  masterAdminSessions, 
  adminActivityLogs, 
  userCreationRequests,
  masterAdminConfig,
  type CreateB2BUser,
  type MasterAdminLogin,
  type CreateAdminLog,
  createB2BUserSchema,
  masterAdminLoginSchema 
} from "../shared/schema.js";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { betterAuth } from "better-auth";
import { auth } from "./better-auth.js";

// ======================================
// MASTER ADMIN SERVICE
// ======================================

export class MasterAdminService {
  
  // ======================================
  // AUTHENTICATION METHODS
  // ======================================

  /**
   * Authenticate master admin with username/password
   */
  async authenticateAdmin(credentials: MasterAdminLogin): Promise<{
    success: boolean;
    sessionToken?: string;
    adminId?: string;
    error?: string;
  }> {
    try {
      console.log('🔐 Starting Master Admin authentication process...');
      // Validate credentials
      const validCredentials = masterAdminLoginSchema.safeParse(credentials);
      if (!validCredentials.success) {
        return {
          success: false,
          error: "Credenciais inválidas"
        };
      }

      // Check if it's the master admin (hardcoded for security)
      const MASTER_ADMIN = {
        username: process.env.MASTER_ADMIN_USERNAME || "master_admin",
        password: process.env.MASTER_ADMIN_PASSWORD || "VentusHub2025@Master",
        id: "master-admin-001"
      };

      if (credentials.username !== MASTER_ADMIN.username) {
        await this.logActivity({
          adminId: "unknown",
          action: "LOGIN_FAILED",
          targetType: "SYSTEM",
          status: "FAILED",
          metadata: { 
            reason: "Invalid username",
            attemptedUsername: credentials.username
          }
        });
        
        return {
          success: false,
          error: "Credenciais inválidas"
        };
      }

      // For production, use hashed passwords
      const passwordMatch = process.env.NODE_ENV === 'production' 
        ? await bcrypt.compare(credentials.password, MASTER_ADMIN.password)
        : credentials.password === MASTER_ADMIN.password;

      if (!passwordMatch) {
        await this.logActivity({
          adminId: MASTER_ADMIN.id,
          action: "LOGIN_FAILED",
          targetType: "SYSTEM",
          status: "FAILED",
          metadata: { reason: "Invalid password" }
        });
        
        return {
          success: false,
          error: "Credenciais inválidas"
        };
      }

      // Create session
      const sessionToken = randomUUID();
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

      console.log('💾 Attempting to create Master Admin session...');
      await safeQuery(() =>
        db.insert(masterAdminSessions).values({
          adminId: MASTER_ADMIN.id,
          token: sessionToken,
          expiresAt,
          ipAddress: "0.0.0.0", // Will be set by request handler
          userAgent: "Admin Panel"
        })
      );
      console.log('✅ Master Admin session created successfully');

      // Log successful login
      await this.logActivity({
        adminId: MASTER_ADMIN.id,
        action: "LOGIN_SUCCESS",
        targetType: "SYSTEM",
        status: "SUCCESS",
        metadata: { sessionDuration: 8 * 60 } // 8 hours in minutes
      });

      return {
        success: true,
        sessionToken,
        adminId: MASTER_ADMIN.id
      };

    } catch (error) {
      console.error("❌ Master admin authentication error:", error);
      return {
        success: false,
        error: "Erro interno do servidor"
      };
    }
  }

  /**
   * Validate admin session token
   */
  async validateSession(token: string): Promise<{
    valid: boolean;
    adminId?: string;
    sessionId?: string;
  }> {
    try {
      const sessions = await safeQuery(() =>
        db.select()
          .from(masterAdminSessions)
          .where(
            and(
              eq(masterAdminSessions.token, token),
              eq(masterAdminSessions.isActive, true)
            )
          )
          .limit(1)
      );

      if (!sessions || sessions.length === 0) {
        return { valid: false };
      }

      const session = sessions[0];
      
      // Check expiration
      if (new Date() > session.expiresAt) {
        // Mark session as inactive
        await safeQuery(() =>
          db.update(masterAdminSessions)
            .set({ isActive: false })
            .where(eq(masterAdminSessions.id, session.id))
        );
        
        return { valid: false };
      }

      // Update last used timestamp
      await safeQuery(() =>
        db.update(masterAdminSessions)
          .set({ lastUsedAt: new Date() })
          .where(eq(masterAdminSessions.id, session.id))
      );

      return {
        valid: true,
        adminId: session.adminId,
        sessionId: session.id
      };

    } catch (error) {
      console.error("❌ Session validation error:", error);
      return { valid: false };
    }
  }

  /**
   * Logout admin session
   */
  async logoutSession(token: string): Promise<boolean> {
    try {
      const result = await safeQuery(() =>
        db.update(masterAdminSessions)
          .set({ isActive: false })
          .where(eq(masterAdminSessions.token, token))
      );

      return true;
    } catch (error) {
      console.error("❌ Logout error:", error);
      return false;
    }
  }

  // ======================================
  // USER MANAGEMENT METHODS
  // ======================================

  /**
   * Create B2B user (Corretor Autônomo or Imobiliária)
   */
  async createB2BUser(userData: CreateB2BUser, adminId: string): Promise<{
    success: boolean;
    userId?: string;
    error?: string;
  }> {
    try {
      // Validate user data
      const validData = createB2BUserSchema.safeParse(userData);
      if (!validData.success) {
        return {
          success: false,
          error: validData.error.issues[0]?.message || "Dados inválidos"
        };
      }

      // Check if email already exists
      const existingUsers = await safeQuery(() =>
        db.select()
          .from(user)
          .where(eq(user.email, userData.email))
          .limit(1)
      );

      if (existingUsers && existingUsers.length > 0) {
        await this.logActivity({
          adminId,
          action: "CREATE_USER_FAILED",
          targetType: "USER",
          status: "FAILED",
          targetDetails: { email: userData.email },
          metadata: { reason: "Email already exists" }
        });

        return {
          success: false,
          error: "Este email já está em uso"
        };
      }

      // Generate temporary password
      const tempPassword = this.generateTemporaryPassword();
      
      // Create user using Better Auth
      const newUser = await auth.api.signUpEmail({
        body: {
          name: userData.name,
          email: userData.email,
          password: tempPassword,
          callbackURL: process.env.BETTER_AUTH_URL || "http://localhost:5000"
        }
      });

      if (!newUser) {
        return {
          success: false,
          error: "Erro ao criar usuário"
        };
      }

      // Create B2B profile for the user
      await safeQuery(() =>
        db.insert(b2bUserProfiles).values({
          userId: newUser.user.id,
          userType: userData.userType,
          organizationName: userData.organizationName,
          creci: userData.creci,
          cnpj: userData.cnpj,
          cpf: userData.cpf,
          phone: userData.phone,
          address: userData.address,
          createdBy: adminId,
          notes: userData.notes,
          permissions: JSON.stringify([
            'access_dashboard',
            'manage_properties',
            'manage_clients',
            'use_simulators'
          ])
        })
      );

      // Log successful user creation
      await this.logActivity({
        adminId,
        action: "CREATE_USER_SUCCESS",
        targetType: "USER",
        targetId: newUser.user.id,
        status: "SUCCESS",
        targetDetails: {
          email: userData.email,
          name: userData.name,
          userType: userData.userType,
          organizationName: userData.organizationName
        },
        metadata: {
          tempPassword: tempPassword, // For admin reference only
          createdBy: adminId
        }
      });

      return {
        success: true,
        userId: newUser.user.id
      };

    } catch (error) {
      console.error("❌ Create B2B user error:", error);
      
      await this.logActivity({
        adminId,
        action: "CREATE_USER_FAILED",
        targetType: "USER",
        status: "FAILED",
        targetDetails: { email: userData.email },
        metadata: { 
          error: error instanceof Error ? error.message : "Unknown error"
        }
      });

      return {
        success: false,
        error: "Erro interno do servidor"
      };
    }
  }

  /**
   * Get all B2B users with pagination
   */
  async getB2BUsers(page: number = 1, limit: number = 20): Promise<{
    users: any[];
    total: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get B2B users with their profiles
      const users = await safeQuery(() =>
        db.select({
          id: user.id,
          name: user.name,
          email: user.email,
          createdAt: user.createdAt,
          userType: b2bUserProfiles.userType,
          organizationName: b2bUserProfiles.organizationName,
          creci: b2bUserProfiles.creci,
          cnpj: b2bUserProfiles.cnpj,
          cpf: b2bUserProfiles.cpf,
          phone: b2bUserProfiles.phone,
          isActive: b2bUserProfiles.isActive,
          createdBy: b2bUserProfiles.createdBy
        })
        .from(b2bUserProfiles)
        .innerJoin(user, eq(b2bUserProfiles.userId, user.id))
        .orderBy(desc(b2bUserProfiles.createdAt))
        .limit(limit)
        .offset(offset)
      );

      // Get total count
      const totalResult = await safeQuery(() =>
        db.select({ count: count() })
          .from(b2bUserProfiles)
      );

      const total = totalResult?.[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        users: users || [],
        total,
        totalPages
      };

    } catch (error) {
      console.error("❌ Get B2B users error:", error);
      return {
        users: [],
        total: 0,
        totalPages: 0
      };
    }
  }

  // ======================================
  // ACTIVITY LOGGING METHODS
  // ======================================

  /**
   * Log admin activity
   */
  async logActivity(logData: CreateAdminLog): Promise<boolean> {
    try {
      await safeQuery(() =>
        db.insert(adminActivityLogs).values({
          ...logData,
          createdAt: new Date()
        })
      );
      
      return true;
    } catch (error) {
      console.error("❌ Activity logging error:", error);
      return false;
    }
  }

  /**
   * Get admin activity logs with pagination
   */
  async getActivityLogs(page: number = 1, limit: number = 50): Promise<{
    logs: any[];
    total: number;
    totalPages: number;
  }> {
    try {
      const offset = (page - 1) * limit;
      
      // Get logs
      const logs = await safeQuery(() =>
        db.select()
          .from(adminActivityLogs)
          .orderBy(desc(adminActivityLogs.createdAt))
          .limit(limit)
          .offset(offset)
      );

      // Get total count
      const totalResult = await safeQuery(() =>
        db.select({ count: count() })
          .from(adminActivityLogs)
      );

      const total = totalResult?.[0]?.count || 0;
      const totalPages = Math.ceil(total / limit);

      return {
        logs: logs || [],
        total,
        totalPages
      };

    } catch (error) {
      console.error("❌ Get activity logs error:", error);
      return {
        logs: [],
        total: 0,
        totalPages: 0
      };
    }
  }

  // ======================================
  // UTILITY METHODS
  // ======================================

  /**
   * Generate temporary password for new users
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  /**
   * Get system statistics for dashboard
   */
  async getSystemStats(): Promise<{
    totalUsers: number;
    totalCorretores: number;
    totalImobiliarias: number;
    activeUsers: number;
    recentLogins: number;
    totalSessions: number;
  }> {
    try {
      // Total B2B users
      const totalUsers = await safeQuery(() =>
        db.select({ count: count() })
          .from(b2bUserProfiles)
          .where(eq(b2bUserProfiles.isActive, true))
      );

      const totalCorretores = await safeQuery(() =>
        db.select({ count: count() })
          .from(b2bUserProfiles)
          .where(
            and(
              eq(b2bUserProfiles.userType, 'CORRETOR_AUTONOMO'),
              eq(b2bUserProfiles.isActive, true)
            )
          )
      );

      const totalImobiliarias = await safeQuery(() =>
        db.select({ count: count() })
          .from(b2bUserProfiles)
          .where(
            and(
              eq(b2bUserProfiles.userType, 'IMOBILIARIA'),
              eq(b2bUserProfiles.isActive, true)
            )
          )
      );

      // Active sessions (master admin sessions)
      const activeSessions = await safeQuery(() =>
        db.select({ count: count() })
          .from(masterAdminSessions)
          .where(eq(masterAdminSessions.isActive, true))
      );

      return {
        totalUsers: totalUsers?.[0]?.count || 0,
        totalCorretores: totalCorretores?.[0]?.count || 0,
        totalImobiliarias: totalImobiliarias?.[0]?.count || 0,
        activeUsers: totalUsers?.[0]?.count || 0,
        recentLogins: 0, // Can be implemented later with session tracking
        totalSessions: activeSessions?.[0]?.count || 0,
      };

    } catch (error) {
      console.error("❌ Get system stats error:", error);
      return {
        totalUsers: 0,
        totalCorretores: 0,
        totalImobiliarias: 0,
        activeUsers: 0,
        recentLogins: 0,
        totalSessions: 0,
      };
    }
  }
}

// Export singleton instance
export const masterAdminService = new MasterAdminService();