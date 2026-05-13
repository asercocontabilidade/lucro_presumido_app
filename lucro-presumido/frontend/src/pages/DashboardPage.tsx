import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import api from '../utils/api';
import { brl, TRIMESTRES } from '../utils/format';

interface DashData {
  totalCalculos: number;
  receitaTotalAnalisada: number;
  totalIrpj: number;
  trimestresComMajoracao: number;
  porTrimestre: {
    ano: number; trimestre: number;
    receitaTotal: string; irpjTotal: string; excedenteMajorado: string;
    basePresumidaIrpj?: string; basePresumidaCsll?: string;
  }[];
}

/* ── KPI Card ────────────────────────────────────────────────────────────── */
function KpiCard({
  label, value, sub, icon, variant = 'default',
}: {
  label: string; value: string; sub?: string; icon?: React.ReactNode;
  variant?: 'default' | 'primary' | 'warning' | 'danger';
}) {
  const valueColors: Record<string, string> = {
    default: 'text-[#1A1F2E]',
    primary: 'text-[#0D47A1]',
    warning: 'text-[#B45309]',
    danger:  'text-[#B91C1C]',
  };
  const borderColors: Record<string, string> = {
    default: 'border-[#D8DDE8]',
    primary: 'border-[#BFCFE8]',
    warning: 'border-[#FDE68A]',
    danger:  'border-[#FECACA]',
  };
  const bgColors: Record<string, string> = {
    default: 'bg-white',
    primary: 'bg-white',
    warning: 'bg-[#FFFBEB]',
    danger:  'bg-[#FFF5F5]',
  };

  return (
    <div className={`${bgColors[variant]} border ${borderColors[variant]} rounded-[5px] p-4 flex flex-col gap-1 min-w-0`}>
      <div className="flex items-center justify-between gap-2">
        <p className="text-[10.5px] font-semibold uppercase tracking-wider text-[#8A93A6] leading-tight">{label}</p>
        {icon && <span className="text-[#C8CED8] shrink-0">{icon}</span>}
      </div>
      <p className={`text-[18px] font-bold tabular-nums leading-tight break-all ${valueColors[variant]}`}
         style={{ letterSpacing: '-0.02em' }}>
        {value}
      </p>
      {sub && <p className="text-[11px] text-[#8A93A6] leading-tight">{sub}</p>}
    </div>
  );
}

