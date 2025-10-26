import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import type { User } from "../../drizzle/schema";
import { COOKIE_NAME } from "@shared/const";
import { parse as parseCookieHeader } from "cookie";
import * as db from "../db";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    // Parse cookies from request
    const cookieHeader = opts.req.headers.cookie;
    if (!cookieHeader) {
      return { req: opts.req, res: opts.res, user: null };
    }

    const cookies = parseCookieHeader(cookieHeader);
    const sessionCookie = cookies[COOKIE_NAME];

    if (!sessionCookie) {
      return { req: opts.req, res: opts.res, user: null };
    }

    // Parse session data from cookie
    try {
      const decodedCookie = decodeURIComponent(sessionCookie);
      const sessionData = JSON.parse(decodedCookie);
      
      if (sessionData.userId) {
        // Email/password authentication
        const fetchedUser = await db.getUser(sessionData.userId);
        user = fetchedUser || null;
      }
    } catch (error) {
      console.warn("[Auth] Failed to parse session cookie:", error);
      user = null;
    }
  } catch (error) {
    console.warn("[Auth] Error in createContext:", error);
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

