import { useEffect, useState } from 'react';
import api from '../utils/api';
import { brl } from '../utils/format';

interface EmpresaOpt { id: string; razaoSocial: string; nomeFantasia?: string; cnpj?: string }

interface TrimestralConsolidado {
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
  irpjAntecipacaoMes1?: number;
  irpjAntecipacaoMes2?: number;
  csllAntecipacaoMes1?: number;
  csllAntecipacaoMes2?: number;
  variacaoReceita?: number;
  variacaoReceitaPct?: number;
  variacaoIrpj?: number;
  variacaoIrpjPct?: number;
  variacaoCsll?: number;
  variacaoCsllPct?: number;
}

interface ResumoAnual {
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

const TRIMESTRES = ['', '1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
const MESES_TRI: Record<number, [string, string, string]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

const anoAtual = new Date().getFullYear();
const anos = Array.from({ length: 5 }, (_, i) => anoAtual - 1 + i);

/* ── Variação ────────────────────────────────────────────────────────────── */
function Variacao({ abs, pct }: { abs?: number; pct?: number }) {
  if (abs === undefined || pct === undefined) {
    return <span className="text-[10.5px] text-[#C8CED8]">—</span>;
  }
  const up = abs >= 0;
  const color = up ? 'text-[#B91C1C]' : 'text-[#1B7A4E]';
  const arrow = up ? '▲' : '▼';
  return (
    <span className={`text-[10.5px] font-semibold ${color}`}>
      {arrow} {brl(Math.abs(abs))} ({Math.abs(pct).toFixed(1)}%)
    </span>
  );
}

/* ── KPI mini ────────────────────────────────────────────────────────────── */
function KpiAnual({ label, value, sub, variant = 'default' }: {
  label: string; value: string; sub?: string;
  variant?: 'default' | 'primary' | 'danger' | 'success';
}) {
  const colors: Record<string, string> = {
    default: 'text-[#1A1F2E]', primary: 'text-[#0D47A1]',
    danger: 'text-[#B91C1C]', success: 'text-[#1B7A4E]',
  };
  return (
    <div className="card py-3 px-4">
      <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8A93A6]">{label}</p>
      <p className={`text-[18px] font-bold tabular-nums mt-1 leading-tight ${colors[variant]}`}
         style={{ letterSpacing: '-0.02em' }}>{value}</p>
      {sub && <p className="text-[11px] text-[#8A93A6] mt-0.5">{sub}</p>}
    </div>
  );
}

/* ── Linha de trimestre ──────────────────────────────────────────────────── */
function LinhaTrimestreDetalhe({ t }: { t: TrimestralConsolidado }) {
  const [aberto, setAberto] = useState(false);
  const meses = MESES_TRI[t.trimestre];
  const temDetMensal = t.irpjAntecipacaoMes1 !== undefined;

  return (
    <>
      <tr
        className="border-b border-[#EDF0F5] hover:bg-[#F7F9FC] cursor-pointer transition-colors"
        onClick={() => setAberto(v => !v)}
      >
        <td className="px-4 py-2.5">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] transition-transform ${aberto ? 'rotate-90' : ''}`}>▶</span>
            <span className="font-semibold text-[#1A1F2E]">{t.trimestre}T/{TRIMESTRES[t.trimestre]?.replace(' Trimestre', '')}</span>
            {t.temMajoracao && <span className="majoracao-badge text-[9px]">MAJ</span>}
            {t.modalidadeRecolhimento === 'mensal' && (
              <span className="badge-info text-[9px]">Mensal</span>
            )}
          </div>
        </td>
        <td className="px-4 py-2.5 text-right mono text-[12px]">{brl(t.receitaTotal)}</td>
        <td className="px-4 py-2.5 text-right mono text-[12px] text-[#0D47A1] font-semibold">{brl(t.irpjARecolher)}</td>
        <td className="px-4 py-2.5 text-right mono text-[12px] text-[#0D47A1] font-semibold">{brl(t.csllARecolher)}</td>
        <td className="px-4 py-2.5 text-right mono text-[12px]">
          {t.irpjMesesAnteriores > 0 || t.csllMesesAnteriores > 0
            ? brl(t.irpjMesesAnteriores + t.csllMesesAnteriores)
            : <span className="text-[#C8CED8]">—</span>}
        </td>
        <td className="px-4 py-2.5 text-right mono text-[12px] font-semibold text-[#0D47A1]">
          {brl(t.irpjResidual + t.csllResidual)}
        </td>
        <td className="px-4 py-2.5 text-right">
          <Variacao abs={t.variacaoIrpj} pct={t.variacaoIrpjPct} />
        </td>
      </tr>

      {/* Detalhe expandido */}
      {aberto && (
        <tr className="bg-[#F7F9FC]">
          <td colSpan={7} className="px-6 py-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

              {/* IRPJ */}
              <div className="rounded border border-[#D8DDE8] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#0A1628]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">IRPJ — DARF 2089</span>
                </div>
                <div className="px-3 py-2 space-y-1 text-[11.5px]">
                  <Row label="Base presumida" value={brl(t.basePresumidaIrpj)} />
                  <Row label="IRPJ (15%)" value={brl(t.irpjTotal - Math.max(0, t.basePresumidaIrpj - 60000) * 0.1)} />
                  <Row label="Adicional IR (10%)" value={brl(Math.max(0, t.basePresumidaIrpj - 60000) * 0.1)} muted />
                  <Row label="IRPJ apurado" value={brl(t.irpjARecolher)} bold />
                  {temDetMensal ? (
                    <>
                      <div className="border-t border-[#EDF0F5] pt-1 mt-1">
                        <Row label={`Antecipação ${meses[0]}`} value={`(${brl(t.irpjAntecipacaoMes1!)})`} red />
                        <Row label={`Antecipação ${meses[1]}`} value={`(${brl(t.irpjAntecipacaoMes2!)})`} red />
                        <Row label="Total antecipado" value={`(${brl(t.irpjMesesAnteriores)})`} red />
                      </div>
                    </>
                  ) : t.irpjMesesAnteriores > 0 ? (
                    <Row label="(−) Antecipações" value={`(${brl(t.irpjMesesAnteriores)})`} red />
                  ) : null}
                  <div className="border-t-2 border-[#D8DDE8] pt-1 mt-1">
                    <Row label={`Guia ${meses[2]}`} value={brl(t.irpjResidual)} blue bold />
                    {t.irpjSaldoPagoMaior > 0 && (
                      <Row label="Saldo pago a maior" value={brl(t.irpjSaldoPagoMaior)} green />
                    )}
                  </div>
                </div>
              </div>

              {/* CSLL */}
              <div className="rounded border border-[#D8DDE8] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#112240]">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-white/80">CSLL — DARF 2372</span>
                </div>
                <div className="px-3 py-2 space-y-1 text-[11.5px]">
                  <Row label="Base presumida" value={brl(t.basePresumidaCsll)} />
                  <Row label="CSLL (9%)" value={brl(t.csll9)} />
                  <Row label="CSLL apurada" value={brl(t.csllARecolher)} bold />
                  {temDetMensal ? (
                    <>
                      <div className="border-t border-[#EDF0F5] pt-1 mt-1">
                        <Row label={`Antecipação ${meses[0]}`} value={`(${brl(t.csllAntecipacaoMes1!)})`} red />
                        <Row label={`Antecipação ${meses[1]}`} value={`(${brl(t.csllAntecipacaoMes2!)})`} red />
                        <Row label="Total antecipado" value={`(${brl(t.csllMesesAnteriores)})`} red />
                      </div>
                    </>
                  ) : t.csllMesesAnteriores > 0 ? (
                    <Row label="(−) Antecipações" value={`(${brl(t.csllMesesAnteriores)})`} red />
                  ) : null}
                  <div className="border-t-2 border-[#D8DDE8] pt-1 mt-1">
                    <Row label={`Guia ${meses[2]}`} value={brl(t.csllResidual)} blue bold />
                    {t.csllSaldoPagoMaior > 0 && (
                      <Row label="Saldo pago a maior" value={brl(t.csllSaldoPagoMaior)} green />
                    )}
                  </div>
                </div>
              </div>

              {/* Comparativo */}
              {(t.variacaoReceita !== undefined) && (
                <div className="sm:col-span-2 rounded border border-[#EDF0F5] bg-white px-4 py-2.5">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-[#8A93A6] mb-2">
                    Comparativo vs. trimestre anterior
                  </p>
                  <div className="grid grid-cols-3 gap-4 text-[11.5px]">
                    <div>
                      <p className="text-[#8A93A6]">Receita</p>
                      <Variacao abs={t.variacaoReceita} pct={t.variacaoReceitaPct} />
                    </div>
                    <div>
                      <p className="text-[#8A93A6]">IRPJ</p>
                      <Variacao abs={t.variacaoIrpj} pct={t.variacaoIrpjPct} />
                    </div>
                    <div>
                      <p className="text-[#8A93A6]">CSLL</p>
                      <Variacao abs={t.variacaoCsll} pct={t.variacaoCsllPct} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function Row({ label, value, bold, muted, red, blue, green }: {
  label: string; value: string;
  bold?: boolean; muted?: boolean; red?: boolean; blue?: boolean; green?: boolean;
}) {
  const vc = red ? 'text-[#B91C1C]' : blue ? 'text-[#0D47A1]' : green ? 'text-[#1B7A4E]' : muted ? 'text-[#8A93A6]' : 'text-[#1A1F2E]';
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className={`min-w-0 ${muted ? 'text-[#8A93A6]' : 'text-[#4A5468]'}`}>{label}</span>
      <span className={`mono shrink-0 ${bold ? 'font-bold' : 'font-medium'} ${vc}`}>{value}</span>
    </div>
  );
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function RelatorioAnualPage() {
  const [empresas, setEmpresas] = useState<EmpresaOpt[]>([]);
  const [empresaId, setEmpresaId] = useState('');
  const [ano, setAno] = useState(anoAtual);
  const [dados, setDados] = useState<ResumoAnual | null>(null);
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  useEffect(() => {
    api.get('/empresas', { params: { limit: 5000 } })
      .then(r => setEmpresas(r.data.empresas ?? []));
  }, []);

  async function consultar() {
    setLoading(true);
    setErro('');
    setDados(null);
    try {
      const params: Record<string, string> = { ano: String(ano) };
      if (empresaId) params.empresaId = empresaId;
      const { data } = await api.get('/relatorio-anual', { params });
      if (data.totalCalculos === 0) {
        setErro(`Nenhum cálculo encontrado para ${empresaId ? 'esta empresa em ' : ''}${ano}.`);
      } else {
        setDados(data);
      }
    } catch {
      setErro('Erro ao consultar relatório. Verifique os filtros e tente novamente.');
    } finally {
      setLoading(false);
    }
  }

  const empresa = empresas.find(e => e.id === empresaId);

  return (
    <div className="p-6 max-w-[1400px]">

      {/* Header */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Relatório Anual</h1>
          <p className="page-subtitle">Consolidado de IRPJ / CSLL por empresa e ano — com comparativos trimestrais</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="card mb-5">
        <div className="card-header">
          <span className="card-title">Filtros</span>
        </div>
        <div className="flex flex-wrap gap-3 items-end">
          <div className="form-group flex-1 min-w-[220px]">
            <label className="label">Empresa</label>
            <select
              className="input"
              value={empresaId}
              onChange={e => setEmpresaId(e.target.value)}
            >
              <option value="">Todas as empresas</option>
              {empresas.map(e => (
                <option key={e.id} value={e.id}>
                  {e.razaoSocial}{e.cnpj ? ` — ${e.cnpj}` : ''}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group w-28">
            <label className="label">Ano</label>
            <select className="input" value={ano} onChange={e => setAno(Number(e.target.value))}>
              {anos.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
          <button
            className="btn-primary"
            onClick={consultar}
            disabled={loading}
          >
            {loading ? 'Consultando...' : 'Consultar'}
          </button>
          <button
            className="btn-secondary opacity-60 cursor-not-allowed"
            disabled
            title="Exportação anual em desenvolvimento"
          >
            📄 PDF Anual
          </button>
          <button
            className="btn-secondary opacity-60 cursor-not-allowed"
            disabled
            title="Exportação anual em desenvolvimento"
          >
            📊 Excel Anual
          </button>
        </div>
      </div>

      {/* Erro */}
      {erro && (
        <div className="alert-warning mb-4">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <span>{erro}</span>
        </div>
      )}

      {/* Resultado */}
      {dados && (
        <>
          {/* Identificação */}
          <div className="flex items-center gap-3 mb-4 px-1">
            <div className="h-8 w-1 rounded-full bg-[#0D47A1]" />
            <div>
              <p className="text-[14px] font-bold text-[#1A1F2E]">
                {empresa?.razaoSocial ?? 'Todas as empresas'} — {dados.ano}
              </p>
              {empresa?.cnpj && (
                <p className="text-[11px] text-[#8A93A6] font-mono">{empresa.cnpj}</p>
              )}
            </div>
          </div>

          {/* KPIs anuais */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
            <KpiAnual
              label="Receita total do ano"
              value={brl(dados.receitaTotalAno)}
              sub={`${dados.totalCalculos} trimestre${dados.totalCalculos !== 1 ? 's' : ''} apurado${dados.totalCalculos !== 1 ? 's' : ''}`}
              variant="primary"
            />
            <KpiAnual
              label="IRPJ total apurado"
              value={brl(dados.irpjTotalAno)}
              sub="Soma de todos os trimestres"
              variant="primary"
            />
            <KpiAnual
              label="CSLL total apurada"
              value={brl(dados.csllTotalAno)}
              sub="Soma de todos os trimestres"
              variant="primary"
            />
            <KpiAnual
              label="Trimestres com majoração"
              value={String(dados.trimestresComMajoracao)}
              sub="Receita > R$ 1.250.000"
              variant={dados.trimestresComMajoracao > 0 ? 'danger' : 'default'}
            />
          </div>

          {/* KPIs de antecipações (só se houver) */}
          {dados.totalAntecipacoes > 0 && (
            <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 mb-5">
              <KpiAnual
                label="Total de antecipações"
                value={brl(dados.totalAntecipacoes)}
                sub="IRPJ + CSLL antecipados"
              />
              <KpiAnual
                label="Total de guias residuais"
                value={brl(dados.totalGuiasResiduais)}
                sub="Guias do 3º mês"
                variant="primary"
              />
              {dados.totalSaldoPagoMaior > 0 && (
                <KpiAnual
                  label="Saldo pago a maior / crédito"
                  value={brl(dados.totalSaldoPagoMaior)}
                  sub="Antecipações > valor apurado"
                  variant="success"
                />
              )}
            </div>
          )}

          {/* Tabela por trimestre */}
          <div className="table-wrap">
            <div className="px-4 py-2.5 border-b border-[#E8ECF2] flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5468]">
                Detalhamento por Trimestre
              </span>
              <span className="text-[10.5px] text-[#8A93A6]">
                Clique em um trimestre para expandir o detalhamento
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="table-pro">
                <thead>
                  <tr>
                    <th>Trimestre</th>
                    <th className="text-right">Receita Total</th>
                    <th className="text-right">IRPJ Apurado</th>
                    <th className="text-right">CSLL Apurada</th>
                    <th className="text-right">Antecipações</th>
                    <th className="text-right">Guias Residuais</th>
                    <th className="text-right">Var. IRPJ</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.trimestres.map((t, i) => (
                    <LinhaTrimestreDetalhe key={i} t={t} />
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td className="font-bold text-[12px]">Total {dados.ano}</td>
                    <td className="text-right mono font-bold text-[12px]">{brl(dados.receitaTotalAno)}</td>
                    <td className="text-right mono font-bold text-[12px] text-[#0D47A1]">{brl(dados.irpjTotalAno)}</td>
                    <td className="text-right mono font-bold text-[12px] text-[#0D47A1]">{brl(dados.csllTotalAno)}</td>
                    <td className="text-right mono font-bold text-[12px]">{brl(dados.totalAntecipacoes)}</td>
                    <td className="text-right mono font-bold text-[12px] text-[#0D47A1]">{brl(dados.totalGuiasResiduais)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Nota */}
          <p className="text-[10.5px] text-[#8A93A6] mt-3 px-1">
            Variações em vermelho indicam aumento de imposto; em verde indicam redução. Comparativo calculado em relação ao trimestre imediatamente anterior dentro do mesmo ano.
            Exportação anual em desenvolvimento — disponível em próxima versão.
          </p>
        </>
      )}
    </div>
  );
}
