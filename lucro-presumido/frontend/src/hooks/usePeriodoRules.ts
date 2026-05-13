/**
 * Regras de vigência por período de apuração.
 *
 * MP 1.262/2024 — implementação faseada:
 *   - IRPJ majorado: a partir de 1T/2026
 *   - CSLL majorada: a partir de 2T/2026 (1T/2026 NÃO sujeito)
 */

export interface PeriodoRules {
  permiteIrpjMajorado: boolean;
  permiteCsllMajorada: boolean;
  mensagemBloqueio: string | null;
  periodoLabel: string;
}

const MESES_TRIMESTRE: Record<number, string> = {
  1: 'Jan–Mar', 2: 'Abr–Jun', 3: 'Jul–Set', 4: 'Out–Dez',
};

export function usePeriodoRules(
  ano: number,
  trimestre: number,
  sujeitoMajoracao: boolean
): PeriodoRules {
  const permiteIrpjMajorado = sujeitoMajoracao;

  // CSLL majorada: bloqueada no 1T/2026 (MP 1.262/2024)
  const bloqueoCsll1T2026 = ano === 2026 && trimestre === 1;
  const permiteCsllMajorada = sujeitoMajoracao && !bloqueoCsll1T2026;

  const mensagemBloqueio = bloqueoCsll1T2026 && sujeitoMajoracao
    ? 'CSLL majorada não vigente no 1T/2026 — MP 1.262/2024 (implementação faseada)'
    : null;

  const trimLabel = `${trimestre}º Trimestre / ${ano}`;
  const mesesLabel = MESES_TRIMESTRE[trimestre] ?? '';
  const periodoLabel = mesesLabel ? `${trimLabel} (${mesesLabel})` : trimLabel;

  return { permiteIrpjMajorado, permiteCsllMajorada, mensagemBloqueio, periodoLabel };
}
