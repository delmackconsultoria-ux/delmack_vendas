import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { History, Filter, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { formatCurrency } from "@/lib/commissionCalculator";

const ACTION_LABELS: Record<string, { label: string; color: string }> = {
  create: { label: "Criação", color: "bg-green-100 text-green-700" },
  update: { label: "Atualização", color: "bg-blue-100 text-blue-700" },
  delete: { label: "Exclusão", color: "bg-red-100 text-red-700" },
  status_change: { label: "Mudança de Status", color: "bg-purple-100 text-purple-700" },
  approval: { label: "Aprovação", color: "bg-emerald-100 text-emerald-700" },
  rejection: { label: "Rejeição", color: "bg-orange-100 text-orange-700" },
};

const FIELD_LABELS: Record<string, string> = {
  saleValue: "Valor da Venda",
  expectedPaymentDate: "Previsão de Recebimento",
  status: "Status",
  buyerName: "Nome do Comprador",
  sellerName: "Nome do Vendedor",
  brokerVendedor: "Corretor Vendedor",
  brokerAngariador: "Corretor Angariador",
  comissaoTotal: "Comissão Total",
  porcentagemComissao: "Porcentagem de Comissão",
  tipoComissao: "Tipo de Comissão",
};

export default function AuditLogTable() {
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const limit = 20;

  const { data: auditData, isLoading } = trpc.audit.listAuditLogs.useQuery({
    action: actionFilter !== "all" ? (actionFilter as any) : undefined,
    userId: userFilter !== "all" ? userFilter : undefined,
    limit,
    offset: currentPage * limit,
  });

  // Filtrar logs localmente por termo de busca
  const filteredLogs = useMemo(() => {
    if (!auditData?.logs) return [];
    if (!searchTerm) return auditData.logs;

    return auditData.logs.filter((log: any) => {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.changedByName?.toLowerCase().includes(searchLower) ||
        log.saleId?.toLowerCase().includes(searchLower) ||
        log.fieldName?.toLowerCase().includes(searchLower) ||
        log.changeReason?.toLowerCase().includes(searchLower)
      );
    });
  }, [auditData, searchTerm]);

  const formatValue = (fieldName: string | null, value: string | null) => {
    if (!value) return "-";
    
    // Formatar valores monetários
    if (fieldName === "saleValue" || fieldName === "comissaoTotal") {
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) return formatCurrency(numValue);
    }

    // Formatar datas
    if (fieldName === "expectedPaymentDate" || fieldName?.includes("Date")) {
      try {
        const date = new Date(value);
        return date.toLocaleDateString("pt-BR");
      } catch {
        return value;
      }
    }

    return value;
  };

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Tipo de Ação</label>
              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="create">Criação</SelectItem>
                  <SelectItem value="update">Atualização</SelectItem>
                  <SelectItem value="status_change">Mudança de Status</SelectItem>
                  <SelectItem value="approval">Aprovação</SelectItem>
                  <SelectItem value="rejection">Rejeição</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Buscar</label>
              <Input
                placeholder="Venda, usuário, campo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Alterações
            {auditData?.total && (
              <Badge variant="secondary" className="ml-auto">
                {auditData.total} registro{auditData.total !== 1 ? "s" : ""}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-slate-500">Carregando...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              Nenhuma alteração registrada
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data/Hora</TableHead>
                      <TableHead>Usuário</TableHead>
                      <TableHead>Ação</TableHead>
                      <TableHead>Campo Alterado</TableHead>
                      <TableHead>Valor Anterior</TableHead>
                      <TableHead>Valor Novo</TableHead>
                      <TableHead>Motivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLogs.map((log: any) => {
                      const actionConfig = ACTION_LABELS[log.action] || { label: log.action, color: "bg-slate-100 text-slate-700" };
                      const fieldLabel = FIELD_LABELS[log.fieldName || ""] || log.fieldName || "-";

                      return (
                        <TableRow key={log.id}>
                          <TableCell className="whitespace-nowrap">
                            {log.createdAt ? new Date(log.createdAt).toLocaleString("pt-BR") : "-"}
                          </TableCell>
                          <TableCell className="font-medium">
                            {log.changedByName || "Sistema"}
                          </TableCell>
                          <TableCell>
                            <Badge className={actionConfig.color}>
                              {actionConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{fieldLabel}</TableCell>
                          <TableCell className="text-slate-600">
                            {formatValue(log.fieldName, log.previousValue)}
                          </TableCell>
                          <TableCell className="font-medium text-blue-600">
                            {formatValue(log.fieldName, log.newValue)}
                          </TableCell>
                          <TableCell className="text-sm text-slate-500 max-w-xs truncate">
                            {log.changeReason || "-"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {auditData && auditData.total > limit && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-slate-500">
                    Mostrando {currentPage * limit + 1} a {Math.min((currentPage + 1) * limit, auditData.total)} de {auditData.total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={currentPage === 0}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => p + 1)}
                      disabled={!auditData.hasMore}
                    >
                      Próxima
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
