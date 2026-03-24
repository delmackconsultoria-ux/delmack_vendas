import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { UserWithCompany } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: UserWithCompany | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: UserWithCompany | null = null;

  try {
    // Parse cookies from request
    const cookieHeader = opts.req.headers.cookie;
    console.log("[Context] Cookie header:", cookieHeader ? "EXISTS" : "MISSING");
    console.log("[Context] Cookie header value:", cookieHeader);

    if (!cookieHeader) {
      console.log("[Context] No cookie header, returning null user");
      return { req: opts.req, res: opts.res, user: null };
    }

    const cookies = parseCookieHeader(cookieHeader);
    console.log("[Context] Parsed cookies:", Object.keys(cookies));
    console.log("[Context] Looking for:", COOKIE_NAME);

    const sessionCookie = cookies[COOKIE_NAME];
    console.log("[Context] Session cookie found:", sessionCookie ? "YES" : "NO");

    if (!sessionCookie) {
      console.log("[Context] No session cookie, returning null user");
      return { req: opts.req, res: opts.res, user: null };
    }

    // Parse session data from cookie
    try {
      const decodedCookie = decodeURIComponent(sessionCookie);
      console.log("[Context] Decoded cookie:", decodedCookie.substring(0, 100));

      // Verificar se é um JWT (começa com eyJ)
      if (decodedCookie.startsWith('eyJ')) {
        // JWT token - decodificar payload
        try {
          const parts = decodedCookie.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            if (payload.userId) {
              const fetchedUser = await db.getUserWithCompany(payload.userId);
              user = fetchedUser || null;
            }
          }
        } catch (jwtError) {
          console.log("[Context] JWT error:", jwtError);
          user = null;
        }
      } else {
        // JSON simples
        const sessionData = JSON.parse(decodedCookie);
        console.log("[Context] Session data:", sessionData);
        if (sessionData.userId) {
          const fetchedUser = await db.getUserWithCompany(sessionData.userId);
          console.log("[Context] User found:", fetchedUser ? "YES" : "NO");
          user = fetchedUser || null;
        }
      }
    } catch (error) {
      console.log("[Context] Error parsing cookie:", error);
      user = null;
    }
  } catch (error) {
    console.warn("[Auth] Error in createContext:", error);
    user = null;
  }

  console.log("[Context] Returning user:", user ? (user as any).email : "null");
  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}
