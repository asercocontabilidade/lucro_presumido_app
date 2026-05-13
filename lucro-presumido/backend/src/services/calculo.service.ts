/**
 * Serviço de cálculo do Lucro Presumido e IRPJ
 * Regras baseadas na planilha "Lucro presumido majoração.xlsx"
 *
 * Limite trimestral sem majoração: R$ 1.250.000,00
 * Adicional de IR: 10% sobre base que exceder R$ 20.000,00/mês (R$ 60.000,00/trimestre)
 */

export const LIMITE_SEM_MAJORACAO  = 1_250_000;
export const LIMITE_ADICIONAL_MENSAL    = 20_000; // por mês (antecipação)
export const LIMITE_ADICIONAL_TRIMESTRAL = 60_000; // por trimestre (fechamento)
/** @deprecated use LIMITE_ADICIONAL_TRIMESTRAL */
export const LIMITE_ADICIONAL_IR = 60_000;

export interface EntradaCalculo {
  receita16: number;   // presunção 1,6%
  receita8: number;    // presunção 8%
  receita16p: number;  // presunção 16%
  receita32: number;   // presunção 32%
  outrasReceitas: number;
  irrf?: number;
  csllRetida?: number;
  /** Soma dos IRPJ já recolhidos nos meses anteriores do trimestre (apuração mensal) */
  irpjMesesAnteriores?: number;
  /** Soma dos CSLL já recolhidos nos meses anteriores do trimestre (apuração mensal) */
  csllMesesAnteriores?: number;
}

export interface LinhaFaixa {
  descricao: string;
  aliquota: number;
  aliquotaAcrescimo: number; // aliquota * 1.10
  valor: number;
  proporcao: number;
  parcelaSemAcrescimo: number;
  parcelaComAcrescimo: number;
  baseCalculo: number; // sem acréscimo * aliquota + com acréscimo * aliquotaAcrescimo
}

export interface OpcaoCalculo {
  /** false para 1T/2026: MP 1.262/2024 — CSLL majorada vigente somente a partir do 2T/2026 */
  aplicarMajoracaoCsll?: boolean;
  /**
   * Quando false, não aplica a majoração de 10% no percentual de presunção do IRPJ.
   * Deve ser FALSE para cálculos de antecipação mensal (meses 1 e 2):
   * a majoração é regra trimestral — só se verifica no fechamento do trimestre.
   * Padrão: true.
   */
  aplicarMajoracaoIrpj?: boolean;
  /**
   * Limite para o adicional de IR de 10%.
   * - Cálculo MENSAL (antecipação mês 1 ou 2): usar 20_000
   * - Cálculo TRIMESTRAL (fechamento): usar 60_000 (padrão)
   */
  limiteAdicionalIr?: number;
}

export interface ResultadoCalculo {
  receita16: number; receita8: number; receita16p: number; receita32: number; outrasReceitas: number;
  receitaTotal: number; excedenteMajorado: number; houveExcedente: boolean;
  linhasIrpj: LinhaFaixa[]; basePresumidaIrpj: number;
  irpj15: number; adicionalIr10: number; irpjTotal: number; irrf: number; irpjARecolher: number;
  linhasCsll: LinhaFaixa[]; basePresumidaCsll: number;
  csll9: number; csllRetida: number; csllARecolher: number;
  csllMajoracaBloqueada: boolean;
  irpjMesesAnteriores: number;
  csllMesesAnteriores: number;
  irpjResidual: number;
  csllResidual: number;
  temPagamentosMensais: boolean;
  /** Saldo pago a maior de IRPJ (quando antecipações > valor apurado) */
  irpjSaldoPagoMaior: number;
  /** Saldo pago a maior de CSLL (quando antecipações > valor apurado) */
  csllSaldoPagoMaior: number;
}

function calcularFaixas(
  receitas: { descricao: string; aliquota: number; valor: number }[],
  receitaTotal: number,
  excedente: number
): LinhaFaixa[] {
  return receitas.map(({ descricao, aliquota, valor }) => {
    const proporcao = receitaTotal > 0 ? valor / receitaTotal : 0;
    const parcelaSemAcrescimo = excedente > 0
      ? proporcao * LIMITE_SEM_MAJORACAO
      : valor;
    const parcelaComAcrescimo = excedente > 0 ? proporcao * excedente : 0;
    const aliquotaAcrescimo = aliquota * 1.1;
    const baseCalculo =
      parcelaSemAcrescimo * aliquota + parcelaComAcrescimo * aliquotaAcrescimo;

    return {
      descricao,
      aliquota,
      aliquotaAcrescimo,
      valor,
      proporcao,
      parcelaSemAcrescimo,
      parcelaComAcrescimo,
      baseCalculo,
    };
  });
}

