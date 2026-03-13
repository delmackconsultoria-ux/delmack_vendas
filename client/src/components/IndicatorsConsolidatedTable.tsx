import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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

export function IndicatorsConsolidatedTable({
  indicators,
  isLoading = false,
  year = new Date().getFullYear(),
}: IndicatorsConsolidatedTableProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tabela Consolidada de Indicadores</CardTitle>
          <CardDescription>Carregando dados...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Carregando indicadores...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!indicators || indicators.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tabela Consolidada de Indicadores</CardTitle>
          <CardDescription>Nenhum dado disponível</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">Nenhum indicador disponível para este período</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatValue = (value: any): string => {
    if (typeof value === "string") return value;
    if (typeof value === "number") {
      if (value > 1000) {
        return formatCurrency(value);
      }
      return formatNumber(value);
    }
    return "-";
  };

  const getPercentageColor = (percentage: number): string => {
    if (percentage >= 100) return "text-green-600 font-semibold";
    if (percentage >= 80) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  const getMonthColor = (monthValue: number, monthlyGoal: number | string): string => {
    const goal = typeof monthlyGoal === "string" ? parseFloat(monthlyGoal) : monthlyGoal;
    if (goal === 0) return "";
    
    if (monthValue >= goal) {
      return "bg-green-100 text-green-900";
    } else {
      return "bg-red-100 text-red-900";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Tabela Consolidada de Indicadores</CardTitle>
        <CardDescription>Análise detalhada de todos os indicadores para {year}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table className="text-sm">
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[200px]">Título</TableHead>
                <TableHead className="text-right min-w-[100px]">Meta Mensal</TableHead>
                <TableHead className="text-right min-w-[100px]">Média Anual</TableHead>
                <TableHead className="text-right min-w-[80px]">%</TableHead>
                <TableHead className="text-right min-w-[100px]">Total</TableHead>
                {MONTH_ABBREVIATIONS.map((month) => (
                  <TableHead key={month} className="text-right min-w-[70px]">
                    {month}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {indicators.map((indicator, idx) => (
                <TableRow key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-muted/30"}>
                  <TableCell className="sticky left-0 bg-inherit z-10 font-medium">
                    {indicator.title}
                  </TableCell>
                  <TableCell className="text-right">{formatValue(indicator.monthlyGoal)}</TableCell>
                  <TableCell className="text-right">{formatValue(indicator.annualAverage)}</TableCell>
                  <TableCell className={`text-right ${getPercentageColor(indicator.percentageAchieved)}`}>
                    {indicator.percentageAchieved.toFixed(1)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">{formatValue(indicator.total)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.jan, indicator.monthlyGoal)}`}>{formatValue(indicator.months.jan)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.fev, indicator.monthlyGoal)}`}>{formatValue(indicator.months.fev)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.mar, indicator.monthlyGoal)}`}>{formatValue(indicator.months.mar)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.abr, indicator.monthlyGoal)}`}>{formatValue(indicator.months.abr)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.mai, indicator.monthlyGoal)}`}>{formatValue(indicator.months.mai)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.jun, indicator.monthlyGoal)}`}>{formatValue(indicator.months.jun)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.jul, indicator.monthlyGoal)}`}>{formatValue(indicator.months.jul)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.ago, indicator.monthlyGoal)}`}>{formatValue(indicator.months.ago)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.set, indicator.monthlyGoal)}`}>{formatValue(indicator.months.set)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.out, indicator.monthlyGoal)}`}>{formatValue(indicator.months.out)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.nov, indicator.monthlyGoal)}`}>{formatValue(indicator.months.nov)}</TableCell>
                  <TableCell className={`text-right ${getMonthColor(indicator.months.dez, indicator.monthlyGoal)}`}>{formatValue(indicator.months.dez)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
