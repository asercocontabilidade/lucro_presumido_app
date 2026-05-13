/**
 * Serviço de Relatório Anual — Lucro Presumido IRPJ/CSLL
 *
 * Consolida todos os cálculos de uma empresa em um determinado ano,
 * gerando resumo anual, detalhamento por trimestre, comparativos e
 * (quando disponível) detalhamento mensal de antecipações.
 *
 * PRÓXIMOS PASSOS para implementação completa:
 * - Adicionar endpoint GET /relatorio-anual?empresaId=X&ano=Y
 * - Adicionar geração de PDF anual (pdf.service.ts → gerarPdfAnual)
 * - Adicionar geração de Excel anual (excel.service.ts → gerarExcelAnual)
 * - Adicionar página no frontend: RelatorioAnualPage.tsx
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface TrimestralConsolidado {
  trimestre: number;
  receitaTotal: number;
  excedenteMajorado: number;
  basePresumidaIrpj: number;
  irpjTotal: number;
  irpjARecolher: number;
  basePresumidaCsll: number;
  csll9: number;
  csllARecolher: number;
  irpjMesesAnteriores: number;
  csllMesesAnteriores: number;
  irpjResidual: number;
  csllResidual: number;
  irpjSaldoPagoMaior: number;
  csllSaldoPagoMaior: number;
  temMajoracao: boolean;
  modalidadeRecolhimento: string;
  // Antecipações mensais detalhadas (quando disponível)
  irpjAntecipacaoMes1?: number;
  irpjAntecipacaoMes2?: number;
  csllAntecipacaoMes1?: number;
  csllAntecipacaoMes2?: number;
  // Comparativo com trimestre anterior
  variacaoReceita?: number;
  variacaoReceitaPct?: number;
  variacaoIrpj?: number;
  variacaoIrpjPct?: number;
  variacaoCsll?: number;
  variacaoCsllPct?: number;
}

export interface ResumoAnual {
  empresaId: string | null;
  ano: number;
  totalCalculos: number;
  receitaTotalAno: number;
  irpjTotalAno: number;
  csllTotalAno: number;
  totalAntecipacoes: number;
  totalGuiasResiduais: number;
  totalSaldoPagoMaior: number;
  trimestresComMajoracao: number;
  trimestres: TrimestralConsolidado[];
}

function n(v: unknown): number { return Number(v ?? 0); }

function calcVariacao(atual: number, anterior: number): { abs: number; pct: number } | undefined {
  if (anterior === 0) return undefined;
  const abs = atual - anterior;
  const pct = (abs / anterior) * 100;
  return { abs, pct };
}

export async function consolidarAnual(empresaId: string | null, ano: number): Promise<ResumoAnual> {
  const where: { ano: number; empresaId?: string | null } = { ano };
  if (empresaId !== undefined) where.empresaId = empresaId;

  const calculos = await prisma.calculoTrimestral.findMany({
    where,
    orderBy: { trimestre: 'asc' },
  });

  const trimestres: TrimestralConsolidado[] = calculos.map((c, idx) => {
    const d = c.detalheCalculo ? JSON.parse(c.detalheCalculo) : {};
    const irpjMesesAnt = n(d.irpjMesesAnteriores ?? 0);
    const csllMesesAnt = n(d.csllMesesAnteriores ?? 0);
    const irpjResidual = Math.max(0, n(c.irpjARecolher) - irpjMesesAnt);
    const csllResidual = Math.max(0, n(c.csllARecolher) - csllMesesAnt);
    const irpjSaldoPagoMaior = Math.max(0, irpjMesesAnt - n(c.irpjARecolher));
    const csllSaldoPagoMaior = Math.max(0, csllMesesAnt - n(c.csllARecolher));

    const t: TrimestralConsolidado = {
      trimestre: c.trimestre,
      receitaTotal: n(c.receitaTotal),
      excedenteMajorado: n(c.excedenteMajorado),
      basePresumidaIrpj: n(c.basePresumidaIrpj),
      irpjTotal: n(c.irpjTotal),
      irpjARecolher: n(c.irpjARecolher),
      basePresumidaCsll: n(c.basePresumidaCsll),
      csll9: n(c.csll9),
      csllARecolher: n(c.csllARecolher),
      irpjMesesAnteriores: irpjMesesAnt,
      csllMesesAnteriores: csllMesesAnt,
      irpjResidual,
      csllResidual,
      irpjSaldoPagoMaior,
      csllSaldoPagoMaior,
      temMajoracao: n(c.excedenteMajorado) > 0,
      modalidadeRecolhimento: String(d.modalidadeRecolhimento ?? 'trimestral'),
      irpjAntecipacaoMes1: d.irpjAntecipacaoMes1 !== undefined ? n(d.irpjAntecipacaoMes1) : undefined,
      irpjAntecipacaoMes2: d.irpjAntecipacaoMes2 !== undefined ? n(d.irpjAntecipacaoMes2) : undefined,
      csllAntecipacaoMes1: d.csllAntecipacaoMes1 !== undefined ? n(d.csllAntecipacaoMes1) : undefined,
      csllAntecipacaoMes2: d.csllAntecipacaoMes2 !== undefined ? n(d.csllAntecipacaoMes2) : undefined,
    };

    // Comparativo com trimestre anterior (dentro do mesmo ano)
    if (idx > 0) {
      const ant = trimestres[idx - 1];
      const vRec = calcVariacao(t.receitaTotal, ant.receitaTotal);
      const vIrpj = calcVariacao(t.irpjARecolher, ant.irpjARecolher);
      const vCsll = calcVariacao(t.csllARecolher, ant.csllARecolher);
      if (vRec)  { t.variacaoReceita = vRec.abs;  t.variacaoReceitaPct = vRec.pct; }
      if (vIrpj) { t.variacaoIrpj = vIrpj.abs;   t.variacaoIrpjPct = vIrpj.pct; }
      if (vCsll) { t.variacaoCsll = vCsll.abs;   t.variacaoCsllPct = vCsll.pct; }
    }

    return t;
  });

  const resumo: ResumoAnual = {
    empresaId: empresaId ?? null,
    ano,
    totalCalculos: calculos.length,
    receitaTotalAno: trimestres.reduce((s, t) => s + t.receitaTotal, 0),
    irpjTotalAno: trimestres.reduce((s, t) => s + t.irpjARecolher, 0),
    csllTotalAno: trimestres.reduce((s, t) => s + t.csllARecolher, 0),
    totalAntecipacoes: trimestres.reduce((s, t) => s + t.irpjMesesAnteriores + t.csllMesesAnteriores, 0),
    totalGuiasResiduais: trimestres.reduce((s, t) => s + t.irpjResidual + t.csllResidual, 0),
    totalSaldoPagoMaior: trimestres.reduce((s, t) => s + t.irpjSaldoPagoMaior + t.csllSaldoPagoMaior, 0),
    trimestresComMajoracao: trimestres.filter(t => t.temMajoracao).length,
    trimestres,
  };

  return resumo;
}
