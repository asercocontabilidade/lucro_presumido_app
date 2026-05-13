import { ResultadoCalculo, LinhaFaixa, LIMITE_SEM_MAJORACAO } from '../utils/calculo';
import { brl, pct } from '../utils/format';

interface Props { resultado: ResultadoCalculo }

const MESES_POR_TRIMESTRE: Record<number, [string, string, string]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

/** Tenta inferir o trimestre a partir do resultado (via modalidade ou fallback) */
function getMesesTrimestre(resultado: ResultadoCalculo): [string, string, string] | null {
  // O resultado não carrega trimestre diretamente; retorna null para usar fallback genérico
  return null;
}

/* ── Card de guia residual detalhado ────────────────────────────────────── */
function ResidualCard({
  titulo, bgHeader, apurado, antMes1, antMes2, totalAnt, residual, saldoPagoMaior, meses,
}: {
  titulo: string; bgHeader: string;
  apurado: number; antMes1?: number; antMes2?: number;
  totalAnt: number; residual: number; saldoPagoMaior: number;
  meses: [string, string, string] | null;
}) {
  const temDetalhamento = antMes1 !== undefined && antMes2 !== undefined;
  const mes1Label = meses?.[0] ?? 'Mês 1';
  const mes2Label = meses?.[1] ?? 'Mês 2';
  const mes3Label = meses?.[2] ?? 'Mês 3 (guia residual)';

  return (
    <div className="rounded border border-[#D8DDE8] overflow-hidden">
      <div className="px-3 py-1.5" style={{ background: bgHeader }}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">{titulo}</span>
      </div>
      <div className="px-3 py-2.5 space-y-1.5">
        {/* Valor apurado no trimestre */}
        <div className="flex justify-between items-baseline gap-2 text-[12px] text-[#4A5468]">
          <span className="min-w-0">Apurado no trimestre</span>
          <span className="mono font-semibold text-[#1A1F2E] shrink-0">{brl(apurado)}</span>
        </div>

        <div className="border-t border-[#F0F3F8] pt-1.5 space-y-1">
          {temDetalhamento ? (
            /* Detalhamento por mês */
            <>
              <div className="flex justify-between items-baseline gap-2 text-[11.5px] text-[#4A5468]">
                <span className="min-w-0 flex items-center gap-1">
                  <span className="text-[#B91C1C] font-bold">−</span>
                  <span>Antecipação {mes1Label}</span>
                </span>
                <span className="mono font-medium text-[#B91C1C] shrink-0">({brl(antMes1!)})</span>
              </div>
              <div className="flex justify-between items-baseline gap-2 text-[11.5px] text-[#4A5468]">
                <span className="min-w-0 flex items-center gap-1">
                  <span className="text-[#B91C1C] font-bold">−</span>
                  <span>Antecipação {mes2Label}</span>
                </span>
                <span className="mono font-medium text-[#B91C1C] shrink-0">({brl(antMes2!)})</span>
              </div>
              <div className="flex justify-between items-baseline gap-2 text-[11px] text-[#8A93A6] border-t border-dashed border-[#E8ECF2] pt-1">
                <span>Total antecipado</span>
                <span className="mono font-semibold text-[#B91C1C]">({brl(totalAnt)})</span>
              </div>
            </>
          ) : totalAnt > 0 ? (
            /* Consolidado — registros antigos */
            <div className="flex justify-between items-baseline gap-2 text-[11.5px] text-[#4A5468]">
              <span className="min-w-0">(−) Pagamentos/antecipações anteriores</span>
              <span className="mono font-medium text-[#B91C1C] shrink-0">({brl(totalAnt)})</span>
            </div>
          ) : null}
        </div>

        {/* Guia residual do 3º mês */}
        <div className="border-t-2 border-[#D8DDE8] pt-1.5 flex justify-between items-baseline gap-2 font-bold text-[#0D47A1]">
          <span className="text-[12px]">Guia {mes3Label}</span>
          <span className="mono text-[14px] shrink-0">{brl(residual)}</span>
        </div>

        {/* Saldo pago a maior */}
        {saldoPagoMaior > 0 && (
          <div className="flex justify-between items-baseline gap-2 text-[12px] font-semibold text-[#1B7A4E] bg-[#E6F4ED] -mx-3 px-3 py-1.5 mt-0.5">
            <span className="min-w-0">Saldo pago a maior / crédito</span>
            <span className="mono shrink-0">{brl(saldoPagoMaior)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cabeçalho das tabelas ────────────────────────────────────────────────────
function TblHead() {
  return (
    <thead>
      <tr style={{ background: '#0A1628' }}>
        <th className="px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[140px]">
          Discriminação
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[100px]">
          Valor (R$)
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[64px]">
          Prop.
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[100px]">
          Parc. s/ Acrés.
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[60px]">
          % Aplic.
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[100px]">
          Parc. c/ Acrés.
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[60px]">
          % Acrés.
        </th>
        <th className="px-2.5 py-2 text-right text-[10px] font-semibold uppercase tracking-wider text-white/85 min-w-[100px]">
          Base Cálculo
        </th>
      </tr>
    </thead>
  );
}

// ── Linha de receita ─────────────────────────────────────────────────────────
function Linha({ linha, idx, houveExcedente }: { linha: LinhaFaixa; idx: number; houveExcedente: boolean }) {
  const temExcedente = houveExcedente && linha.parcelaComAcrescimo > 0;
  return (
    <tr className={idx % 2 === 1 ? 'bg-[#F7F9FC]' : 'bg-white'}>
      <td className="px-2.5 py-2 text-[11.5px] text-[#1A1F2E] leading-tight">{linha.descricao}</td>
      <td className="px-2.5 py-2 text-right mono text-[11.5px] text-[#1A1F2E] whitespace-nowrap">{brl(linha.valor)}</td>
      <td className="px-2.5 py-2 text-right text-[11px] text-[#8A93A6] whitespace-nowrap">{pct(linha.proporcao)}</td>
      <td className="px-2.5 py-2 text-right mono text-[11.5px] text-[#1A1F2E] whitespace-nowrap">{brl(linha.parcelaSemAcrescimo)}</td>
      <td className="px-2.5 py-2 text-right text-[11px] text-[#8A93A6] whitespace-nowrap">{pct(linha.aliquota)}</td>
      <td className={`px-2.5 py-2 text-right mono text-[11.5px] whitespace-nowrap ${temExcedente ? 'text-[#B91C1C] font-semibold' : 'text-[#C0C8D8]'}`}>
        {brl(linha.parcelaComAcrescimo)}
        {temExcedente && <span className="ml-0.5 text-[9px]">⚠</span>}
      </td>
      <td className={`px-2.5 py-2 text-right text-[11px] whitespace-nowrap ${temExcedente ? 'text-[#B91C1C] font-semibold' : 'text-[#C0C8D8]'}`}>
        {pct(linha.aliquotaAcrescimo)}
      </td>
      <td className="px-2.5 py-2 text-right mono text-[11.5px] font-bold text-[#0D47A1] whitespace-nowrap">{brl(linha.baseCalculo)}</td>
    </tr>
  );
}

// ── Linha de total ───────────────────────────────────────────────────────────
function TotalRow({ resultado, tipo }: { resultado: ResultadoCalculo; tipo: 'irpj' | 'csll' }) {
  const isCsll = tipo === 'csll';
  const houveExcedente = resultado.houveExcedente;
  const csllBloqueada = resultado.csllMajoracaBloqueada;
  const excedente = isCsll && csllBloqueada ? 0 : resultado.excedenteMajorado;
  const base = isCsll ? resultado.basePresumidaCsll : resultado.basePresumidaIrpj;
  const parcelaSem = isCsll
    ? (csllBloqueada ? resultado.receitaTotal : (houveExcedente ? LIMITE_SEM_MAJORACAO : resultado.receitaTotal))
    : (houveExcedente ? LIMITE_SEM_MAJORACAO : resultado.receitaTotal);
  const showExcedente = isCsll ? (houveExcedente && !csllBloqueada) : houveExcedente;

  return (
    <tr className="border-t-2 border-[#D8DDE8] bg-[#EEF2F8] font-semibold text-[11.5px]">
      <td className="px-2.5 py-2 text-[#1A1F2E] leading-tight">Total da Receita Bruta</td>
      <td className="px-2.5 py-2 text-right mono text-[#1A1F2E] whitespace-nowrap">{brl(resultado.receitaTotal)}</td>
      <td className="px-2.5 py-2 text-right text-[11px] text-[#8A93A6]">100%</td>
      <td className="px-2.5 py-2 text-right mono text-[#1A1F2E] whitespace-nowrap">{brl(parcelaSem)}</td>
      <td />
      <td className={`px-2.5 py-2 text-right mono whitespace-nowrap ${showExcedente ? 'text-[#B91C1C]' : 'text-[#C0C8D8]'}`}>
        {brl(excedente)}
      </td>
      <td />
      <td className="px-2.5 py-2 text-right mono font-bold text-[#0D47A1] whitespace-nowrap">{brl(base)}</td>
    </tr>
  );
}

// ── Card de resultado ────────────────────────────────────────────────────────
function CardResultado({ titulo, darf, linhas, dark }: {
  titulo: string; darf: string;
  linhas: { label: string; value: string; bold?: boolean; muted?: boolean; total?: boolean; highlight?: boolean; highlightColor?: string }[];
  dark?: boolean;
}) {
  const bg = dark ? '#112240' : '#0A1628';
  return (
    <div className="rounded overflow-hidden border border-[#1E3A5F]" style={{ background: bg }}>
      <div className="px-4 py-2" style={{ background: '#0D47A1' }}>
        <span className="text-[10px] font-bold uppercase tracking-widest text-white leading-tight block">{titulo}</span>
      </div>
      <div className="px-4 py-3 space-y-1.5">
        {linhas.map((l, i) => {
          const valueClass = l.total
            ? 'font-bold text-[14px] text-[#7DD3FC]'
            : l.bold ? 'font-semibold text-white'
            : l.muted ? 'text-white/40'
            : l.highlight ? (l.highlightColor ?? 'text-amber-300')
            : 'text-white/85';
          const labelClass = l.total ? 'font-bold text-white' : l.muted ? 'text-white/40' : 'text-white/65';

          return (
            <div key={i}>
              {(l.total || l.bold) && i > 0 && <div className="border-t border-white/10 my-1.5" />}
              <div className="flex justify-between items-baseline gap-2 min-w-0">
                <span className={`text-[11.5px] leading-tight min-w-0 ${labelClass}`}>{l.label}</span>
                <span className={`mono shrink-0 text-right ${valueClass}`}>{l.value}</span>
              </div>
            </div>
          );
        })}
      </div>
      <div className="px-4 pb-2.5">
        <span className="text-[10px] text-white/25">{darf}</span>
      </div>
    </div>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function TabelaCalculo({ resultado }: Props) {
  const { linhasIrpj, linhasCsll, houveExcedente } = resultado;

  return (
    <div className="space-y-5">

      {/* Alertas */}
      {houveExcedente && (
        <div className="alert-danger">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-[12px] leading-snug">
            <strong>Majoração aplicada no IRPJ.</strong> Receita de {brl(resultado.receitaTotal)} ultrapassou {brl(LIMITE_SEM_MAJORACAO)}.
            Excedente de <strong>{brl(resultado.excedenteMajorado)}</strong> sujeito ao percentual com acréscimo de 10%.
            {resultado.csllMajoracaBloqueada && (
              <> <strong>CSLL: majoração não exigível no 1T/2026</strong> (MP 1.262/2024).</>
            )}
          </span>
        </div>
      )}

      {/* Aviso: majoração é regra trimestral — antecipações mensais não a incluem */}
      {houveExcedente && resultado.temPagamentosMensais && (
        <div className="rounded bg-[#FEF3C7] border border-[#FCD34D] px-3 py-2.5 flex gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="shrink-0 mt-0.5">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span className="text-[12px] text-[#92400E] leading-snug">
            <strong>Atenção — Majoração é regra trimestral:</strong> as antecipações pagas nos meses 1 e 2 foram calculadas sobre a receita de cada mês isolado, <strong>sem aplicar a majoração</strong>. O acréscimo de 10% no percentual de presunção só é verificado e aplicado no fechamento do trimestre (3º mês), quando a receita acumulada ultrapassa R$ 1.250.000. O valor da guia residual abaixo já considera essa diferença.
          </span>
        </div>
      )}

      {resultado.csllMajoracaBloqueada && (
        <div className="alert-info">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <span className="text-[12px] leading-snug">
            <strong>CSLL sem majoração (1T/2026).</strong> Alíquota de acréscimo de 10% inaplicável — MP 1.262/2024 · IN RFB 2.228/2024.
          </span>
        </div>
      )}

      {/* Tabela IRPJ */}
      <div>
        <p className="section-label mb-2">Cálculo do Lucro Presumido — IRPJ</p>
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="border-collapse" style={{ minWidth: 680, width: '100%' }}>
              <TblHead />
              <tbody>
                {linhasIrpj.map((l, i) => (
                  <Linha key={i} linha={l} idx={i} houveExcedente={houveExcedente} />
                ))}
                <TotalRow resultado={resultado} tipo="irpj" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cards IRPJ + CSLL */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 print-page-break">
        <CardResultado
          titulo="IRPJ — Resumo"
          darf="DARF 2089"
          linhas={[
            { label: 'Base de Cálculo',                    value: brl(resultado.basePresumidaIrpj) },
            { label: 'IRPJ (15%)',                         value: brl(resultado.irpj15) },
            { label: `Adicional IR (10%) — acima de R$ 20.000/mês (R$ 60.000 no trimestre)`,
                                                           value: brl(resultado.adicionalIr10),
                                                           highlight: resultado.adicionalIr10 > 0, highlightColor: 'text-amber-300' },
            { label: 'IRPJ + Adicional',                   value: brl(resultado.irpjTotal), bold: true },
            { label: '(−) IRRF',                           value: `(${brl(resultado.irrf)})`, muted: true },
            { label: 'IRPJ a Recolher',                    value: brl(resultado.irpjARecolher), total: true },
          ]}
        />
        <CardResultado
          titulo={resultado.csllMajoracaBloqueada ? 'CSLL — Resumo · Sem majoração (1T/2026)' : 'CSLL — Resumo'}
          darf="DARF 2372"
          dark
          linhas={[
            { label: 'Base de Cálculo',                    value: brl(resultado.basePresumidaCsll) },
            { label: 'CSLL (9%)',                          value: brl(resultado.csll9) },
            { label: '(−) CSLL Retida na Fonte',           value: `(${brl(resultado.csllRetida)})`, muted: true },
            { label: 'CSLL a Recolher',                    value: brl(resultado.csllARecolher), total: true },
          ]}
        />
      </div>

      {/* Tabela CSLL */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <p className="section-label">Cálculo do Resultado Presumido — CSLL</p>
          {resultado.csllMajoracaBloqueada && (
            <span className="text-[10.5px] font-semibold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
              Majoração não aplicada — 1T/2026
            </span>
          )}
        </div>
        <div className="table-wrap">
          <div className="overflow-x-auto">
            <table className="border-collapse" style={{ minWidth: 680, width: '100%' }}>
              <TblHead />
              <tbody>
                {linhasCsll.map((l, i) => (
                  <Linha key={i} linha={l} idx={i} houveExcedente={houveExcedente && !resultado.csllMajoracaBloqueada} />
                ))}
                <TotalRow resultado={resultado} tipo="csll" />
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Residual da guia */}
      {resultado.temPagamentosMensais && (
        <div className="rounded overflow-hidden border-2 border-[#0D47A1]">
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: '#0D47A1' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="shrink-0">
              <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span className="text-[11px] font-bold uppercase tracking-widest text-white">
              Apuração Mensal — Antecipações e Guia Residual do 3º Mês
            </span>
          </div>

          <div className="bg-white px-4 py-3">
            <p className="text-[11.5px] text-[#4A5468] mb-3 leading-relaxed">
              A base de cálculo e a majoração são apuradas sobre o <strong>trimestre completo</strong>.
              As antecipações dos meses 1 e 2 foram calculadas <strong>sem majoração</strong> (receita do mês isolado).
              A majoração só é verificada no fechamento do trimestre — a diferença é ajustada na guia do 3º mês.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* IRPJ */}
              <ResidualCard
                titulo="IRPJ — DARF 2089"
                bgHeader="#0A1628"
                apurado={resultado.irpjARecolher}
                antMes1={resultado.irpjAntecipacaoMes1}
                antMes2={resultado.irpjAntecipacaoMes2}
                totalAnt={resultado.irpjMesesAnteriores}
                residual={resultado.irpjResidual}
                saldoPagoMaior={resultado.irpjSaldoPagoMaior}
                meses={getMesesTrimestre(resultado)}
              />

              {/* CSLL */}
              <ResidualCard
                titulo="CSLL — DARF 2372"
                bgHeader="#112240"
                apurado={resultado.csllARecolher}
                antMes1={resultado.csllAntecipacaoMes1}
                antMes2={resultado.csllAntecipacaoMes2}
                totalAnt={resultado.csllMesesAnteriores}
                residual={resultado.csllResidual}
                saldoPagoMaior={resultado.csllSaldoPagoMaior}
                meses={getMesesTrimestre(resultado)}
              />
            </div>

            <p className="text-[10.5px] text-[#8A93A6] mt-2.5 leading-relaxed">
              Base legal: art. 5º da Lei nº 9.430/1996 — o imposto apurado trimestralmente pode ser recolhido em quota única ou em três parcelas mensais.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
