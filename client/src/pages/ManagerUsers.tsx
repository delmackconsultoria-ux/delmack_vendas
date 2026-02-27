import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AppHeader } from "@/components/AppHeader";
import { toast } from "sonner";
import { Plus, Trash2, Mail, Shield, Key } from "lucide-react";

export default function ManagerUsers() {
  const { user } = useAuth();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: "", email: "", role: "broker" });

  // Queries
  const { data: teamUsers = [], isLoading, refetch } = trpc.managerUsers.listTeamUsers.useQuery();
  
  // Mutations
  const createUserMutation = trpc.managerUsers.createTeamUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setFormData({ name: "", email: "", role: "broker" });
      setIsDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao criar usuário");
    },
  });

  const removeUserMutation = trpc.managerUsers.removeTeamUser.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao remover usuário");
    },
  });

  const resetPasswordMutation = trpc.managerUsers.resetUserPassword.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      setIsPasswordDialogOpen(false);
      setSelectedUserId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao redefinir senha");
    },
  });

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error("Preencha todos os campos");
      return;
    }
    await createUserMutation.mutateAsync({
      name: formData.name,
      email: formData.email,
      role: formData.role as "broker" | "finance",
    });
  };

  const handleRemoveUser = async (userId: string) => {
    if (confirm("Tem certeza que deseja remover este usuário? Os dados históricos serão mantidos.")) {
      await removeUserMutation.mutateAsync({ userId });
    }
  };

  const handleResetPassword = async (userId: string) => {
    await resetPasswordMutation.mutateAsync({ userId });
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "broker":
        return "Corretor";
      case "finance":
        return "Financeiro";
      case "manager":
        return "Gerente";
      default:
        return role;
    }
  };

  if (!user || user.role !== "manager") {
    return (
      <div className="min-h-screen flex flex-col">
        <AppHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-red-600">Acesso Negado</h1>
            <p className="text-gray-600 mt-2">Apenas gerentes podem acessar esta página.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <AppHeader />
      
      <div className="flex-1 p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
            <p className="text-gray-600 mt-2">Crie e gerencie corretores e usuários financeiros da sua equipe</p>
          </div>

          {/* Create User Dialog */}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mb-6 bg-blue-600 hover:bg-blue-700">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Usuário</DialogTitle>
                <DialogDescription>
                  Adicione um novo corretor ou usuário financeiro à sua equipe
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo
                  </label>
                  <Input
                    type="text"
                    placeholder="João Silva"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="joao@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Perfil
                  </label>
                  <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="broker">Corretor</SelectItem>
                      <SelectItem value="finance">Financeiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={createUserMutation.isPending}>
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Reset Password Dialog */}
          <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Redefinir Senha</DialogTitle>
                <DialogDescription>
                  Uma nova senha forte será gerada e enviada por email ao usuário
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Tem certeza que deseja redefinir a senha deste usuário? Uma nova senha será gerada e enviada automaticamente.
                </p>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setSelectedUserId(null);
                    }}
                  >
                    Cancelar
                  </Button>
                  <Button
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      if (selectedUserId) {
                        handleResetPassword(selectedUserId);
                      }
                    }}
                    disabled={resetPasswordMutation.isPending}
                  >
                    {resetPasswordMutation.isPending ? "Redefinindo..." : "Redefinir Senha"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Users List */}
          <div className="grid gap-6">
            {isLoading ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Carregando usuários...</p>
                </CardContent>
              </Card>
            ) : teamUsers.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <p className="text-center text-gray-500">Nenhum usuário na sua equipe ainda.</p>
                </CardContent>
              </Card>
            ) : (
              teamUsers.map((u) => (
                <Card key={u.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                          <Shield className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{u.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Mail className="w-4 h-4 text-gray-400" />
                            <p className="text-sm text-gray-600">{u.email}</p>
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            Perfil: <span className="font-medium">{getRoleLabel(u.role)}</span>
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUserId(u.id);
                            setIsPasswordDialogOpen(true);
                          }}
                          disabled={resetPasswordMutation.isPending}
                        >
                          <Key className="w-4 h-4" />
                        </Button>
                        {u.id !== user.id && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleRemoveUser(u.id)}
                            disabled={removeUserMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
