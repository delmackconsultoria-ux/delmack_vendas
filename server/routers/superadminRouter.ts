import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import { companies, users } from "../../drizzle/schema";
import { eq, sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { notifyOwner } from "../_core/notification";

function generateStrongPassword(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%&*";
  let password = "";
  const bytes = randomBytes(12);
  for (let i = 0; i < 12; i++) {
    password += chars[bytes[i] % chars.length];
  }
  return password;
}

export const superadminRouter = router({
  listCompanies: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "superadmin") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
    }
    
    const db = await getDb();
    if (!db) return [];
    
    const result = await db.select({
      id: companies.id,
      name: companies.name,
      email: companies.email,
      phone: companies.phone,
      licenseType: companies.licenseType,
      isActive: companies.isActive,
      createdAt: companies.createdAt,
      userCount: sql<number>`(SELECT COUNT(*) FROM users WHERE companyId = ${companies.id})`,
    }).from(companies);
    
    return result;
  }),

  createCompany: protectedProcedure
    .input(z.object({
      name: z.string().min(1),
      email: z.string().email().optional(),
      phone: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      const id = `company_${Date.now()}`;
      await db.insert(companies).values({
        id,
        name: input.name,
        email: input.email || null,
        phone: input.phone || null,
        licenseType: "trial",
        isActive: true,
      });
      
      return { id, success: true };
    }),

  uploadUsers: protectedProcedure
    .input(z.object({
      companyId: z.string(),
      users: z.array(z.object({
        name: z.string(),
        surname: z.string().optional(),
        email: z.string().email(),
        role: z.enum(["broker", "manager", "finance"]),
        company: z.string().optional(),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "superadmin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Acesso negado" });
      }
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      let created = 0;
      const credentials: { email: string; password: string; name: string }[] = [];
      
      for (const user of input.users) {
        const password = generateStrongPassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fullName = user.surname ? `${user.name} ${user.surname}` : user.name;
        
        try {
          await db.insert(users).values({
            id,
            name: fullName,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            companyId: input.companyId,
            loginMethod: "email",
            isActive: true,
          });
          
          credentials.push({ email: user.email, password, name: fullName });
          created++;
        } catch (error) {
          console.log(`[SuperAdmin] Erro ao criar usuário ${user.email}:`, error);
        }
      }
      
      // Send email notifications via Manus
      for (const cred of credentials) {
        try {
          await notifyOwner({
            title: `Novo usuário criado: ${cred.name}`,
            content: `Email: ${cred.email}\nSenha: ${cred.password}\n\nAcesse o sistema Delmack para começar.`,
          });
        } catch (error) {
          console.log(`[SuperAdmin] Erro ao enviar email para ${cred.email}:`, error);
        }
      }
      
      return { created, total: input.users.length };
    }),
});