export function calcularLucroPresumido(entrada: EntradaCalculo, opcoes: OpcaoCalculo = {}): ResultadoCalculo {
  const { receita16, receita8, receita16p, receita32, outrasReceitas } = entrada;
  const irrf                = entrada.irrf                ?? 0;
  const csllRetida          = entrada.csllRetida          ?? 0;
  const irpjMesesAnteriores = entrada.irpjMesesAnteriores ?? 0;
  const csllMesesAnteriores = entrada.csllMesesAnteriores ?? 0;

  const aplicarMajoracaoCsll = opcoes.aplicarMajoracaoCsll ?? true;
  const aplicarMajoracaoIrpj = opcoes.aplicarMajoracaoIrpj ?? true;
  const limiteAdicional      = opcoes.limiteAdicionalIr ?? LIMITE_ADICIONAL_TRIMESTRAL;

  const receitaTotal = receita16 + receita8 + receita16p + receita32;
  const excedente = Math.max(0, receitaTotal - LIMITE_SEM_MAJORACAO);
  const houveExcedente = excedente > 0;

  // Excedente para IRPJ: zero quando cálculo mensal (majoração é regra trimestral)
  const excedenteIrpj = aplicarMajoracaoIrpj ? excedente : 0;

  const faixasIrpj = [
    { descricao: 'Receitas sujeitas à alíquota de 1,6%', aliquota: 0.016, valor: receita16 },
    { descricao: 'Receitas sujeitas à alíquota de 8%',   aliquota: 0.08,  valor: receita8 },
    { descricao: 'Receitas sujeitas à alíquota de 16%',  aliquota: 0.16,  valor: receita16p },
    { descricao: 'Receitas sujeitas à alíquota de 32%',  aliquota: 0.32,  valor: receita32 },
  ];

  const linhasIrpj = calcularFaixas(faixasIrpj, receitaTotal, excedenteIrpj);
  const basePresumidaIrpj = linhasIrpj.reduce((s, l) => s + l.baseCalculo, 0) + outrasReceitas;
  const irpj15        = basePresumidaIrpj * 0.15;
  const adicionalIr10 = Math.max(0, basePresumidaIrpj - limiteAdicional) * 0.10;
  const irpjTotal     = irpj15 + adicionalIr10;
  const irpjARecolher = Math.max(0, irpjTotal - irrf);

  const exedenteCsll       = aplicarMajoracaoCsll ? excedente : 0;
  const csllMajoracaBloqueada = houveExcedente && !aplicarMajoracaoCsll;

  const faixasCsll = [
    { descricao: 'Receitas sujeitas à alíquota de 12% (CSLL)', aliquota: 0.12, valor: receita16 + receita8 + receita16p },
    { descricao: 'Receitas sujeitas à alíquota de 32% (CSLL)', aliquota: 0.32, valor: receita32 },
  ];

  const linhasCsll = calcularFaixas(faixasCsll, receitaTotal, exedenteCsll);
  const basePresumidaCsll = linhasCsll.reduce((s, l) => s + l.baseCalculo, 0) + outrasReceitas;
  const csll9         = basePresumidaCsll * 0.09;
  const csllARecolher = Math.max(0, csll9 - csllRetida);

  const irpjResidual       = Math.max(0, irpjARecolher - irpjMesesAnteriores);
  const csllResidual       = Math.max(0, csllARecolher - csllMesesAnteriores);
  const temPagamentosMensais = irpjMesesAnteriores > 0 || csllMesesAnteriores > 0;
  // Saldo pago a maior: quando antecipações excedem o valor apurado
  const irpjSaldoPagoMaior = Math.max(0, irpjMesesAnteriores - irpjARecolher);
  const csllSaldoPagoMaior = Math.max(0, csllMesesAnteriores - csllARecolher);

  return {
    receita16, receita8, receita16p, receita32, outrasReceitas,
    receitaTotal,
    // excedenteMajorado reflete apenas o excedente efetivamente aplicado no IRPJ
    excedenteMajorado: excedenteIrpj,
    houveExcedente: excedenteIrpj > 0,
    linhasIrpj, basePresumidaIrpj, irpj15, adicionalIr10, irpjTotal, irrf, irpjARecolher,
    linhasCsll, basePresumidaCsll, csll9, csllRetida, csllARecolher, csllMajoracaBloqueada,
    irpjMesesAnteriores, csllMesesAnteriores, irpjResidual, csllResidual, temPagamentosMensais,
    irpjSaldoPagoMaior, csllSaldoPagoMaior,
  };
}
