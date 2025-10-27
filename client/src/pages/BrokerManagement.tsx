import { AppHeader } from "@/components/AppHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Edit2, Trash2, TrendingUp, DollarSign, FileText } from "lucide-react";
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

export default function BrokerManagementPage() {
  const [brokers, setBrokers] = useState<Broker[]>(mockBrokers);
  const [searchTerm, setSearchTerm] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBroker, setEditingBroker] = useState<Broker | null>(null);

  const filteredBrokers = brokers.filter(
    (broker) =>
      broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      broker.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteBroker = (id: string) => {
    if (confirm("Tem certeza que deseja remover este corretor?")) {
      setBrokers(brokers.filter((b) => b.id !== id));
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
              onClick={() => setShowAddModal(true)}
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
                  {Math.round(brokers.reduce((sum, b) => sum + b.performance, 0) / brokers.length)}%
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
                              onClick={() => setEditingBroker(broker)}
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
    </>
  );
}

