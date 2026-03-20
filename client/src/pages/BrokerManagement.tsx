import { AppHeader } from "@/components/AppHeader";
import { trpc } from "@/lib/trpc";
import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { AlertCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, FileText, X, Key } from "lucide-react";
import { toast } from "sonner";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  role: "broker" | "finance" | "manager";
  sales: number;
  commissions: number;
  performance: number;
  teamMembers?: TeamMember[];
}

const mockBrokersTest: Broker[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@testes.com.br",
    phone: "(11) 98765-4321",
    status: "active",
    role: "broker",
    sales: 15,
    commissions: 45000,
    performance: 85,
    teamMembers: [],
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@testes.com.br",
    phone: "(11) 91234-5678",
    status: "active",
    role: "broker",
    sales: 18,
    commissions: 54000,
    performance: 92,
    teamMembers: [],
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro@testes.com.br",
    phone: "(11) 99876-5432",
    status: "active",
    role: "broker",
    sales: 12,
    commissions: 36000,
    performance: 78,
    teamMembers: [],
  },
];

interface FormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  teamMembers?: TeamMember[];
}

interface TeamFormData {
  name: string;
  email: string;
  role: string;
}

export default function BrokerManagementPage() {
  const { user } = useAuth();
  
  // Buscar usuários da equipe do gerente
  const { data: teamUsers = [], isLoading, refetch } = trpc.managerUsers.listTeamUsers.useQuery();
  
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    status: "active",
    teamMembers: [],
  });
  const [teamFormData, setTeamFormData] = useState<TeamFormData>({
    name: "",
    email: "",
    role: "",
  });

  // Mutations
  const resetPasswordMutation = trpc.managerUsers.resetUserPassword.useMutation({
    onSuccess: (data: any) => {
      toast.success(data.message);
      setShowPasswordDialog(false);
      setSelectedUserId(null);
      refetch();
    },
    onError: (error: any) => {
      toast.error(error.message || "Erro ao redefinir senha");
    },
  });
  
  // Atualizar lista de corretores quando os dados chegarem
  useEffect(() => {
    if (teamUsers) {
      // Converter dados do backend para o formato Broker
      const formattedBrokers: Broker[] = teamUsers.map((u: any) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        phone: "", // Campo phone não existe no schema
        status: "active",
        role: u.role,
        sales: 0,
        commissions: 0,
        performance: 0,
        teamMembers: [],
      }));
      setBrokers(formattedBrokers);
    }
  }, [teamUsers]);

  const filteredBrokers = brokers.filter(
    (broker) =>
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingBroker(null);
    setFormData({ name: "", email: "", phone: "", status: "active", teamMembers: [] });
    setShowModal(true);
  };

  const handleOpenEditModal = (broker: Broker) => {
    setEditingBroker(broker);
    setFormData({
      id: broker.id,
      name: broker.name,
      email: broker.email,
      phone: broker.phone,
      status: broker.status,
      teamMembers: broker.teamMembers || [],
    });
    setShowModal(true);
  };

  const handleAddTeamMember = () => {
    if (!teamFormData.name || !teamFormData.email || !teamFormData.role) {
      alert("Por favor, preencha todos os campos da equipe!");
      return;
    }

    const newTeamMember: TeamMember = {
      id: Date.now().toString(),
      name: teamFormData.name,
      email: teamFormData.email,
      role: teamFormData.role,
    };

    setFormData({
      ...formData,
      teamMembers: [...(formData.teamMembers || []), newTeamMember],
    });

    setTeamFormData({ name: "", email: "", role: "" });
    setShowTeamModal(false);
  };

  const handleRemoveTeamMember = (memberId: string) => {
    setFormData({
      ...formData,
      teamMembers: (formData.teamMembers || []).filter((m) => m.id !== memberId),
    });
  };

  const handleSaveBroker = () => {
    if (!formData.name || !formData.email || !formData.phone) {
      alert("Por favor, preencha todos os campos!");
      return;
    }

    if (editingBroker) {
      // Editar corretor existente
      setBrokers(
        brokers.map((b) =>
          b.id === editingBroker.id
            ? {
                ...b,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                status: formData.status,
                role: b.role,
                teamMembers: formData.teamMembers || [],
              }
            : b
        )
      );
      alert("Corretor atualizado com sucesso!");
    } else {
      // Adicionar novo corretor
      const newBroker: Broker = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        status: formData.status,
        role: "broker",
        sales: 0,
        commissions: 0,
        performance: 0,
        teamMembers: formData.teamMembers || [],
      };
      setBrokers([...brokers, newBroker]);
      alert("Corretor adicionado com sucesso!");
    }

    setShowModal(false);
  };

  const handleDeleteBroker = (id: string) => {
    if (confirm("Tem certeza que deseja remover este corretor?")) {
      setBrokers(brokers.filter((b) => b.id !== id));
      alert("Corretor removido com sucesso!");
    }
  };

  const getStatusColor = (status: string) => {
    return status === "active"
      ? "bg-green-100 text-green-800"
      : "bg-red-100 text-red-800";
  };

  const getStatusLabel = (status: string) => {
    return status === "active" ? "Ativo" : "Inativo";
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

  const handleResetPassword = async (userId: string) => {
    await resetPasswordMutation.mutateAsync({ userId });
  };

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50">
        <div className="px-6 py-6 max-w-7xl mx-auto">
          <div className="mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Gerenciamento de Corretores
              </h1>
              <p className="text-slate-600 mt-1 text-sm">
                Gerencie os corretores da sua equipe e acompanhe seu desempenho
              </p>
            </div>
            <Button
              onClick={handleOpenAddModal}
              style={{ backgroundColor: '#0b0bb5' }} className="hover:opacity-90 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Corretor
            </Button>
          </div>



          {/* Barra de Busca */}
          <div className="mb-6">
            <Input
              placeholder="Buscar por nome ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Tabela de Corretores */}
          <Card className="border-0 shadow-md">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-slate-50">
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Nome
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Email
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Telefone
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Perfil
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Vendas
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Comissões
                      </th>
                      <th className="py-4 px-4 text-left text-sm font-semibold text-slate-900">
                        Performance
                      </th>
                      <th className="py-4 px-4 text-center text-sm font-semibold text-slate-900">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrokers.length > 0 ? (
                      filteredBrokers.map((broker) => (
                        <tr key={broker.id} className="border-b hover:bg-slate-50 transition-colors">
                          <td className="py-4 px-4">
                            <div>
                              <p className="text-sm font-medium text-slate-900">{broker.name}</p>
                              {broker.teamMembers && broker.teamMembers.length > 0 && (
                                <p className="text-xs text-slate-500 mt-1">
                                  {broker.teamMembers.length} membro(s) na equipe
                                </p>
                              )}
                            </div>
                          </td>
                          <td className="py-4 px-4 text-sm text-slate-600">{broker.email}</td>
                          <td className="py-4 px-4 text-sm text-slate-600">{broker.phone}</td>
                          <td className="py-4 px-4">
                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {getRoleLabel(broker.role)}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-slate-900">
                            {broker.sales}
                          </td>
                          <td className="py-4 px-4 text-sm font-medium text-green-600">
                            R$ {(broker.commissions / 1000).toFixed(1)}k
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <div className="w-24 bg-slate-200 rounded-full h-2">
                                <div
                                  style={{ backgroundColor: '#0b0bb5', width: `${broker.performance}%` }}
                                  className="h-2 rounded-full"
                                ></div>
                              </div>
                              <span className="text-sm font-medium text-slate-900 w-8">
                                {broker.performance}%
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex justify-center gap-2">
                              <button
                                onClick={() => {
                                  setSelectedUserId(broker.id);
                                  setShowPasswordDialog(true);
                                }}
                                className="p-2 hover:bg-green-100 rounded-lg transition-colors"
                                title="Gerar nova senha"
                              >
                                <Key className="h-4 w-4 text-green-600" />
                              </button>
                              <button
                                onClick={() => handleOpenEditModal(broker)}
                                className="p-2 hover:bg-blue-100 rounded-lg transition-colors"
                                title="Editar"
                              >
                                <Edit2 className="h-4 w-4 text-blue-600" />
                              </button>
                              <button
                                onClick={() => handleDeleteBroker(broker.id)}
                                className="p-2 hover:bg-red-100 rounded-lg transition-colors"
                                title="Remover"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="pt-24 text-center text-slate-500">
                          Nenhum corretor encontrado
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Reset Password Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
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
                  setShowPasswordDialog(false);
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

      {/* Modal de Adicionar Membro da Equipe */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Adicionar Membro da Equipe</CardTitle>
              <button
                onClick={() => setShowTeamModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome</label>
                <Input
                  value={teamFormData.name}
                  onChange={(e) => setTeamFormData({ ...teamFormData, name: e.target.value })}
                  placeholder="Digite o nome do membro"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={teamFormData.email}
                  onChange={(e) => setTeamFormData({ ...teamFormData, email: e.target.value })}
                  placeholder="Digite o email do membro"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Funcao/Cargo</label>
                <Input
                  value={teamFormData.role}
                  onChange={(e) => setTeamFormData({ ...teamFormData, role: e.target.value })}
                  placeholder="Ex: Assistente, Gerente de Vendas"
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleAddTeamMember}
                  style={{ backgroundColor: '#0b0bb5' }} className="flex-1 hover:opacity-90 text-white"
                >
                  Adicionar
                </Button>
                <Button
                  onClick={() => setShowTeamModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal de Adicionar/Editar Corretor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 sticky top-0 bg-white">
              <CardTitle>
                {editingBroker ? "Editar Corretor" : "Adicionar Novo Corretor"}
              </CardTitle>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-700">Nome</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Digite o nome do corretor"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="Digite o email do corretor"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Telefone</label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Digite o telefone do corretor"
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md"
                >
                  <option value="active">Ativo</option>
                  <option value="inactive">Inativo</option>
                </select>
              </div>



              <div className="flex gap-2 pt-4">
                <Button
                  onClick={handleSaveBroker}
                  style={{ backgroundColor: '#0b0bb5' }} className="flex-1 hover:opacity-90 text-white"
                >
                  {editingBroker ? "Atualizar" : "Adicionar"}
                </Button>
                <Button
                  onClick={() => setShowModal(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

