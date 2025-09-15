import { NextFunction, Request, RequestHandler, Response } from "express";
import { Server } from "../Server";
import jwt from "jsonwebtoken";

export function authMiddleware(server: Server) {
  return (async (req: Request, res: Response, next: NextFunction) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ error: "Missing or invalid Authorization header" });
      }

      const token = authHeader.slice(7); // Remove "Bearer "
      try {
        const payload = jwt.verify(token, server.jwtKey);
        const uid = (payload as any).uid;
        if (uid != null) {
          const user = server.users.find(u => u.uuid === uid);
          if (user) {
            req.user = user;
            return next();
          }
        }
        return res.status(401).json({ error: "User not found" });
      } catch (err) {
        res.status(401).json({ error: "Invalid or expired token" });
      }
    } catch (err) {
      console.error("Error in auth middleware:", err);
      res.status(500).json({ error: "Internal server error in auth" });
    }
  }) as RequestHandler;
}