/* ── Tooltip customizado ─────────────────────────────────────────────────── */
function CustomTooltip({ active, payload, label }: {
  active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#D8DDE8] rounded-[4px] shadow-lg p-3 min-w-[180px]">
      <p className="text-[11px] font-bold text-[#1A1F2E] mb-2 pb-1.5 border-b border-[#EDF0F5]">{label}</p>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-[11px] py-0.5">
          <span className="flex items-center gap-1.5 text-[#4A5468]">
            <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: p.color }} />
            {p.name}
          </span>
          <span className="font-semibold tabular-nums text-[#1A1F2E]">{brl(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

/* ── Tabela de trimestres ────────────────────────────────────────────────── */
function TabelaTrimestres({ dados }: { dados: DashData['porTrimestre'] }) {
  if (!dados.length) return null;
  return (
    <div className="table-wrap mt-5">
      <div className="px-4 py-2.5 border-b border-[#E8ECF2] flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#4A5468]">
          Detalhamento por Trimestre
        </span>
        <span className="text-[10.5px] text-[#8A93A6]">{dados.length} período{dados.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="table-pro" style={{ minWidth: 560 }}>
          <thead>
            <tr>
              <th>Período</th>
              <th className="text-right">Receita Total</th>
              <th className="text-right">Base IRPJ</th>
              <th className="text-right">IRPJ Apurado</th>
              <th className="text-center">Majoração</th>
            </tr>
          </thead>
          <tbody>
            {[...dados].reverse().map((c, i) => {
              const temMaj = Number(c.excedenteMajorado) > 0;
              return (
                <tr key={i}>
                  <td>
                    <span className="font-semibold text-[#1A1F2E]">
                      {c.trimestre}T/{c.ano}
                    </span>
                    <span className="text-[11px] text-[#8A93A6] ml-1.5">
                      {TRIMESTRES[c.trimestre]}
                    </span>
                  </td>
                  <td className="text-right mono text-[12.5px]">{brl(c.receitaTotal)}</td>
                  <td className="text-right mono text-[12.5px] text-[#4A5468]">
                    {c.basePresumidaIrpj ? brl(c.basePresumidaIrpj) : '—'}
                  </td>
                  <td className="text-right mono text-[12.5px] font-semibold text-[#0D47A1]">
                    {brl(c.irpjTotal)}
                  </td>
                  <td className="text-center">
                    {temMaj
                      ? <span className="majoracao-badge">⚠ {brl(c.excedenteMajorado)}</span>
                      : <span className="text-[#D8DDE8] text-[11px]">—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="font-bold text-[12px]">Total</td>
              <td className="text-right mono font-bold text-[12.5px]">
                {brl(dados.reduce((s, c) => s + Number(c.receitaTotal), 0))}
              </td>
              <td />
              <td className="text-right mono font-bold text-[12.5px] text-[#0D47A1]">
                {brl(dados.reduce((s, c) => s + Number(c.irpjTotal), 0))}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

/* ── Ícones KPI ──────────────────────────────────────────────────────────── */
function IcCalc() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="6" x2="16" y2="6"/></svg>;
}
function IcMoney() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v2m0 8v2M9.5 9.5a2.5 2.5 0 0 1 5 0c0 1.5-2.5 2-2.5 3.5m0 1h.01"/></svg>;
}
function IcAlert() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>;
}
function IcTax() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>;
}

/* ── Página principal ────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/calculos/dashboard')
      .then(r => setData(r.data))
      .finally(() => setLoading(false));
  }, []);

  const chartData = data?.porTrimestre.map(c => ({
    name: `${c.trimestre}T/${c.ano}`,
    'Receita': Number(c.receitaTotal),
    'IRPJ':    Number(c.irpjTotal),
    'Excedente': Number(c.excedenteMajorado) > 0 ? Number(c.excedenteMajorado) : 0,
  })) ?? [];

  const temMajoracao = (data?.trimestresComMajoracao ?? 0) > 0;

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <div className="text-[#8A93A6] text-[13px]">Carregando dashboard...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1400px]">

      {/* ── Header ──────────────────────────────────────────────────── */}
      <div className="page-header mb-5">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Visão consolidada das apurações de IRPJ / CSLL</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/calculos/novo')}>
          + Novo Cálculo
        </button>
      </div>

      {/* ── KPIs ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <KpiCard
          label="Cálculos realizados"
          value={String(data?.totalCalculos ?? 0)}
          sub={data?.totalCalculos === 1 ? '1 apuração registrada' : `${data?.totalCalculos ?? 0} apurações registradas`}
          icon={<IcCalc />}
        />
        <KpiCard
          label="Receita total analisada"
          value={brl(data?.receitaTotalAnalisada ?? 0)}
          sub="Soma de todas as receitas brutas"
          icon={<IcMoney />}
          variant="primary"
        />
        <KpiCard
          label="Trimestres com majoração"
          value={String(data?.trimestresComMajoracao ?? 0)}
          sub="Receita trimestral > R$ 1.250.000"
          icon={<IcAlert />}
          variant={temMajoracao ? 'danger' : 'default'}
        />
        <KpiCard
          label="Total de IRPJ apurado"
          value={brl(data?.totalIrpj ?? 0)}
          sub="Soma de todos os períodos"
          icon={<IcTax />}
          variant="primary"
        />
      </div>

      {/* ── Sem dados ───────────────────────────────────────────────── */}
      {chartData.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-[#8A93A6]">
          <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-4 opacity-20">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          <p className="text-[15px] font-semibold text-[#4A5468] mb-1">Nenhum cálculo registrado</p>
          <p className="text-[13px]">Crie o primeiro cálculo para visualizar o dashboard</p>
          <button className="btn-primary mt-5" onClick={() => navigate('/calculos/novo')}>
            Criar primeiro cálculo
          </button>
        </div>
      ) : (
        <>
          {/* ── Gráfico ─────────────────────────────────────────────── */}
          <div className="card mb-0">
            <div className="card-header">
              <div>
                <span className="card-title">Receita e Tributação por Trimestre</span>
                <p className="text-[11px] text-[#8A93A6] mt-0.5 font-normal normal-case tracking-normal">
                  Valores em R$ — passe o mouse sobre as barras para detalhes
                </p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={chartData}
                margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
                barCategoryGap="28%"
                barGap={3}
              >
                <CartesianGrid strokeDasharray="3 6" stroke="#EDF0F5" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#8A93A6', fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={4}
                />
                <YAxis
                  tickFormatter={v => {
                    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                    if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                    return String(v);
                  }}
                  tick={{ fontSize: 11, fill: '#8A93A6' }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(13,71,161,0.04)' }} />
                <Legend
                  wrapperStyle={{ fontSize: 11, paddingTop: 14, color: '#4A5468' }}
                  iconType="square"
                  iconSize={10}
                />
                <Bar dataKey="Receita"    fill="#BFCFE8" radius={[2, 2, 0, 0]} maxBarSize={36} />
                <Bar dataKey="IRPJ"       fill="#0D47A1" radius={[2, 2, 0, 0]} maxBarSize={36} />
                <Bar dataKey="Excedente"  fill="#F57C00" radius={[2, 2, 0, 0]} maxBarSize={36}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry['Excedente'] > 0 ? '#F57C00' : 'transparent'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>

            {/* Legenda de cores */}
            <div className="flex flex-wrap gap-4 px-1 pb-1 mt-1 border-t border-[#F0F3F8] pt-3">
              {[
                { color: '#BFCFE8', label: 'Receita bruta total' },
                { color: '#0D47A1', label: 'IRPJ apurado' },
                { color: '#F57C00', label: 'Excedente majorado (> R$ 1.250.000)' },
              ].map(l => (
                <div key={l.label} className="flex items-center gap-1.5 text-[11px] text-[#4A5468]">
                  <span className="w-3 h-3 rounded-sm shrink-0" style={{ background: l.color }} />
                  {l.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── Tabela de trimestres ─────────────────────────────────── */}
          <TabelaTrimestres dados={data?.porTrimestre ?? []} />
        </>
      )}
    </div>
  );
}
