import { useState, useCallback } from "react";

/**
 * Hook para aplicar máscara monetária (R$) em campos de input
 * Formata automaticamente enquanto o usuário digita
 * 
 * @param initialValue Valor inicial (número ou string)
 * @returns [displayValue, rawValue, handleChange]
 * 
 * Exemplo de uso:
 * const [displayValue, rawValue, handleChange] = useCurrencyMask(0);
 * <Input value={displayValue} onChange={handleChange} />
 */
export function useCurrencyMask(initialValue: number | string = 0) {
  const formatCurrency = useCallback((value: number): string => {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  }, []);

  const parseCurrency = useCallback((value: string): number => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, "");
    // Converte para número (centavos)
    const cents = parseInt(numbers || "0", 10);
    // Retorna valor em reais
    return cents / 100;
  }, []);

  const [rawValue, setRawValue] = useState<number>(() => {
    if (typeof initialValue === "number") return initialValue;
    return parseCurrency(initialValue);
  });

  const [displayValue, setDisplayValue] = useState<string>(() =>
    formatCurrency(rawValue)
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      const parsed = parseCurrency(inputValue);
      setRawValue(parsed);
      setDisplayValue(formatCurrency(parsed));
    },
    [formatCurrency, parseCurrency]
  );

  return [displayValue, rawValue, handleChange, setRawValue] as const;
}
