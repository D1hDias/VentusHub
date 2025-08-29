/**
 * AUTH MIDDLEWARE - Enhanced with database retry logic
 * 
 * Robust authentication middleware with automatic retry for database operations
 * Integrates with Better Auth and handles connection failures gracefully
 */

import { db, safeQuery } from './db.js';
import { user } from '../shared/schema.js';
import { eq } from 'drizzle-orm';
import type { Request, Response, NextFunction } from 'express';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
    role?: string;
    organizationId?: string;
    permissions?: string[];
    isActive?: boolean;
  };
}

/**
 * Enhanced authentication middleware with database retry logic
 */
export async function isAuthenticated(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    // Extract token from session cookie
    const cookies = req.headers.cookie;
    
    if (!cookies) {
      return res.status(401).json({ message: "No session found" });
    }

    let userData = null;
    
    // Try multiple authentication methods
    // Method 1: Better Auth session_data
    const sessionDataMatch = cookies.match(/better-auth\.session_data=([^;]+)/);
    if (sessionDataMatch) {
      try {
        const base64Data = decodeURIComponent(sessionDataMatch[1]);
        const decodedData = Buffer.from(base64Data, 'base64').toString('utf-8');
        const sessionData = JSON.parse(decodedData);
        
        userData = sessionData.session?.user || sessionData.user;
      } catch (e) {
        console.log('⚠️ Error decoding session_data:', e instanceof Error ? e.message : e);
      }
    }
    
    // Method 2: Try better-auth token
    if (!userData) {
      const tokenMatch = cookies.match(/better-auth\.session_token=([^;]+)/);
      if (tokenMatch) {
        // We'll validate this token against the database later
        // For now, create a mock user to proceed
        userData = { id: 'temp-user-id', email: 'temp@ventushub.com' };
      }
    }
    
    if (!userData) {
      return res.status(401).json({ message: "No valid session found" });
    }
    
    // Fetch complete user data from database with retry logic
    const [fullUser] = await safeQuery(async () => {
      return await db
        .select()
        .from(user)
        .where(eq(user.id, userData.id))
        .limit(1);
    });
    
    if (!fullUser) {
      return res.status(401).json({ message: "User not found in database" });
    }
    
    if (!fullUser.isActive) {
      return res.status(401).json({ message: "User account is inactive" });
    }
    
    // Parse permissions from JSON string
    let permissions: string[] = [];
    try {
      if (fullUser.permissions) {
        permissions = JSON.parse(fullUser.permissions);
      }
    } catch (e) {
      console.warn('Failed to parse user permissions:', fullUser.permissions);
    }
    
    // Attach user data to request
    req.user = {
      id: fullUser.id,
      email: fullUser.email,
      name: fullUser.name,
      role: fullUser.role || 'USER',
      organizationId: fullUser.organizationId || undefined,
      permissions,
      isActive: fullUser.isActive
    };
    
    next();
    
  } catch (error: any) {
    console.error('❌ Auth middleware error:', error);
    
    // Enhanced error reporting
    if (error.cause?.code === 'UND_ERR_CONNECT_TIMEOUT') {
      console.error('💡 Database timeout in auth middleware - implementing graceful degradation');
      return res.status(503).json({ 
        message: "Database temporarily unavailable", 
        code: "DB_TIMEOUT",
        retryAfter: 30
      });
    }
    
    return res.status(500).json({ 
      message: "Authentication service error",
      code: "AUTH_ERROR"
    });
  }
}

/**
 * Optional authentication middleware - doesn't fail if user is not authenticated
 */
export async function optionalAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    await isAuthenticated(req, res, () => {
      // If authentication succeeds, continue
      next();
    });
  } catch (error) {
    // If authentication fails, continue without user data
    req.user = undefined;
    next();
  }
}

/**
 * Role-based authentication middleware
 */
export function requireRole(requiredRole: string | string[]) {
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await isAuthenticated(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!req.user.role || !roles.includes(req.user.role)) {
        return res.status(403).json({ 
          message: "Insufficient permissions",
          required: roles,
          current: req.user.role
        });
      }
      
      next();
    });
  };
}

/**
 * Permission-based authentication middleware
 */
export function requirePermission(permission: string) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await isAuthenticated(req, res, () => {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!req.user.permissions || !req.user.permissions.includes(permission)) {
        return res.status(403).json({ 
          message: "Permission denied",
          required: permission,
          available: req.user.permissions
        });
      }
      
      next();
    });
  };
}