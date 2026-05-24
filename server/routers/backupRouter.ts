/**
 * Backup Router - Monitoramento de Backups para Super Admin
 * Versão: 1.0
 * Criado em: 2026-03-30
 */

import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

const BACKUP_DIR = "/home/delmack/backups";
const BACKUP_LOG = path.join(BACKUP_DIR, "backup.log");
const BACKUP_STATUS = path.join(BACKUP_DIR, "last_backup_status.json");

export const backupRouter = router({

  /**
   * Obter status do último backup
   */
  getStatus: protectedProcedure
    .query(async ({ ctx }) => {
      if (ctx.user.role !== "superadmin") {
        throw new Error("Acesso restrito ao Super Admin");
      }

      try {
        // Ler status do último backup
        let lastBackupStatus = null;
        if (fs.existsSync(BACKUP_STATUS)) {
          const raw = fs.readFileSync(BACKUP_STATUS, "utf-8");
          lastBackupStatus = JSON.parse(raw);
        }

        // Listar arquivos de backup
        let backupFiles: { name: string; size: string; date: string }[] = [];
        if (fs.existsSync(BACKUP_DIR)) {
          const files = fs.readdirSync(BACKUP_DIR)
            .filter(f => f.endsWith(".sql.gz"))
            .sort()
            .reverse()
            .slice(0, 10); // Últimos 10

          backupFiles = files.map(f => {
            const filePath = path.join(BACKUP_DIR, f);
            const stats = fs.statSync(filePath);
            const sizeKB = Math.round(stats.size / 1024);
            return {
              name: f,
              size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`,
              date: stats.mtime.toISOString(),
            };
          });
        }

        // Ler últimas linhas do log
        let recentLogs: string[] = [];
        if (fs.existsSync(BACKUP_LOG)) {
          const logContent = fs.readFileSync(BACKUP_LOG, "utf-8");
          recentLogs = logContent.trim().split("\n").slice(-20).reverse();
        }

        // Calcular próximo backup
        const now = new Date();
        const nextLocalBackup = new Date(now);
        nextLocalBackup.setDate(nextLocalBackup.getDate() + 1);
        nextLocalBackup.setHours(0, 0, 0, 0);

        const nextGithubBackup = new Date(now);
        const daysUntilSunday = (7 - nextGithubBackup.getDay()) % 7 || 7;
        nextGithubBackup.setDate(nextGithubBackup.getDate() + daysUntilSunday);
        nextGithubBackup.setHours(2, 0, 0, 0);

        return {
          lastBackup: lastBackupStatus,
          backupFiles,
          recentLogs,
          totalBackups: backupFiles.length,
          nextLocalBackup: nextLocalBackup.toISOString(),
          nextGithubBackup: nextGithubBackup.toISOString(),
          backupDir: BACKUP_DIR,
        };
      } catch (error) {
        console.error("[Backup Router] Erro ao obter status:", error);
        throw new Error("Erro ao obter status do backup");
      }
    }),

  /**
   * Executar backup manual agora
   */
  runNow: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "superadmin") {
        throw new Error("Acesso restrito ao Super Admin");
      }

      try {
        execSync("/home/delmack/scripts/backup_local.sh", { timeout: 60000 });

        // Ler status atualizado
        let status = null;
        if (fs.existsSync(BACKUP_STATUS)) {
          const raw = fs.readFileSync(BACKUP_STATUS, "utf-8");
          status = JSON.parse(raw);
        }

        return { success: true, message: "Backup executado com sucesso!", status };
      } catch (error) {
        console.error("[Backup Router] Erro ao executar backup:", error);
        throw new Error("Erro ao executar backup manual");
      }
    }),

  /**
   * Sincronizar com GitHub agora
   */
  syncGithub: protectedProcedure
    .mutation(async ({ ctx }) => {
      if (ctx.user.role !== "superadmin") {
        throw new Error("Acesso restrito ao Super Admin");
      }

      try {
        execSync("/home/delmack/scripts/backup_github.sh", { timeout: 120000 });
        return { success: true, message: "Sincronização com GitHub concluída!" };
      } catch (error) {
        console.error("[Backup Router] Erro ao sincronizar GitHub:", error);
        throw new Error("Erro ao sincronizar com GitHub");
      }
    }),
});
