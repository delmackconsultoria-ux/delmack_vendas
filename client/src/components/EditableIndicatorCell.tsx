import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, X, Edit2 } from "lucide-react";
import { toast } from "sonner";

interface EditableIndicatorCellProps {
  value: number;
  indicatorName: string;
  month: number;
  year: number;
  onSave: (value: number) => Promise<void>;
  isEditable: boolean;
  isSaving?: boolean;
}

/**
 * Converter valor com locale brasileiro (vírgula) para número
 * Exemplo: "0,10" -> 0.10, "1.234,56" -> 1234.56
 */
function parseMonetaryValue(value: string): number {
  if (!value || value.trim() === "") {
    return 0;
  }

  const str = value.trim();

  // Se já é um número com ponto, retornar como é
  if (!isNaN(Number(str)) && !str.includes(",")) {
    return Number(str);
  }

  // Converter locale brasileiro (1.234,56) para número
  // Remover pontos (separador de milhares) e substituir vírgula por ponto
  const normalized = str
    .replace(/\./g, "") // Remove pontos (1.234 -> 1234)
    .replace(/,/g, "."); // Substitui vírgula por ponto (1234,56 -> 1234.56)

  const parsed = parseFloat(normalized);
  return !isNaN(parsed) ? parsed : 0;
}

/**
 * Formatar número para exibição em locale brasileiro
 * Exemplo: 0.10 -> "0,10", 1234.56 -> "1.234,56"
 */
function formatMonetaryValue(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function EditableIndicatorCell({
  value,
  indicatorName,
  month,
  year,
  onSave,
  isEditable,
  isSaving = false,
}: EditableIndicatorCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(formatMonetaryValue(value));
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const numValue = parseMonetaryValue(editValue);

      if (isNaN(numValue) || numValue < 0) {
        toast.error("Valor inválido. Use ponto ou vírgula como separador decimal.");
        return;
      }

      await onSave(numValue);
      setIsEditing(false);
      toast.success("Valor atualizado com sucesso");
    } catch (error) {
      toast.error("Erro ao salvar valor");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditValue(formatMonetaryValue(value));
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSave();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  if (!isEditable) {
    return <span>{formatMonetaryValue(value)}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="text"
          inputMode="decimal"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 w-20 text-sm"
          placeholder="0,00"
          disabled={isLoading}
          autoFocus
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleSave}
          disabled={isLoading}
          title="Salvar (Enter)"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleCancel}
          disabled={isLoading}
          title="Cancelar (Esc)"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{formatMonetaryValue(value)}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={() => setIsEditing(true)}
        disabled={isSaving}
        title="Editar"
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
