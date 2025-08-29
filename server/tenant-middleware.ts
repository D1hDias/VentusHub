import { Request, Response, NextFunction } from 'express';

export interface TenantRequest extends Request {
  tenantType: 'b2b' | 'b2c';
}

export function tenantMiddleware(req: TenantRequest, res: Response, next: NextFunction) {
  // Detectar tenant através do header enviado pelo nginx
  const tenantHeader = req.headers['x-tenant-type'] as string;
  
  // Fallback: detectar pelo host se não houver header
  const host = req.get('host') || '';
  
  if (tenantHeader) {
    req.tenantType = tenantHeader as 'b2b' | 'b2c';
  } else if (host.includes('app.ventushub.com.br')) {
    req.tenantType = 'b2b';
  } else if (host.includes('www.ventushub.com.br') || host.includes('ventushub.com.br')) {
    req.tenantType = 'b2c';
  } else {
    // Default para desenvolvimento local - usar porta para distinguir
    if (host.includes(':5001')) {
      req.tenantType = 'b2b'; // localhost:5001 = B2B
    } else {
      req.tenantType = 'b2c'; // localhost:5000 = B2C
    }
  }

  // Only log for API routes and important paths, not for assets
  const shouldLog = req.path.startsWith('/api/') || 
                    req.path === '/' || 
                    req.path.startsWith('/b2b') ||
                    req.path.startsWith('/login');
  
  if (shouldLog) {
    console.log(`🔍 Tenant detectado: ${req.tenantType} | Host: ${host} | Header: ${tenantHeader}`);
  }
  
  next();
}

export function requireTenant(allowedTenants: ('b2b' | 'b2c')[]) {
  return (req: TenantRequest, res: Response, next: NextFunction) => {
    if (!allowedTenants.includes(req.tenantType)) {
      return res.status(403).json({ 
        error: 'Acesso não autorizado para este tenant',
        tenantType: req.tenantType,
        allowedTenants 
      });
    }
    next();
  };
}

export default tenantMiddleware;