import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Upload, LogOut, Plus, Eye, EyeOff, FileSpreadsheet, Settings, UserPlus, Copy, Trash2, Ban, Key, Check, X } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useState, useRef } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

export default function DashboardSuperAdmin() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [uploadedUsers, setUploadedUsers] = useState<any[]>([]);
  const [newCompany, setNewCompany] = useState({ name: "", cnpj: "", email: "", phone: "", address: "" });
  const [showUserModal, setShowUserModal] = useState(false);
  const [newUser, setNewUser] = useState({ name: "", email: "", role: "broker", companyId: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companiesQuery = trpc.superadmin.listCompanies.useQuery();
  const statsQuery = trpc.superadmin.getStats.useQuery();
  const createCompanyMutation = trpc.superadmin.createCompany.useMutation();
  const uploadUsersMutation = trpc.superadmin.uploadUsers.useMutation();
  const createUserMutation = trpc.superadmin.createUser.useMutation();
  const updateCompanyMutation = trpc.superadmin.updateCompany.useMutation();
  const licenseAlertsQuery = trpc.superadmin.getLicenseAlerts.useQuery();
  const actionLogsQuery = trpc.superadmin.getActionLogs.useQuery({ limit: 10 });
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<any>(null);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [companyUsers, setCompanyUsers] = useState<any[]>([]);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);
  const companyStatsQuery = trpc.superadmin.getCompanyStats.useQuery(
    { companyId: selectedCompany?.id || "" },
    { enabled: !!selectedCompany?.id }
  );

  const handleUpdateCompany = async (field: string, value: any) => {
    if (!selectedCompany) return;
    try {
      await updateCompanyMutation.mutateAsync({ companyId: selectedCompany.id, [field]: value });
      toast.success("Empresa atualizada!");
      companiesQuery.refetch();
      setSelectedCompany({ ...selectedCompany, [field]: value });
    } catch (error) {
      toast.error("Erro ao atualizar");
    }
  };

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => setLocation("/login"),
  });

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
      
      // Map Excel columns to user fields
      const users = jsonData.map((row: any) => ({
        name: row["Nome"] || row["name"] || "",
        surname: row["Sobrenome"] || row["surname"] || "",
        email: row["E-mail"] || row["Email"] || row["email"] || "",
        role: (row["Perfil"] || row["Role"] || row["role"] || "broker").toLowerCase(),
        company: row["Empresa"] || row["Company"] || row["company"] || "",
      }));
      
      setUploadedUsers(users);
      toast.success(`${users.length} usuários carregados do Excel`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadUsers = async () => {
    if (!selectedCompanyId || uploadedUsers.length === 0) {
      toast.error("Selecione uma empresa e carregue um arquivo Excel");
      return;
    }

    try {
      const result = await uploadUsersMutation.mutateAsync({
        companyId: selectedCompanyId,
        users: uploadedUsers,
      });
      toast.success(`${result.created} usuários criados. E-mails enviados com as senhas!`);
      setShowUploadModal(false);
      setUploadedUsers([]);
    } catch (error) {
      toast.error("Erro ao criar usuários");
    }
  };

  const handleCreateCompany = async () => {
    try {
      await createCompanyMutation.mutateAsync(newCompany);
      toast.success("Empresa criada com sucesso!");
      setShowCompanyModal(false);
      setNewCompany({ name: "", cnpj: "", email: "", phone: "", address: "" });
      companiesQuery.refetch();
    } catch (error) {
      toast.error("Erro ao criar empresa");
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 border-b border-slate-700 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-purple-600 p-2 rounded-lg">
              <Settings className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Delmack Admin</h1>
              <p className="text-xs text-purple-300">Painel de Controle</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-white">{user.name}</p>
              <Badge className="bg-purple-600">Super Admin</Badge>
            </div>
            <Button variant="outline" size="sm" onClick={handleLogout} className="gap-2 border-slate-600 text-slate-300 hover:bg-slate-700">
              <LogOut className="h-4 w-4" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white">Bem-vindo, Super Admin!</h2>
          <p className="text-purple-300 mt-2">Gerencie todas as empresas e usuários do sistema</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Empresas Ativas</CardTitle>
              <Building2 className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statsQuery.data?.totalCompanies || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Usuários Totais</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statsQuery.data?.totalUsers || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Licenças Ativas</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{statsQuery.data?.totalLogins || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* License Alerts */}
        {licenseAlertsQuery.data && licenseAlertsQuery.data.length > 0 && (
          <Card className="bg-red-900/30 border-red-700 mb-8">
            <CardHeader className="pb-2">
              <CardTitle className="text-red-300 text-sm">⚠️ Alertas de Licença</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {licenseAlertsQuery.data.map((c: any) => (
                  <div key={c.id} className="flex justify-between items-center text-sm">
                    <span className="text-white">{c.name}</span>
                    <Badge className="bg-red-600">Vence em {c.licenseExpiresAt ? new Date(c.licenseExpiresAt).toLocaleDateString() : 'N/A'}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowCompanyModal(true)} className="bg-purple-600 hover:bg-purple-700 gap-2">
            <Plus className="h-4 w-4" />
            Nova Empresa
          </Button>
          <Button onClick={() => setShowUserModal(true)} className="bg-green-600 hover:bg-green-700 gap-2">
            <UserPlus className="h-4 w-4" />
            Novo Usuário
          </Button>
          <Button onClick={() => setShowUploadModal(true)} variant="outline" className="border-purple-600 text-purple-400 hover:bg-purple-600/20 gap-2">
            <Upload className="h-4 w-4" />
            Upload de Usuários
          </Button>
        </div>

        {/* Companies List */}
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Empresas Cadastradas</CardTitle>
            <CardDescription className="text-slate-400">Gerencie as empresas e seus usuários</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {companiesQuery.data?.map((company: any) => (
                <div key={company.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div>
                    <h3 className="font-medium text-white">{company.name}</h3>
                    <p className="text-sm text-slate-400">{company.email}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge variant={company.isActive ? "default" : "secondary"} className={company.isActive ? "bg-green-600" : "bg-red-600"}>
                      {company.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                    <Badge variant="outline" className="border-purple-600 text-purple-400">
                      {company.licenseType || "trial"}
                    </Badge>
                    <button 
                      className="text-sm text-slate-400 hover:text-purple-400 cursor-pointer underline"
                      onClick={() => { setSelectedCompany(company); setShowUsersModal(true); }}
                    >
                      {company.userCount || 0} usuários
                    </button>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setSelectedCompanyId(company.id); setShowUploadModal(true); }} title="Upload de Usuários">
                      <Upload className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" className="text-purple-400" onClick={() => { setSelectedCompany(company); setShowDetailsModal(true); }} title="Detalhes">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      className="text-red-400 hover:bg-red-600/20" 
                      onClick={async () => {
                        if (!confirm(`Deseja desativar a empresa ${company.name}? Todos os usuários também serão desativados.`)) return;
                        try {
                          await updateCompanyMutation.mutateAsync({ companyId: company.id, isActive: false });
                          toast.success("Empresa desativada");
                          companiesQuery.refetch();
                        } catch (e) {
                          toast.error("Erro ao desativar empresa");
                        }
                      }}
                      title="Desativar Empresa"
                    >
                      <Ban className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {(!companiesQuery.data || companiesQuery.data.length === 0) && (
                <p className="text-center text-slate-400 py-8">Nenhuma empresa cadastrada</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Action Logs */}
        <Card className="bg-slate-800/50 border-slate-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Histórico de Ações</CardTitle>
            <CardDescription className="text-slate-400">Últimas ações no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {actionLogsQuery.data?.map((log: any) => (
                <div key={log.id} className="flex justify-between items-center text-sm p-2 bg-slate-700/30 rounded">
                  <div>
                    <span className="text-white font-medium">{log.userName || 'Sistema'}</span>
                    <span className="text-slate-400 ml-2">{log.action === 'create' ? 'criou' : log.action === 'update' ? 'atualizou' : log.action === 'delete' ? 'removeu' : log.action === 'activate' ? 'ativou' : log.action === 'deactivate' ? 'desativou' : log.action} {log.targetType}</span>
                  </div>
                  <span className="text-slate-500 text-xs">{log.createdAt ? new Date(log.createdAt).toLocaleString() : ''}</span>
                </div>
              ))}
              {(!actionLogsQuery.data || actionLogsQuery.data.length === 0) && (
                <p className="text-center text-slate-400 py-4">Nenhuma ação registrada</p>
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Upload de Usuários</CardTitle>
              <CardDescription className="text-slate-400">
                Faça upload de um arquivo Excel com: Nome, Sobrenome, E-mail, Perfil (broker/manager/finance), Empresa
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Selecione a Empresa</Label>
                <select
                  className="w-full mt-1 p-2 bg-slate-700 border border-slate-600 rounded-md text-white"
                  value={selectedCompanyId || ""}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                >
                  <option value="">Selecione...</option>
                  {companiesQuery.data?.map((c: any) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-slate-300">Arquivo Excel (.xlsx)</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              {uploadedUsers.length > 0 && (
                <div className="max-h-48 overflow-auto bg-slate-700/50 rounded-lg p-4">
                  <p className="text-sm text-slate-300 mb-2">{uploadedUsers.length} usuários carregados:</p>
                  {uploadedUsers.slice(0, 5).map((u, i) => (
                    <p key={i} className="text-xs text-slate-400">{u.name} {u.surname} - {u.email} ({u.role})</p>
                  ))}
                  {uploadedUsers.length > 5 && <p className="text-xs text-slate-500">... e mais {uploadedUsers.length - 5}</p>}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadedUsers([]); }} className="border-slate-600 text-slate-300">
                  Cancelar
                </Button>
                <Button onClick={handleUploadUsers} disabled={!selectedCompanyId || uploadedUsers.length === 0} className="bg-purple-600 hover:bg-purple-700">
                  Criar Usuários e Enviar E-mails
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New Company Modal */}
      {showCompanyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Nova Empresa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Nome da Empresa *</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  placeholder="Ex: Imobiliária ABC"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">CNPJ *</Label>
                <Input
                  value={newCompany.cnpj}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 14) {
                      v = v.replace(/(\d{2})(\d)/, "$1.$2");
                      v = v.replace(/(\d{3})(\d)/, "$1.$2");
                      v = v.replace(/(\d{3})(\d)/, "$1/$2");
                      v = v.replace(/(\d{4})(\d)/, "$1-$2");
                    }
                    setNewCompany({ ...newCompany, cnpj: v });
                  }}
                  placeholder="00.000.000/0000-00"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">E-mail *</Label>
                <Input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  placeholder="contato@empresa.com.br"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Telefone</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => {
                    let v = e.target.value.replace(/\D/g, "");
                    if (v.length <= 11) {
                      v = v.replace(/(\d{2})(\d)/, "($1) $2");
                      v = v.replace(/(\d{5})(\d)/, "$1-$2");
                    }
                    setNewCompany({ ...newCompany, phone: v });
                  }}
                  placeholder="(00) 00000-0000"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Endereço</Label>
                <Input
                  value={newCompany.address}
                  onChange={(e) => setNewCompany({ ...newCompany, address: e.target.value })}
                  placeholder="Rua, número, bairro, cidade - UF"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowCompanyModal(false)} className="border-slate-600 text-slate-300">
                  Cancelar
                </Button>
                <Button onClick={handleCreateCompany} className="bg-purple-600 hover:bg-purple-700">
                  Criar Empresa
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto py-8">
          <Card className="w-full max-w-2xl bg-slate-800 border-slate-700 my-auto">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <span className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {selectedCompany.name}</span>
                <Button variant="ghost" size="sm" onClick={() => setShowDetailsModal(false)} className="text-slate-400">X</Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">{selectedCompany.userCount || 0}</div>
                  <div className="text-sm text-slate-400">Usuários</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-white">{selectedCompany.totalLogins || 0}</div>
                  <div className="text-sm text-slate-400">Acessos</div>
                </div>
                <div className="bg-slate-700 p-4 rounded-lg text-center">
                  <Badge className={selectedCompany.isActive ? "bg-green-600" : "bg-red-600"}>
                    {selectedCompany.isActive ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>

              {/* Métricas de Vendas */}
              <div className="bg-purple-900/30 p-4 rounded-lg">
                <h3 className="text-purple-300 font-medium mb-3">Métricas de Vendas</h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-xl font-bold text-white">{companyStatsQuery.data?.totalSales || 0}</div>
                    <div className="text-xs text-slate-400">Vendas</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-400">R$ {((companyStatsQuery.data?.totalValue || 0) / 1000000).toFixed(1)}M</div>
                    <div className="text-xs text-slate-400">Valor Total</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xl font-bold text-yellow-400">R$ {((companyStatsQuery.data?.totalCommissions || 0) / 1000).toFixed(0)}k</div>
                    <div className="text-xs text-slate-400">Comissões</div>
                  </div>
                </div>
              </div>

              {/* License */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Licença</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Tipo</Label>
                    <select
                      className="w-full p-2 rounded-md bg-slate-600 border-slate-500 text-white mt-1"
                      value={selectedCompany.licenseType || "monthly"}
                      onChange={(e) => handleUpdateCompany("licenseType", e.target.value)}
                    >
                      <option value="perpetual">Perpétua</option>
                      <option value="monthly">Mensal</option>
                      <option value="quarterly">Trimestral</option>
                      <option value="semiannual">Semestral</option>
                      <option value="annual">Anual</option>
                    </select>
                  </div>
                  <div>
                    <Label className="text-slate-400">Data de Início</Label>
                    <Input type="date" value={selectedCompany.licenseStartDate?.split("T")[0] || ""} onChange={(e) => handleUpdateCompany("licenseStartDate", new Date(e.target.value))} className="bg-slate-600 border-slate-500 text-white mt-1" />
                  </div>
                </div>
              </div>

              {/* Contract */}
              <div className="bg-slate-700 p-4 rounded-lg">
                <h3 className="text-white font-medium mb-3">Contrato</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-slate-400">Responsável</Label>
                    <Input value={selectedCompany.contractResponsible || ""} onChange={(e) => handleUpdateCompany("contractResponsible", e.target.value)} className="bg-slate-600 border-slate-500 text-white mt-1" placeholder="Nome" />
                  </div>
                  <div>
                    <Label className="text-slate-400">Email</Label>
                    <Input type="email" value={selectedCompany.contractResponsibleEmail || ""} onChange={(e) => handleUpdateCompany("contractResponsibleEmail", e.target.value)} className="bg-slate-600 border-slate-500 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400">Telefone</Label>
                    <Input value={selectedCompany.contractResponsiblePhone || ""} onChange={(e) => handleUpdateCompany("contractResponsiblePhone", e.target.value)} className="bg-slate-600 border-slate-500 text-white mt-1" />
                  </div>
                  <div>
                    <Label className="text-slate-400">Data do Contrato</Label>
                    <Input type="date" value={selectedCompany.contractStartDate?.split("T")[0] || ""} onChange={(e) => handleUpdateCompany("contractStartDate", new Date(e.target.value))} className="bg-slate-600 border-slate-500 text-white mt-1" />
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-slate-400">Observações</Label>
                  <textarea value={selectedCompany.contractNotes || ""} onChange={(e) => handleUpdateCompany("contractNotes", e.target.value)} className="w-full p-2 rounded-md bg-slate-600 border-slate-500 text-white mt-1 min-h-[80px]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* New User Modal */}
      {showUserModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <UserPlus className="h-5 w-5" />
                Novo Usuário
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Nome Completo *</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="João da Silva"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">E-mail *</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="joao@empresa.com.br"
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Perfil *</Label>
                <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v })}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="broker">Corretor</SelectItem>
                    <SelectItem value="manager">Gerente</SelectItem>
                    <SelectItem value="finance">Financeiro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">Empresa *</Label>
                <Select value={newUser.companyId} onValueChange={(v) => setNewUser({ ...newUser, companyId: v })}>
                  <SelectTrigger className="mt-1 bg-slate-700 border-slate-600 text-white">
                    <SelectValue placeholder="Selecione a empresa" />
                  </SelectTrigger>
                  <SelectContent>
                    {companiesQuery.data?.map((company: any) => (
                      <SelectItem key={company.id} value={company.id}>{company.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowUserModal(false)} className="border-slate-600 text-slate-300">
                  Cancelar
                </Button>
                <Button 
                  onClick={async () => {
                    if (!newUser.name || !newUser.email || !newUser.companyId) {
                      toast.error("Preencha todos os campos obrigatórios");
                      return;
                    }
                    try {
                      const result = await createUserMutation.mutateAsync(newUser as any);
                      setCreatedPassword(result.password);
                      toast.success(
                        <div className="flex items-center gap-2">
                          <span>Usuário criado! Senha: <strong>{result.password}</strong></span>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(result.password);
                              toast.success("Senha copiada!");
                            }}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>,
                        { duration: 30000 }
                      );
                      setShowUserModal(false);
                      setNewUser({ name: "", email: "", role: "broker", companyId: "" });
                      companiesQuery.refetch();
                    } catch (error: any) {
                      toast.error(error.message || "Erro ao criar usuário");
                    }
                  }}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={createUserMutation.isPending}
                >
                  {createUserMutation.isPending ? "Criando..." : "Criar Usuário"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Users List Modal */}
      {showUsersModal && selectedCompany && (
        <UsersListModal
          company={selectedCompany}
          onClose={() => { setShowUsersModal(false); setSelectedCompany(null); }}
          onRefresh={() => companiesQuery.refetch()}
        />
      )}
    </div>
  );
}

// Componente separado para o modal de usuários
function UsersListModal({ company, onClose, onRefresh }: { company: any; onClose: () => void; onRefresh: () => void }) {
  const usersQuery = trpc.superadmin.listCompanyUsers.useQuery({ companyId: company.id });
  const resetPasswordMutation = trpc.superadmin.resetPasswordWithReturn.useMutation();
  const toggleActiveMutation = trpc.superadmin.toggleUserActive.useMutation();
  const deleteMutation = trpc.superadmin.deleteUser.useMutation();

  const handleResetPassword = async (userId: string) => {
    try {
      const result = await resetPasswordMutation.mutateAsync({ userId });
      toast.success(
        <div className="flex items-center gap-2">
          <span>Nova senha: <strong>{result.password}</strong></span>
          <button
            onClick={() => {
              navigator.clipboard.writeText(result.password);
              toast.success("Senha copiada!");
            }}
            className="p-1 hover:bg-slate-700 rounded"
          >
            <Copy className="h-4 w-4" />
          </button>
        </div>,
        { duration: 30000 }
      );
      usersQuery.refetch();
    } catch (error: any) {
      toast.error(error.message || "Erro ao redefinir senha");
    }
  };

  const handleToggleActive = async (userId: string, active: boolean) => {
    try {
      await toggleActiveMutation.mutateAsync({ userId, active });
      toast.success(active ? "Usuário ativado" : "Usuário desativado");
      usersQuery.refetch();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao alterar status");
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Tem certeza que deseja remover este usuário?")) return;
    try {
      await deleteMutation.mutateAsync({ userId });
      toast.success("Usuário removido");
      usersQuery.refetch();
      onRefresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao remover usuário");
    }
  };

  const roleLabels: Record<string, string> = {
    broker: "Corretor",
    manager: "Gerente",
    finance: "Financeiro",
    admin: "Admin",
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 overflow-auto py-8">
      <Card className="w-full max-w-4xl bg-slate-800 border-slate-700 my-auto max-h-[90vh] overflow-auto">
        <CardHeader>
          <CardTitle className="text-white flex items-center justify-between">
            <span className="flex items-center gap-2"><Users className="h-5 w-5" /> Usuários - {company.name}</span>
            <Button variant="ghost" size="sm" onClick={onClose} className="text-slate-400"><X className="h-5 w-5" /></Button>
          </CardTitle>
          <CardDescription className="text-slate-400">{usersQuery.data?.length || 0} usuários cadastrados</CardDescription>
        </CardHeader>
        <CardContent>
          {usersQuery.isLoading ? (
            <p className="text-center text-slate-400 py-8">Carregando...</p>
          ) : usersQuery.data?.length === 0 ? (
            <p className="text-center text-slate-400 py-8">Nenhum usuário cadastrado nesta empresa</p>
          ) : (
            <div className="space-y-3">
              {usersQuery.data?.map((user: any) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-slate-700/50 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-white">{user.name}</h4>
                      <Badge className={user.isActive ? "bg-green-600" : "bg-red-600"}>
                        {user.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                      <Badge variant="outline" className="border-purple-600 text-purple-400">
                        {roleLabels[user.role] || user.role}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-400">{user.email}</p>
                    {user.lastSignedIn && (
                      <p className="text-xs text-slate-500">Último acesso: {new Date(user.lastSignedIn).toLocaleString()}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-yellow-600 text-yellow-400 hover:bg-yellow-600/20"
                      onClick={() => handleResetPassword(user.id)}
                      disabled={resetPasswordMutation.isPending}
                      title="Redefinir Senha"
                    >
                      <Key className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className={user.isActive ? "border-orange-600 text-orange-400 hover:bg-orange-600/20" : "border-green-600 text-green-400 hover:bg-green-600/20"}
                      onClick={() => handleToggleActive(user.id, !user.isActive)}
                      disabled={toggleActiveMutation.isPending}
                      title={user.isActive ? "Desativar" : "Ativar"}
                    >
                      {user.isActive ? <Ban className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-600 text-red-400 hover:bg-red-600/20"
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isPending}
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
