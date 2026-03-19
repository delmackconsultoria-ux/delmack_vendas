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
  const [editValue, setEditValue] = useState(String(value));
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const numValue = parseFloat(editValue);
      
      if (isNaN(numValue)) {
        toast.error("Valor inválido");
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
    setEditValue(String(value));
    setIsEditing(false);
  };

  if (!isEditable) {
    return <span>{value.toFixed(2)}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <Input
          type="number"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 w-20 text-sm"
          placeholder="0"
          disabled={isLoading}
        />
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleSave}
          disabled={isLoading}
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={handleCancel}
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span>{value.toFixed(2)}</span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 w-6 p-0"
        onClick={() => setIsEditing(true)}
        disabled={isSaving}
      >
        <Edit2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
