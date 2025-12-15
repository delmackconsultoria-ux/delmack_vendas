import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Users, Upload, LogOut, Plus, Eye, EyeOff, FileSpreadsheet, Settings } from "lucide-react";
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
  const [newCompany, setNewCompany] = useState({ name: "", email: "", phone: "" });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const companiesQuery = trpc.superadmin.listCompanies.useQuery();
  const createCompanyMutation = trpc.superadmin.createCompany.useMutation();
  const uploadUsersMutation = trpc.superadmin.uploadUsers.useMutation();

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
      setNewCompany({ name: "", email: "", phone: "" });
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
              <div className="text-3xl font-bold text-white">{companiesQuery.data?.length || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Usuários Totais</CardTitle>
              <Users className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{companiesQuery.data?.reduce((acc: number, c: any) => acc + (c.userCount || 0), 0) || 0}</div>
            </CardContent>
          </Card>
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-300">Licenças Ativas</CardTitle>
              <FileSpreadsheet className="h-4 w-4 text-purple-400" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-white">{companiesQuery.data?.filter((c: any) => c.isActive).length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex gap-4 mb-8">
          <Button onClick={() => setShowCompanyModal(true)} className="bg-purple-600 hover:bg-purple-700 gap-2">
            <Plus className="h-4 w-4" />
            Nova Empresa
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
                    <span className="text-sm text-slate-400">{company.userCount || 0} usuários</span>
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300" onClick={() => { setSelectedCompanyId(company.id); setShowUploadModal(true); }}>
                      <Upload className="h-4 w-4" />
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
                <Label className="text-slate-300">Nome da Empresa</Label>
                <Input
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">E-mail</Label>
                <Input
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  className="mt-1 bg-slate-700 border-slate-600 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">Telefone</Label>
                <Input
                  value={newCompany.phone}
                  onChange={(e) => setNewCompany({ ...newCompany, phone: e.target.value })}
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
    </div>
  );
}
