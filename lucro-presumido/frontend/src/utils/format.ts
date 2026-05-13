export function brl(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export function pct(value: number | string | null | undefined): string {
  const n = Number(value ?? 0);
  return (n * 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 4 }) + '%';
}

export const TRIMESTRES = ['', '1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];

export function trimestreLabel(t: number, ano: number) {
  return `${TRIMESTRES[t]} / ${ano}`;
}
