import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const ALIQUOTA_PIS_CUMULATIVO = 0.0065;
export const ALIQUOTA_COFINS_CUMULATIVA = 0.03;
export const ALIQUOTA_PIS_NAO_CUMULATIVO = 0.0165;
export const ALIQUOTA_COFINS_NAO_CUMULATIVA = 0.076;

export interface EntradaPisCofins {
  empresaId?: string;
  ano: number;
  mes: number;
  regimePisCofins: 'cumulativo' | 'nao_cumulativo';
  receitaBruta: number;
  exclusoesBase?: number;
  creditosPis?: number;
  creditosCofins?: number;
  usuarioCalculo?: string;
}

export interface ResultadoPisCofins {
  baseCalculo: number;
  aliquotaPis: number;
  pisBruto: number;
  creditosPis: number;
  pisARecolher: number;
  aliquotaCofins: number;
  cofinsBruta: number;
  creditosCofins: number;
  cofinsARecolher: number;
  totalARecolher: number;
  dataVencimento: Date;
}

export function calcularPisCofins(entrada: EntradaPisCofins): ResultadoPisCofins {
  const exclusoes = entrada.exclusoesBase ?? 0;
  const baseCalculo = Math.max(0, entrada.receitaBruta - exclusoes);

  const aliquotaPis = entrada.regimePisCofins === 'cumulativo'
    ? ALIQUOTA_PIS_CUMULATIVO
    : ALIQUOTA_PIS_NAO_CUMULATIVO;

  const aliquotaCofins = entrada.regimePisCofins === 'cumulativo'
    ? ALIQUOTA_COFINS_CUMULATIVA
    : ALIQUOTA_COFINS_NAO_CUMULATIVA;

  const pisBruto = baseCalculo * aliquotaPis;
  const cofinsBruta = baseCalculo * aliquotaCofins;
  const creditosPis = entrada.creditosPis ?? 0;
  const creditosCofins = entrada.creditosCofins ?? 0;
  const pisARecolher = Math.max(0, pisBruto - creditosPis);
  const cofinsARecolher = Math.max(0, cofinsBruta - creditosCofins);

  // Vencimento: dia 25 do mês seguinte
  const dataVencimento = calcularVencimento(entrada.ano, entrada.mes);

  return {
    baseCalculo,
    aliquotaPis,
    pisBruto,
    creditosPis,
    pisARecolher,
    aliquotaCofins,
    cofinsBruta,
    creditosCofins,
    cofinsARecolher,
    totalARecolher: pisARecolher + cofinsARecolher,
    dataVencimento,
  };
}

export function calcularVencimento(ano: number, mes: number): Date {
  // Dia 25 do mês seguinte; se fim de ano, janeiro do próximo ano
  let mesSeguinte = mes + 1;
  let anoVencimento = ano;
  if (mesSeguinte > 12) {
    mesSeguinte = 1;
    anoVencimento += 1;
  }
  const dt = new Date(anoVencimento, mesSeguinte - 1, 25);
  // Se cair no fim de semana, ajusta para sexta anterior
  const diaSemana = dt.getDay();
  if (diaSemana === 0) dt.setDate(dt.getDate() - 2); // domingo → sexta
  if (diaSemana === 6) dt.setDate(dt.getDate() - 1); // sábado → sexta
  return dt;
}

export async function salvarCalculo(entrada: EntradaPisCofins, resultado: ResultadoPisCofins) {
  return prisma.calculoPisCofins.create({
    data: {
      empresaId: entrada.empresaId,
      ano: entrada.ano,
      mes: entrada.mes,
      regimePisCofins: entrada.regimePisCofins,
      receitaBruta: entrada.receitaBruta,
      exclusoesBase: entrada.exclusoesBase ?? 0,
      baseCalculo: resultado.baseCalculo,
      aliquotaPis: resultado.aliquotaPis,
      pisBruto: resultado.pisBruto,
      creditosPis: resultado.creditosPis,
      pisARecolher: resultado.pisARecolher,
      aliquotaCofins: resultado.aliquotaCofins,
      cofinsBruta: resultado.cofinsBruta,
      creditosCofins: resultado.creditosCofins,
      cofinsARecolher: resultado.cofinsARecolher,
      usuarioCalculo: entrada.usuarioCalculo,
    },
  });
}

export async function listarCalculos(empresaId?: string, ano?: number) {
  const where: any = {};
  if (empresaId) where.empresaId = empresaId;
  if (ano) where.ano = ano;
  return prisma.calculoPisCofins.findMany({
    where,
    orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
    include: { empresa: { select: { razaoSocial: true, cnpj: true } } },
  });
}

export async function buscarCalculoPorId(id: string) {
  return prisma.calculoPisCofins.findUnique({
    where: { id },
    include: { empresa: true },
  });
}
