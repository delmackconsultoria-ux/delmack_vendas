import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { User, Key, Eye, EyeOff, ArrowLeft, CheckCircle } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

export default function Profile() {
  const { user } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const changePasswordMutation = trpc.auth.changePassword.useMutation({
    onSuccess: () => {
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast.success("Senha alterada com sucesso!");
    },
    onError: (err: any) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError("As senhas não correspondem");
      return;
    }
    if (newPassword.length < 6) {
      setError("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }

    changePasswordMutation.mutate({ currentPassword, newPassword });
  };

  const roleLabels: Record<string, string> = { superadmin: "Super Administrador", manager: "Gerente", broker: "Corretor", finance: "Financeiro" };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppHeader />
      <main className="container pt-24 max-w-2xl">
        <div className="flex items-center gap-4 mb-6">
          <a href="/" className="text-slate-600 hover:text-slate-900"><ArrowLeft className="h-5 w-5" /></a>
          <h1 className="text-2xl font-bold flex items-center gap-2"><User className="h-6 w-6" /> Meu Perfil</h1>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informações da Conta</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-slate-500">Nome</label>
                <p className="font-medium">{user?.name || "-"}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">E-mail</label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Perfil</label>
                <p className="font-medium">{roleLabels[user?.role || ""] || user?.role}</p>
              </div>
              <div>
                <label className="text-sm text-slate-500">Último acesso</label>
                <p className="font-medium">{user?.lastSignedIn ? new Date(user.lastSignedIn).toLocaleString("pt-BR") : "-"}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Key className="h-5 w-5" /> Alterar Senha</CardTitle>
            <CardDescription>Digite sua senha atual e a nova senha desejada</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
              {success && <Alert className="bg-green-50 border-green-200"><CheckCircle className="h-4 w-4 text-green-600" /><AlertDescription className="text-green-800">Senha alterada com sucesso!</AlertDescription></Alert>}

              <div className="space-y-2">
                <label className="text-sm font-medium">Senha atual</label>
                <div className="relative">
                  <Input type={showPasswords ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required className="pr-10" />
                  <button type="button" onClick={() => setShowPasswords(!showPasswords)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                    {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Nova senha</label>
                <Input type={showPasswords ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required placeholder="Mínimo 6 caracteres" />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Confirmar nova senha</label>
                <Input type={showPasswords ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
              </div>

              <Button type="submit" disabled={changePasswordMutation.isPending} className="w-full">
                {changePasswordMutation.isPending ? "Salvando..." : "Alterar Senha"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
