import type { Request, Response, NextFunction } from "express";

/**
 * Middleware para converter tRPC batch format para single format
 * Converte {"0": {...}} para {...}
 */
export function batchFormatMiddleware(req: Request, res: Response, next: NextFunction) {
  if (req.method === "POST" && req.body && typeof req.body === "object") {
    // Se o body é um objeto com chaves numéricas (batch format)
    const keys = Object.keys(req.body);
    if (keys.length === 1 && keys[0] === "0" && typeof req.body["0"] === "object") {
      console.log("[Batch Middleware] Converting batch format to single format");
      console.log("[Batch Middleware] Original body:", JSON.stringify(req.body).substring(0, 200));
      
      // Converter {"0": {...}} para {...}
      req.body = req.body["0"];
      
      console.log("[Batch Middleware] Converted body:", JSON.stringify(req.body).substring(0, 200));
    }
  }
  next();
}
