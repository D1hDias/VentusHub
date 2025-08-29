import { Router, Request, Response, NextFunction } from "express";
import { masterAdminService } from "./master-admin-service.js";
import { masterAdminLoginSchema, createB2BUserSchema } from "../shared/schema.js";
import { z } from "zod";

const router = Router();

// ======================================
// MIDDLEWARE
// ======================================

interface AuthenticatedAdminRequest extends Request {
  adminId?: string;
  sessionId?: string;
}

/**
 * Middleware to validate master admin authentication
 * Now using secure httpOnly cookies instead of Authorization headers
 */
async function requireMasterAdmin(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  try {
    // Extract token from httpOnly cookie instead of Authorization header
    const token = req.cookies?.masterAdminToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Sessão de administrador necessária"
      });
    }

    const session = await masterAdminService.validateSession(token);
    
    if (!session.valid) {
      return res.status(401).json({
        success: false,
        error: "Sessão inválida ou expirada"
      });
    }

    req.adminId = session.adminId;
    req.sessionId = session.sessionId;
    next();

  } catch (error) {
    console.error("❌ Master admin auth middleware error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
}

/**
 * Request logging middleware for admin actions
 */
function logAdminRequest(req: AuthenticatedAdminRequest, res: Response, next: NextFunction) {
  const originalJson = res.json;
  
  res.json = function(body) {
    // Log the request if admin is authenticated
    if (req.adminId && body.success !== undefined) {
      const action = `${req.method}_${req.route?.path?.toUpperCase() || 'UNKNOWN'}`;
      masterAdminService.logActivity({
        adminId: req.adminId,
        action,
        targetType: 'API',
        status: body.success ? 'SUCCESS' : 'FAILED',
        metadata: {
          method: req.method,
          path: req.path,
          query: req.query,
          userAgent: req.headers['user-agent'],
          ipAddress: req.ip
        }
      });
    }
    
    return originalJson.call(this, body);
  };
  
  next();
}

// ======================================
// AUTHENTICATION ROUTES
// ======================================

/**
 * POST /api/master-admin/auth/login
 * Authenticate master admin
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const validation = masterAdminLoginSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Dados de login inválidos",
        details: validation.error.issues
      });
    }

    const result = await masterAdminService.authenticateAdmin(validation.data);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        error: result.error
      });
    }

    // Set secure httpOnly cookie instead of returning token in response
    res.cookie('masterAdminToken', result.sessionToken, {
      httpOnly: true, // Cannot be accessed via JavaScript
      secure: process.env.NODE_ENV === 'production', // HTTPS only in production
      sameSite: 'strict', // CSRF protection
      maxAge: 8 * 60 * 60 * 1000, // 8 hours (same as session expiry)
      path: '/' // Available for all paths
    });

    res.json({
      success: true,
      adminId: result.adminId,
      message: "Login realizado com sucesso"
      // Note: sessionToken no longer exposed to client
    });

  } catch (error) {
    console.error("❌ Master admin login error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * POST /api/master-admin/auth/logout
 * Logout master admin session
 */
router.post('/auth/logout', requireMasterAdmin, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    // Get token from cookie instead of Authorization header
    const token = req.cookies?.masterAdminToken || '';

    const success = await masterAdminService.logoutSession(token);
    
    if (success) {
      await masterAdminService.logActivity({
        adminId: req.adminId!,
        action: "LOGOUT_SUCCESS",
        targetType: "SYSTEM",
        status: "SUCCESS",
        metadata: { sessionId: req.sessionId }
      });
    }

    // Clear the secure cookie on logout
    res.clearCookie('masterAdminToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/'
    });

    res.json({
      success,
      message: success ? "Logout realizado com sucesso" : "Erro ao fazer logout"
    });

  } catch (error) {
    console.error("❌ Master admin logout error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/master-admin/auth/validate
 * Validate current session
 */
router.get('/auth/validate', requireMasterAdmin, (req: AuthenticatedAdminRequest, res: Response) => {
  res.json({
    success: true,
    valid: true,
    adminId: req.adminId,
    message: "Sessão válida"
  });
});

// ======================================
// USER MANAGEMENT ROUTES
// ======================================

/**
 * POST /api/master-admin/users/create
 * Create new B2B user
 */
router.post('/users/create', requireMasterAdmin, logAdminRequest, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const validation = createB2BUserSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: "Dados do usuário inválidos",
        details: validation.error.issues
      });
    }

    const result = await masterAdminService.createB2BUser(validation.data, req.adminId!);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.status(201).json({
      success: true,
      userId: result.userId,
      message: "Usuário B2B criado com sucesso"
    });

  } catch (error) {
    console.error("❌ Create B2B user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/master-admin/users
 * Get all B2B users with pagination
 */
router.get('/users', requireMasterAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const result = await masterAdminService.getB2BUsers(page, limit);
    
    res.json({
      success: true,
      data: result.users,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });

  } catch (error) {
    console.error("❌ Get B2B users error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * PUT /api/master-admin/users/:id
 * Update B2B user information
 */
router.put('/users/:id', requireMasterAdmin, logAdminRequest, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const userId = req.params.id;
    const updateData = req.body;

    // Basic validation
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID do usuário é obrigatório"
      });
    }

    const result = await masterAdminService.updateB2BUser(userId, updateData, req.adminId!);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: "Usuário atualizado com sucesso"
    });

  } catch (error) {
    console.error("❌ Update B2B user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * DELETE /api/master-admin/users/:id
 * Delete B2B user
 */
router.delete('/users/:id', requireMasterAdmin, logAdminRequest, async (req: AuthenticatedAdminRequest, res: Response) => {
  try {
    const userId = req.params.id;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: "ID do usuário é obrigatório"
      });
    }

    const result = await masterAdminService.deleteB2BUser(userId, req.adminId!);
    
    if (!result.success) {
      return res.status(400).json({
        success: false,
        error: result.error
      });
    }

    res.json({
      success: true,
      message: "Usuário excluído com sucesso"
    });

  } catch (error) {
    console.error("❌ Delete B2B user error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// ======================================
// SYSTEM DASHBOARD ROUTES
// ======================================

/**
 * GET /api/master-admin/dashboard/stats
 * Get system statistics
 */
router.get('/dashboard/stats', requireMasterAdmin, async (req: Request, res: Response) => {
  try {
    const stats = await masterAdminService.getSystemStats();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error("❌ Get system stats error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

/**
 * GET /api/master-admin/logs
 * Get admin activity logs
 */
router.get('/logs', requireMasterAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    
    const result = await masterAdminService.getActivityLogs(page, limit);
    
    res.json({
      success: true,
      data: result.logs,
      pagination: {
        page,
        limit,
        total: result.total,
        totalPages: result.totalPages
      }
    });

  } catch (error) {
    console.error("❌ Get activity logs error:", error);
    res.status(500).json({
      success: false,
      error: "Erro interno do servidor"
    });
  }
});

// ======================================
// HEALTH CHECK ROUTE
// ======================================

/**
 * GET /api/master-admin/health
 * Health check for master admin system
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    success: true,
    service: 'master-admin',
    status: 'healthy',
    timestamp: new Date().toISOString()
  });
});

export default router;