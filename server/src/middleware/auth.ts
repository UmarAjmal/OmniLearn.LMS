import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// Extend Express Request object to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
      };
    }
  }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    // Some routes might not have a token and that's expected if we use it dynamically,
    // but typically we'll enforce it.
    res.status(401).json({ success: false, error: 'Authentication token is required.' });
    return;
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      res.status(403).json({ success: false, error: 'Invalid or expired token.' });
      return;
    }
    req.user = user as any;
    next();
  });
};

export const requireRole = (roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Unauthorized.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ success: false, error: `Forbidden: requires one of roles [${roles.join(', ')}]` });
      return;
    }
    next();
  };
};

export const requireAdmin = requireRole(['admin']);
export const requireTrainer = requireRole(['trainer']);
export const requireStudent = requireRole(['student']);
export const requireAdminOrTrainer = requireRole(['admin', 'trainer']);
