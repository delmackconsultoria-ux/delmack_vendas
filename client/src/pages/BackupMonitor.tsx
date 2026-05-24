import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Database, RefreshCw, Github, CheckCircle, AlertCircle, Clock, HardDrive } from "lucide-react";

export default function BackupMonitor() {
  const [isRunning, setIsRunning] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const { data: status, isLoading, refetch } = trpc.backup.getStatus.useQuery(undefined, {
    refetchInterval: 30000, // Atualiza a cada 30 segundos
  });

  const runBackup = trpc.backup.runNow.useMutation({
    onMutate: () => setIsRunning(true),
    onSuccess: () => {
      toast.success("✅ Backup executado com sucesso!");
      refetch();
      setIsRunning(false);
    },
    onError: (err) => {
      toast.error("❌ Erro ao executar backup: " + err.message);
      setIsRunning(false);
    },
  });

  const syncGithub = trpc.backup.syncGithub.useMutation({
    onMutate: () => setIsSyncing(true),
    onSuccess: () => {
      toast.success("✅ Sincronizado com GitHub com sucesso!");
      refetch();
      setIsSyncing(false);
    },
    onError: (err) => {
      toast.error("❌ Erro ao sincronizar: " + err.message);
      setIsSyncing(false);
    },
  });

  const formatDate = (iso: string) => {
    if (!iso) return "-";
    return new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Carregando status do backup...</span>
      </div>
    );
  }

  const lastBackup = status?.lastBackup;
  const isHealthy = lastBackup?.status === "success";

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Monitoramento de Backups</h2>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <RefreshCw className="h-4 w-4" />
          Atualizar
        </button>
      </div>

      {/* Status Geral */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Último Backup */}
        <div className={`rounded-lg border p-4 ${isHealthy ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}`}>
          <div className="flex items-center gap-2 mb-2">
            {isHealthy
              ? <CheckCircle className="h-5 w-5 text-green-600" />
              : <AlertCircle className="h-5 w-5 text-red-600" />
            }
            <span className="font-medium text-sm">Último Backup Local</span>
          </div>
          <p className="text-lg font-bold">{lastBackup ? formatDate(lastBackup.last_backup) : "Nenhum"}</p>
          {lastBackup?.size && <p className="text-xs text-muted-foreground mt-1">Tamanho: {lastBackup.size}</p>}
        </div>

        {/* Próximo Backup Local */}
        <div className="rounded-lg border p-4 bg-blue-50 border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-5 w-5 text-blue-600" />
            <span className="font-medium text-sm">Próximo Backup Local</span>
          </div>
          <p className="text-lg font-bold">{status?.nextLocalBackup ? formatDate(status.nextLocalBackup) : "-"}</p>
          <p className="text-xs text-muted-foreground mt-1">Diário às 00h00</p>
        </div>

        {/* Próximo Backup GitHub */}
        <div className="rounded-lg border p-4 bg-purple-50 border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Github className="h-5 w-5 text-purple-600" />
            <span className="font-medium text-sm">Próximo Backup GitHub</span>
          </div>
          <p className="text-lg font-bold">{status?.nextGithubBackup ? formatDate(status.nextGithubBackup) : "-"}</p>
          <p className="text-xs text-muted-foreground mt-1">Semanal (Domingo às 02h00)</p>
        </div>
      </div>

      {/* Ações */}
      <div className="flex gap-3">
        <button
          onClick={() => runBackup.mutate()}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
        >
          <HardDrive className="h-4 w-4" />
          {isRunning ? "Executando..." : "Backup Manual Agora"}
        </button>
        <button
          onClick={() => syncGithub.mutate()}
          disabled={isSyncing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 text-sm font-medium"
        >
          <Github className="h-4 w-4" />
          {isSyncing ? "Sincronizando..." : "Sincronizar GitHub"}
        </button>
      </div>

      {/* Lista de Backups */}
      {status?.backupFiles && status.backupFiles.length > 0 && (
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <HardDrive className="h-4 w-4" />
            Backups Recentes ({status.totalBackups} arquivos)
          </h3>
          <div className="rounded-lg border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">Arquivo</th>
                  <th className="text-left p-3 font-medium">Tamanho</th>
                  <th className="text-left p-3 font-medium">Data</th>
                </tr>
              </thead>
              <tbody>
                {status.backupFiles.map((file, i) => (
                  <tr key={i} className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                    <td className="p-3 font-mono text-xs">{file.name}</td>
                    <td className="p-3">{file.size}</td>
                    <td className="p-3">{formatDate(file.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Logs Recentes */}
      {status?.recentLogs && status.recentLogs.length > 0 && (
        <div>
          <h3 className="font-medium mb-3">Log de Atividades</h3>
          <div className="bg-gray-900 text-green-400 rounded-lg p-4 font-mono text-xs max-h-48 overflow-y-auto">
            {status.recentLogs.map((log, i) => (
              <div key={i} className={log.includes("❌") ? "text-red-400" : log.includes("✅") ? "text-green-400" : "text-gray-400"}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Links GitHub */}
      <div className="rounded-lg border p-4 bg-muted/30">
        <h3 className="font-medium mb-2 flex items-center gap-2">
          <Github className="h-4 w-4" />
          Repositórios GitHub
        </h3>
        <div className="space-y-1 text-sm">
          <div>
            <span className="text-muted-foreground">Código: </span>
            <a href="https://github.com/delmackconsultoria-ux/delmack-vendas-codigo" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              delmack-vendas-codigo
            </a>
          </div>
          <div>
            <span className="text-muted-foreground">Backups: </span>
            <a href="https://github.com/delmackconsultoria-ux/delmack-vendas-backups" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
              delmack-vendas-backups
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
