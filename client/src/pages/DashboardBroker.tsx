import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerRestAuthRoutes } from "./restAuthRouter";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createProperfyRestRouter } from "../properfy-rest";
import { initProperfySyncScheduler } from "../jobs/properfySyncJob";
import { initProperfyLeadsSyncScheduler } from "../jobs/properfyLeadsSyncJob";
import { initProperfyCardsSyncScheduler } from "../jobs/properfyCardsSyncJob";
import { initializeIndicatorSnapshotScheduler } from "../jobs/indicatorSnapshotJob";
import { parse as parseCookieHeader } from "cookie";
import { COOKIE_NAME } from "@shared/const";
import * as db from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, '0.0.0.0', () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

/**
 * Middleware de autenticação para a rota de uploads.
 * Verifica se o usuário possui um cookie de sessão válido antes de servir os arquivos.
 */
async function uploadsAuthMiddleware(
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) {
  try {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) {
      return res.status(401).json({ error: "Acesso não autorizado" });
    }

    const cookies = parseCookieHeader(cookieHeader);
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) {
      return res.status(401).json({ error: "Acesso não autorizado" });
    }

    const decodedCookie = decodeURIComponent(sessionCookie);
    let userId: string | null = null;

    if (decodedCookie.startsWith('eyJ')) {
      // JWT token
      const parts = decodedCookie.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userId = payload.userId || null;
      }
    } else {
      // JSON simples
      const sessionData = JSON.parse(decodedCookie);
      userId = sessionData.userId || null;
    }

    if (!userId) {
      return res.status(401).json({ error: "Acesso não autorizado" });
    }

    const user = await db.getUserWithCompany(userId);
    if (!user) {
      return res.status(401).json({ error: "Acesso não autorizado" });
    }

    // Usuário autenticado — prosseguir
    next();
  } catch (error) {
    return res.status(401).json({ error: "Acesso não autorizado" });
  }
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // REST Authentication endpoints
  registerRestAuthRoutes(app);
  // REST API para Properfy
  app.use("/api/rest/properfy", createProperfyRestRouter());
  // Servir arquivos de upload locais (com autenticação obrigatória)
  const uploadsDir = process.env.UPLOADS_DIR || "/home/delmack/uploads";
  app.use("/api/uploads", uploadsAuthMiddleware, express.static(uploadsDir));
  // Middleware de log ANTES do tRPC para debug
  app.use("/api/trpc", (req, res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [tRPC Middleware] ${req.method} ${req.url}`);
    if (req.method === 'POST' || req.method === 'GET') {
      console.log(`[${timestamp}] [tRPC Middleware] Body:`, JSON.stringify(req.body || {}).substring(0, 200));
      console.log(`[${timestamp}] [tRPC Middleware] Query:`, JSON.stringify(req.query || {}).substring(0, 200));
    }
    next();
  });
  
  // tRPC API
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );
  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);
  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }
  server.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${port}/`);
    
    // Initialize Properfy sync scheduler (runs daily at 2 AM)
    initProperfySyncScheduler();
    
    // Initialize Properfy leads sync scheduler (runs every hour)
    initProperfyLeadsSyncScheduler();
    
    // Initialize Properfy cards sync scheduler (runs every hour)
    initProperfyCardsSyncScheduler();
    
    // Initialize indicator snapshot scheduler (runs daily at 23:00, saves on last day of month)
    initializeIndicatorSnapshotScheduler();
  });
}
startServer().catch(console.error);
