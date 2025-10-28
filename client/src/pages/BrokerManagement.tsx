import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, FileText, X } from "lucide-react";
import { useState } from "react";

interface Broker {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
  sales: number;
  commissions: number;
  performance: number;
}

const mockBrokers: Broker[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao@baggio.com.br",
    phone: "(11) 98765-4321",
    status: "active",
    sales: 15,
    commissions: 45000,
    performance: 85,
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria@baggio.com.br",
    phone: "(11) 91234-5678",
    status: "active",
    sales: 18,
    commissions: 54000,
    performance: 92,
  },
  {
    id: "3",
    name: "Pedro Costa",
    email: "pedro@baggio.com.br",
    phone: "(11) 99876-5432",
    status: "active",
    sales: 12,
    commissions: 36000,
    performance: 78,
  },
];

interface FormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  status: "active" | "inactive";
}

export default function BrokerManagementPage() {
  const [brokers, setBrokers] = useState<Broker[]>(mockBrokers);
  const [searchTerm, setSearchTerm] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    status: "active",
  });

  const filteredBrokers = brokers.filter(
    (broker) =>
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenAddModal = () => {
    setEditingBroker(null);
    setFormData({ name: "", email: "", phone: "", status: "active" });
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
    });
    setShowModal(true);
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
        sales: 0,
        commissions: 0,
        performance: 0,
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

  return (
    <>
      <AppHeader />
      <div className="min-h-screen bg-slate-50 pt-16">
        <div className="px-6 py-8 max-w-7xl mx-auto">
          <div className="mb-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Gerenciamento de Corretores
              </h1>
              <p className="text-slate-600 mt-2">
                Gerencie os corretores da sua equipe e acompanhe seu desempenho
              </p>
            </div>
            <Button
              onClick={handleOpenAddModal}
              className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Corretor
            </Button>
          </div>

          {/* Estatísticas Rápidas */}
          <div className="grid gap-4 md:grid-cols-4 mb-8">
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total de Corretores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">{brokers.length}</p>
                <p className="text-xs text-slate-600 mt-2">
                  {brokers.filter((b) => b.status === "active").length} ativos
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-blue-600" />
                  Total de Vendas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {brokers.reduce((sum, b) => sum + b.sales, 0)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-600" />
                  Total de Comissões
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  R$ {(brokers.reduce((sum, b) => sum + b.commissions, 0) / 1000).toFixed(0)}k
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-slate-600 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  Performance Média
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-slate-900">
                  {brokers.length > 0
                    ? Math.round(brokers.reduce((sum, b) => sum + b.performance, 0) / brokers.length)
                    : 0}
                  %
                </p>
              </CardContent>
            </Card>
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
            <CardHeader>
              <CardTitle>Corretores da Equipe</CardTitle>
              <CardDescription>
                {filteredBrokers.length} corretor(es) encontrado(s)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Nome</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Email</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Telefone</th>
                      <th className="text-left py-3 px-4 font-semibold text-slate-900">Status</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Vendas</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Comissões</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Performance</th>
                      <th className="text-center py-3 px-4 font-semibold text-slate-900">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBrokers.map((broker) => (
                      <tr key={broker.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4 text-slate-900 font-medium">{broker.name}</td>
                        <td className="py-4 px-4 text-slate-600">{broker.email}</td>
                        <td className="py-4 px-4 text-slate-600">{broker.phone}</td>
                        <td className="py-4 px-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(broker.status)}`}>
                            {getStatusLabel(broker.status)}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center text-slate-900 font-medium">
                          {broker.sales}
                        </td>
                        <td className="py-4 px-4 text-center text-slate-900 font-medium">
                          R$ {broker.commissions.toLocaleString()}
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-16 bg-slate-200 rounded-full h-2">
                              <div
                                className="bg-purple-600 h-2 rounded-full"
                                style={{ width: `${broker.performance}%` }}
                              ></div>
                            </div>
                            <span className="text-sm text-slate-600 font-medium">
                              {broker.performance}%
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex justify-center gap-2">
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
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modal de Adicionar/Editar Corretor */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
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
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
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

