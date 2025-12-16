import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, UserX, UserCheck, Search, Users, Upload, Download, Edit2 } from "lucide-react";
import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { AppHeader } from "@/components/AppHeader";

export default function UserManagement() {
  const { user } = useAuth();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [newUser, setNewUser] = useState<{ name: string; surname: string; email: string; role: "broker" | "finance" }>({ name: "", surname: "", email: "", role: "broker" });
  const [uploadedUsers, setUploadedUsers] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const usersQuery = trpc.company.listUsers.useQuery();
  const addUserMutation = trpc.company.addUser.useMutation();
  const toggleUserMutation = trpc.company.toggleUserStatus.useMutation();
  const updateUserMutation = trpc.company.updateUser.useMutation();

  // Exportar anexos para backup
  const handleExportAttachments = async () => {
    try {
      const result = await fetch('/api/trpc/company.exportAttachments');
      const data = await result.json();
      if (data.result?.data?.attachments?.length > 0) {
        const attachments = data.result.data.attachments;
        // Criar arquivo JSON com links de download
        const blob = new Blob([JSON.stringify(attachments, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup-anexos-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        toast.success(`${attachments.length} anexos exportados!`);
      } else {
        toast.info('Nenhum anexo encontrado para exportar');
      }
    } catch {
      toast.error('Erro ao exportar anexos');
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser) return;
    try {
      await updateUserMutation.mutateAsync({
        userId: editingUser.id,
        name: editingUser.name,
        email: editingUser.email,
        role: editingUser.role,
      });
      toast.success("Usuário atualizado!");
      setShowEditModal(false);
      setEditingUser(null);
      usersQuery.refetch();
    } catch (error) {
      toast.error("Erro ao atualizar usuário");
    }
  };

  const handleAddUser = async () => {
    try {
      await addUserMutation.mutateAsync(newUser);
      toast.success("Usuário adicionado! E-mail enviado com as credenciais.");
      setShowAddModal(false);
      setNewUser({ name: "", surname: "", email: "", role: "broker" });
      usersQuery.refetch();
    } catch (error) {
      toast.error("Erro ao adicionar usuário");
    }
  };

  const handleToggleUser = async (userId: string, isActive: boolean) => {
    try {
      await toggleUserMutation.mutateAsync({ userId, isActive: !isActive });
      toast.success(isActive ? "Usuário desativado" : "Usuário reativado");
      usersQuery.refetch();
    } catch (error) {
      toast.error("Erro ao alterar status");
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const data = new Uint8Array(event.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet);
      const users = json.map((row: any) => ({
        name: row["Nome"] || "",
        surname: row["Sobrenome"] || "",
        email: row["E-mail"] || row["Email"] || "",
        role: (row["Perfil"] || "broker").toLowerCase(),
      }));
      setUploadedUsers(users);
      toast.success(`${users.length} usuários carregados`);
    };
    reader.readAsArrayBuffer(file);
  };

  const handleUploadUsers = async () => {
    for (const u of uploadedUsers) {
      try {
        await addUserMutation.mutateAsync(u);
      } catch (e) {}
    }
    toast.success("Usuários criados!");
    setShowUploadModal(false);
    setUploadedUsers([]);
    usersQuery.refetch();
  };

  const filteredUsers = usersQuery.data?.filter((u: any) => {
    const matchesSearch = u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && u.isActive) || 
      (statusFilter === "inactive" && !u.isActive);
    return matchesSearch && matchesStatus;
  }) || [];

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppHeader />
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Gestão de Usuários</h1>
            <p className="text-slate-600">Gerencie os usuários da sua empresa</p>
          </div>
          <div className="flex gap-2">
            <a href="/template-usuarios.xlsx" download className="inline-flex items-center gap-2 px-4 py-2 border rounded-md text-sm hover:bg-slate-50">
              <Download className="h-4 w-4" /> Template
            </a>
            <Button onClick={() => setShowUploadModal(true)} variant="outline" className="gap-2">
              <Upload className="h-4 w-4" /> Upload Excel
            </Button>
            <Button onClick={() => setShowAddModal(true)} className="gap-2 bg-slate-800">
              <Plus className="h-4 w-4" /> Novo Usuário
            </Button>
            <Button onClick={handleExportAttachments} variant="outline" className="gap-2">
              <Download className="h-4 w-4" /> Backup Anexos
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Total de Usuários</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{usersQuery.data?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {usersQuery.data?.filter((u: any) => u.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-slate-500">Inativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {usersQuery.data?.filter((u: any) => !u.isActive).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome ou email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            className="px-4 py-2 border rounded-md bg-white"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "all" | "active" | "inactive")}
          >
            <option value="all">Todos</option>
            <option value="active">Ativos</option>
            <option value="inactive">Inativos</option>
          </select>
        </div>

        {/* Users Table */}
        <Card>
          <CardContent className="p-0">
            <table className="w-full">
              <thead className="bg-slate-50 border-b">
                <tr>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Nome</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Email</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Perfil</th>
                  <th className="text-left p-4 text-sm font-medium text-slate-600">Status</th>
                  <th className="text-right p-4 text-sm font-medium text-slate-600">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="border-b hover:bg-slate-50">
                    <td className="p-4 font-medium">{u.name}</td>
                    <td className="p-4 text-slate-600">{u.email}</td>
                    <td className="p-4">
                      <Badge variant="outline">{u.role}</Badge>
                    </td>
                    <td className="p-4">
                      <Badge className={u.isActive ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                        {u.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </td>
                    <td className="p-4 text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => { setEditingUser(u); setShowEditModal(true); }}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant={u.isActive ? "destructive" : "default"}
                        onClick={() => handleToggleUser(u.id, u.isActive)}
                      >
                        {u.isActive ? <UserX className="h-4 w-4" /> : <UserCheck className="h-4 w-4" />}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      </main>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Novo Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Nome</Label>
                  <Input value={newUser.name} onChange={(e) => setNewUser({ ...newUser, name: e.target.value })} />
                </div>
                <div>
                  <Label>Sobrenome</Label>
                  <Input value={newUser.surname} onChange={(e) => setNewUser({ ...newUser, surname: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={newUser.email} onChange={(e) => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <Label>Perfil</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={newUser.role}
                  onChange={(e) => setNewUser({ ...newUser, role: e.target.value as "broker" | "finance" })}
                >
                  <option value="broker">Corretor</option>
                  <option value="finance">Financeiro</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddModal(false)}>Cancelar</Button>
                <Button onClick={handleAddUser}>Adicionar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-lg">
            <CardHeader>
              <CardTitle>Upload de Usuários</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input ref={fileInputRef} type="file" accept=".xlsx,.xls" onChange={handleFileUpload} />
              {uploadedUsers.length > 0 && (
                <div className="bg-slate-50 p-3 rounded text-sm">
                  {uploadedUsers.length} usuários prontos para importar
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowUploadModal(false); setUploadedUsers([]); }}>Cancelar</Button>
                <Button onClick={handleUploadUsers} disabled={uploadedUsers.length === 0}>Importar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && editingUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editar Usuário</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input value={editingUser.name || ""} onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })} />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input type="email" value={editingUser.email || ""} onChange={(e) => setEditingUser({ ...editingUser, email: e.target.value })} />
              </div>
              <div>
                <Label>Perfil</Label>
                <select
                  className="w-full p-2 border rounded-md"
                  value={editingUser.role}
                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                >
                  <option value="broker">Corretor</option>
                  <option value="finance">Financeiro</option>
                  <option value="manager">Gerente</option>
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => { setShowEditModal(false); setEditingUser(null); }}>Cancelar</Button>
                <Button onClick={handleUpdateUser}>Salvar</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
