import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';


declare module 'express' {
  interface Request {
    userId?: string; 
  }
}

interface DecodedToken {
  id: string;
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
  if (req.get("access-control-request-method")) {
    return next();
  }

  const token = req.headers['authorization'] as string;
  const allowedPaths = [
    "/api/login",
    "/api/register",
    "/api/verify-email",
    "/api/forgot-password",
    "/api/reset-password",
  ];

  if (allowedPaths.includes(req.path)) {
    return next();
  }

  if (!token) {
    return res.status(401).json({ message: "No está autorizado para acceder al recurso solicitado" });
  }

  if (token && token.startsWith("Bearer ")) {
    jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET as string, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: "Token inválido." });
      }
      const decodedToken = decoded as DecodedToken;
      req.userId = decodedToken.id; 
      return next();
    });
  } else {
    return res.status(401).json({ message: "Token no válido. Debe comenzar con 'Bearer '" });
  }
};