import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { createProperfyRestRouter } from "../properfy-rest";
import { initProperfySyncScheduler } from "../jobs/properfySyncJob";
import { initProperfyLeadsSyncScheduler } from "../jobs/properfyLeadsSyncJob";
import { initProperfyCardsSyncScheduler } from "../jobs/properfyCardsSyncJob";
import { initializeIndicatorSnapshotScheduler } from "../jobs/indicatorSnapshotJob";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
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

async function startServer() {
  const app = express();
  const server = createServer(app);
  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));
  // OAuth callback under /api/oauth/callback
  registerOAuthRoutes(app);
  // REST API para Properfy
  app.use("/api/rest/properfy", createProperfyRestRouter());
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

  server.listen(port, () => {
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
