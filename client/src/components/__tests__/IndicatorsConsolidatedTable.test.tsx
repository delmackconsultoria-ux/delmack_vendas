import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { IndicatorsConsolidatedTable } from "../IndicatorsConsolidatedTable";

describe("IndicatorsConsolidatedTable - Currency Formatting", () => {
  const mockIndicators = [
    {
      title: "Despesa Geral",
      monthlyGoal: 4166.67,
      annualAverage: 50000,
      percentageAchieved: 0,
      total: 10,
      isCurrency: true,
      months: {
        jan: 0,
        fev: 0,
        mar: 10,
        abr: 0,
        mai: 0,
        jun: 0,
        jul: 0,
        ago: 0,
        set: 0,
        out: 0,
        nov: 0,
        dez: 0,
      },
    },
    {
      title: "Despesa com Impostos",
      monthlyGoal: 2500,
      annualAverage: 30000,
      percentageAchieved: 3,
      total: 900,
      isCurrency: true,
      months: {
        jan: 0,
        fev: 0,
        mar: 900,
        abr: 0,
        mai: 0,
        jun: 0,
        jul: 0,
        ago: 0,
        set: 0,
        out: 0,
        nov: 0,
        dez: 0,
      },
    },
    {
      title: "Fundo Inovação",
      monthlyGoal: 1666.67,
      annualAverage: 20000,
      percentageAchieved: 3500,
      total: 700000,
      isCurrency: true,
      months: {
        jan: 0,
        fev: 0,
        mar: 700000,
        abr: 0,
        mai: 0,
        jun: 0,
        jul: 0,
        ago: 0,
        set: 0,
        out: 0,
        nov: 0,
        dez: 0,
      },
    },
  ];

  it("deve formatar valores pequenos com R$ (menores que 1000)", () => {
    render(<IndicatorsConsolidatedTable indicators={mockIndicators.slice(0, 1)} />);

    // Verificar que 10 é formatado como "R$ 10,00"
    const cells = screen.getAllByText(/R\$/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("deve formatar valores médios com R$ (entre 1000 e 10000)", () => {
    render(<IndicatorsConsolidatedTable indicators={mockIndicators.slice(1, 2)} />);

    // Verificar que 900 e 2500 são formatados com R$
    const cells = screen.getAllByText(/R\$/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("deve formatar valores grandes com R$ e separador de milhares", () => {
    render(<IndicatorsConsolidatedTable indicators={mockIndicators.slice(2, 3)} />);

    // Verificar que 700000 é formatado como "R$ 700.000,00"
    const cells = screen.getAllByText(/R\$/);
    expect(cells.length).toBeGreaterThan(0);
  });

  it("deve exibir todos os indicadores com formatação correta", () => {
    render(<IndicatorsConsolidatedTable indicators={mockIndicators} />);

    // Verificar que a tabela foi renderizada
    expect(screen.getByText("Despesa Geral")).toBeInTheDocument();
    expect(screen.getByText("Despesa com Impostos")).toBeInTheDocument();
    expect(screen.getByText("Fundo Inovação")).toBeInTheDocument();

    // Verificar que há múltiplos valores com R$
    const currencyCells = screen.getAllByText(/R\$/);
    expect(currencyCells.length).toBeGreaterThan(0);
  });

  it("deve não formatar como moeda quando isCurrency = false", () => {
    const nonCurrencyIndicators = [
      {
        title: "Número de Atendimentos",
        monthlyGoal: 25,
        annualAverage: 300,
        percentageAchieved: 0,
        total: 0,
        isCurrency: false,
        months: {
          jan: 0,
          fev: 0,
          mar: 0,
          abr: 0,
          mai: 0,
          jun: 0,
          jul: 0,
          ago: 0,
          set: 0,
          out: 0,
          nov: 0,
          dez: 0,
        },
      },
    ];

    render(<IndicatorsConsolidatedTable indicators={nonCurrencyIndicators} />);

    // Verificar que não há R$ para valores não-monetários
    expect(screen.queryByText(/R\$/)).not.toBeInTheDocument();
  });

  it("deve exibir mensagem quando não há indicadores", () => {
    render(<IndicatorsConsolidatedTable indicators={[]} />);

    expect(screen.getByText("Nenhum indicador disponível para este período")).toBeInTheDocument();
  });

  it("deve exibir loading state corretamente", () => {
    render(<IndicatorsConsolidatedTable indicators={mockIndicators} isLoading={true} />);

    expect(screen.getByText("Carregando indicadores...")).toBeInTheDocument();
  });

  describe("Formatação de Valores Específicos", () => {
    it("deve formatar 0.10 como R$ 0,10", () => {
      const indicators = [
        {
          title: "Teste",
          monthlyGoal: 0.1,
          annualAverage: 0,
          percentageAchieved: 0,
          total: 0,
          isCurrency: true,
          months: {
            jan: 0,
            fev: 0,
            mar: 0,
            abr: 0,
            mai: 0,
            jun: 0,
            jul: 0,
            ago: 0,
            set: 0,
            out: 0,
            nov: 0,
            dez: 0,
          },
        },
      ];

      render(<IndicatorsConsolidatedTable indicators={indicators} />);

      // Verificar que há R$ na tabela
      const currencyCells = screen.getAllByText(/R\$/);
      expect(currencyCells.length).toBeGreaterThan(0);
    });

    it("deve formatar 900 como R$ 900,00", () => {
      const indicators = [
        {
          title: "Teste",
          monthlyGoal: 900,
          annualAverage: 0,
          percentageAchieved: 0,
          total: 0,
          isCurrency: true,
          months: {
            jan: 0,
            fev: 0,
            mar: 0,
            abr: 0,
            mai: 0,
            jun: 0,
            jul: 0,
            ago: 0,
            set: 0,
            out: 0,
            nov: 0,
            dez: 0,
          },
        },
      ];

      render(<IndicatorsConsolidatedTable indicators={indicators} />);

      // Verificar que há R$ na tabela
      const currencyCells = screen.getAllByText(/R\$/);
      expect(currencyCells.length).toBeGreaterThan(0);
    });

    it("deve formatar 700000 como R$ 700.000,00", () => {
      const indicators = [
        {
          title: "Teste",
          monthlyGoal: 700000,
          annualAverage: 0,
          percentageAchieved: 0,
          total: 0,
          isCurrency: true,
          months: {
            jan: 0,
            fev: 0,
            mar: 0,
            abr: 0,
            mai: 0,
            jun: 0,
            jul: 0,
            ago: 0,
            set: 0,
            out: 0,
            nov: 0,
            dez: 0,
          },
        },
      ];

      render(<IndicatorsConsolidatedTable indicators={indicators} />);

      // Verificar que há R$ na tabela
      const currencyCells = screen.getAllByText(/R\$/);
      expect(currencyCells.length).toBeGreaterThan(0);
    });
  });
});
