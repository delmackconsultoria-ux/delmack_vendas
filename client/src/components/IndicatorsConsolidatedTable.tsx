import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface IndicatorData {
  title: string;
  monthlyGoal: number | string;
  annualAverage: number | string;
  percentageAchieved: number;
  total: number;
  months: {
    jan: number;
    fev: number;
    mar: number;
    abr: number;
    mai: number;
    jun: number;
    jul: number;
    ago: number;
    set: number;
    out: number;
    nov: number;
    dez: number;
  };
  isCurrency?: boolean;
  isPercentage?: boolean;
  isInteger?: boolean;
  isManualData?: boolean;
}

interface IndicatorsConsolidatedTableProps {
  indicators: IndicatorData[];
  isLoading?: boolean;
  year?: number;
}

const MONTH_ABBREVIATIONS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
};

const formatNumber = (value: number): string => {
  return new Intl.NumberFormat("pt-BR").format(value);
};

const formatInteger = (value: number): string => {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
};

const formatPercentage = (value: number): string => {
  // O valor já é o percentual (ex: 5.77 = 5,77%), não usar style:percent que multiplicaria por 100
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value) + "%";
};

export function IndicatorsConsolidatedTable({
  indicators,
  isLoading = false,
  year = new Date().getFullYear(),
}: IndicatorsConsolidatedTableProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Carregando indicadores...</p>
      </div>
    );
  }

  if (!indicators || indicators.length === 0) {
    return (
      <div className="flex items-center justify-center h-32">
        <p className="text-muted-foreground">Nenhum indicador disponível para este período</p>
      </div>
    );
  }

  const formatValue = (value: any, isCurrency: boolean = true, isPercentage: boolean = false, isInteger: boolean = false): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") {
      // Retornar vazio se o valor for 0
      if (value === 0) return "";
      // Formatar como percentual se isPercentage for true
      if (isPercentage) {
        return formatPercentage(value);
      }
      // Formatar como inteiro se isInteger for true
      if (isInteger) {
        return formatInteger(value);
      }
      // Formatar como moeda se isCurrency for true
      if (isCurrency) {
        return formatCurrency(value);
      }
      return formatNumber(value);
    }
    return "";
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 100) return "text-green-600 font-semibold";
    if (percentage >= 80) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getMonthColorStyle = (monthValue: number, monthlyGoal: number | string): React.CSSProperties => {
    const goal = typeof monthlyGoal === "string" ? parseFloat(monthlyGoal) : monthlyGoal;
    // Não colorir se o valor for 0 ou se a meta for 0
    if (monthValue === 0 || goal === 0) return {};
    
    if (monthValue >= goal) {
      return {
        backgroundColor: '#dcfce7',
        color: '#14532d',
      };
    } else {
      return {
        backgroundColor: '#fee2e2',
        color: '#7f1d1d',
      };
    }
  };

  return (
    <div className="overflow-x-auto">
      <Table className="text-xs">
        <TableHeader className="sticky top-0 z-20">
          <TableRow className="bg-muted/50">
            <TableHead className="sticky left-0 top-0 bg-muted/50 z-30 min-w-[140px]">Título</TableHead>
            <TableHead className="sticky top-0 bg-muted/50 z-20 text-right min-w-[65px]">Meta Mensal</TableHead>
            <TableHead className="sticky top-0 bg-muted/50 z-20 text-right min-w-[65px]">Média Anual</TableHead>
            <TableHead className="sticky top-0 bg-muted/50 z-20 text-right min-w-[45px]">%</TableHead>
            <TableHead className="sticky top-0 bg-muted/50 z-20 text-right min-w-[65px]">Total</TableHead>
            {MONTH_ABBREVIATIONS.map((month) => (
              <TableHead key={month} className="sticky top-0 bg-muted/50 z-20 text-right min-w-[55px] w-[55px]">
                {month}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {indicators.map((indicator, idx) => (
            <TableRow key={idx} className={indicator.isManualData ? "bg-blue-50" : idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
              <TableCell className={`sticky left-0 z-10 font-medium ${indicator.isManualData ? "bg-blue-50" : "bg-inherit"}`}>
                {indicator.title}
              </TableCell>
              <TableCell className="text-right">{formatValue(indicator.monthlyGoal, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right">{formatValue(indicator.annualAverage, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className={`text-right ${getPercentageColor(parseFloat(String(indicator.percentageAchieved)))}`}>
                {parseFloat(String(indicator.percentageAchieved)).toFixed(1)}%
              </TableCell>
              <TableCell className="text-right font-semibold">{formatValue(indicator.total, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.jan, indicator.monthlyGoal)}>{formatValue(indicator.months.jan, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.fev, indicator.monthlyGoal)}>{formatValue(indicator.months.fev, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.mar, indicator.monthlyGoal)}>{formatValue(indicator.months.mar, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.abr, indicator.monthlyGoal)}>{formatValue(indicator.months.abr, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.mai, indicator.monthlyGoal)}>{formatValue(indicator.months.mai, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.jun, indicator.monthlyGoal)}>{formatValue(indicator.months.jun, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.jul, indicator.monthlyGoal)}>{formatValue(indicator.months.jul, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.ago, indicator.monthlyGoal)}>{formatValue(indicator.months.ago, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.set, indicator.monthlyGoal)}>{formatValue(indicator.months.set, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.out, indicator.monthlyGoal)}>{formatValue(indicator.months.out, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.nov, indicator.monthlyGoal)}>{formatValue(indicator.months.nov, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
              <TableCell className="text-right" style={getMonthColorStyle(indicator.months.dez, indicator.monthlyGoal)}>{formatValue(indicator.months.dez, indicator.isCurrency !== false, indicator.isPercentage, indicator.isInteger)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
