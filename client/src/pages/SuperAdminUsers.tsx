import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Users, Search, Key, Lock, Unlock, UserX, UserCheck, ArrowLeft } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function SuperAdminUsers() {
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  const { data: users, refetch } = trpc.superadmin.listAllUsers.useQuery();
  const resetPasswordMutation = trpc.superadmin.resetUserPassword.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); setConfirmAction(null); },
    onError: (err) => toast.error(err.message),
  });
  const toggleBlockMutation = trpc.superadmin.toggleUserBlock.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); setConfirmAction(null); },
    onError: (err) => toast.error(err.message),
  });
  const toggleActiveMutation = trpc.superadmin.toggleUserActive.useMutation({
    onSuccess: (data) => { toast.success(data.message); refetch(); setConfirmAction(null); },
    onError: (err) => toast.error(err.message),
  });

  const filteredUsers = users?.filter(u => 
    u.name?.toLowerCase().includes(search.toLowerCase()) || 
    u.email?.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const isLocked = (u: any) => u.lockedUntil && new Date(u.lockedUntil) > new Date();

  const handleAction = () => {
    if (!selectedUser || !confirmAction) return;
    if (confirmAction === "reset") resetPasswordMutation.mutate({ userId: selectedUser.id });
    else if (confirmAction === "block") toggleBlockMutation.mutate({ userId: selectedUser.id, block: true });
    else if (confirmAction === "unblock") toggleBlockMutation.mutate({ userId: selectedUser.id, block: false });
    else if (confirmAction === "deactivate") toggleActiveMutation.mutate({ userId: selectedUser.id, active: false });
    else if (confirmAction === "activate") toggleActiveMutation.mutate({ userId: selectedUser.id, active: true });
  };

  const roleLabels: Record<string, string> = { superadmin: "Super Admin", manager: "Gerente", broker: "Corretor", finance: "Financeiro" };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="container pt-24">
        <div className="flex items-center gap-4 mb-6">
          <a href="/" className="text-slate-600 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6" /> Gestão de Usuários</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input placeholder="Buscar por nome ou e-mail..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Usuários ({filteredUsers.length})</CardTitle></CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-100">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">E-mail</th>
                    <th className="text-left p-3">Perfil</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Último Acesso</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b hover:bg-slate-50">
                      <td className="p-3 font-medium">{u.name || "-"}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3"><Badge variant="outline">{roleLabels[u.role] || u.role}</Badge></td>
                      <td className="p-3">
                        {!u.isActive ? <Badge variant="destructive">Inativo</Badge> : 
                         isLocked(u) ? <Badge className="bg-orange-500">Bloqueado</Badge> : 
                         <Badge className="bg-green-500">Ativo</Badge>}
                      </td>
                      <td className="p-3 text-slate-500">{u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString("pt-BR") : "Nunca"}</td>
                      <td className="p-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setConfirmAction("reset"); }} title="Redefinir Senha"><Key className="h-4 w-4" /></Button>
                          {isLocked(u) ? 
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setConfirmAction("unblock"); }} title="Desbloquear"><Unlock className="h-4 w-4" /></Button> :
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setConfirmAction("block"); }} title="Bloquear"><Lock className="h-4 w-4" /></Button>
                          }
                          {u.isActive ? 
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setConfirmAction("deactivate"); }} title="Desativar"><UserX className="h-4 w-4" /></Button> :
                            <Button size="sm" variant="outline" onClick={() => { setSelectedUser(u); setConfirmAction("activate"); }} title="Ativar"><UserCheck className="h-4 w-4" /></Button>
                          }
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {confirmAction === "reset" && "Redefinir Senha"}
                {confirmAction === "block" && "Bloquear Usuário"}
                {confirmAction === "unblock" && "Desbloquear Usuário"}
                {confirmAction === "deactivate" && "Desativar Usuário"}
                {confirmAction === "activate" && "Ativar Usuário"}
              </DialogTitle>
            </DialogHeader>
            <p className="text-slate-600">
              {confirmAction === "reset" && `A nova senha será gerada e enviada por notificação. Usuário: ${selectedUser?.email}`}
              {confirmAction === "block" && `O usuário ${selectedUser?.email} será bloqueado por 24 horas.`}
              {confirmAction === "unblock" && `O usuário ${selectedUser?.email} será desbloqueado imediatamente.`}
              {confirmAction === "deactivate" && `O usuário ${selectedUser?.email} não poderá mais acessar o sistema.`}
              {confirmAction === "activate" && `O usuário ${selectedUser?.email} poderá acessar o sistema novamente.`}
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmAction(null)}>Cancelar</Button>
              <Button onClick={handleAction} className={confirmAction === "deactivate" || confirmAction === "block" ? "bg-red-600 hover:bg-red-700" : ""}>
                Confirmar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
