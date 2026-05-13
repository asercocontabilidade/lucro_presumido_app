import { useEffect, useState } from 'react';
import api from '../utils/api';
import { brl } from '../utils/format';
import toast from 'react-hot-toast';
import EmpresaBusca, { EmpresaItem } from '../components/EmpresaBusca';

interface ResultadoPisCofins {
  baseCalculo: number;
  aliquotaPis: number; pisBruto: number; creditosPis: number; pisARecolher: number;
  aliquotaCofins: number; cofinsBruta: number; creditosCofins: number; cofinsARecolher: number;
  totalARecolher: number; dataVencimento: string;
}

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
];

const ANOS = [2023, 2024, 2025, 2026, 2027];

function pct(v: number) { return `${(v * 100).toFixed(2)}%`; }

function parse(s: string) { return parseFloat(s.replace(/\./g,'').replace(',','.')) || 0; }

export default function PisCofinsPage() {
  const [empresas,     setEmpresas]     = useState<EmpresaItem[]>([]);
  const [empresaId,    setEmpresaId]    = useState('');
  const [ano,          setAno]          = useState(new Date().getFullYear());
  const [mes,          setMes]          = useState(new Date().getMonth() + 1);
  const [regime,       setRegime]       = useState<'cumulativo'|'nao_cumulativo'>('cumulativo');
  const [receita,      setReceita]      = useState('');
  const [exclusoes,    setExclusoes]    = useState('');
  const [credPis,      setCredPis]      = useState('');
  const [credCofins,   setCredCofins]   = useState('');
  const [resultado,    setResultado]    = useState<ResultadoPisCofins | null>(null);
  const [calculando,   setCalculando]   = useState(false);
  const [salvando,     setSalvando]     = useState(false);

  useEffect(() => {
    api.get('/empresas', { params: { limit: 5000 } })
      .then(r => setEmpresas(r.data.empresas ?? []));
  }, []);

  function handleEmpresaChange(id: string, emp?: EmpresaItem) {
    setEmpresaId(id);
    if (emp) setRegime(emp.regimeTributario.includes('lucro_real') ? 'nao_cumulativo' : 'cumulativo');
  }

  async function calcular() {
    if (!receita) { toast.error('Informe a receita bruta'); return; }
    setCalculando(true);
    try {
      const { data } = await api.post('/pis-cofins/preview', {
        empresaId: empresaId || undefined, ano, mes,
        regimePisCofins: regime,
        receitaBruta: parse(receita),
        exclusoesBase: parse(exclusoes),
        creditosPis: parse(credPis),
        creditosCofins: parse(credCofins),
      });
      setResultado(data);
    } catch { toast.error('Erro ao calcular'); }
    finally { setCalculando(false); }
  }

  async function salvar() {
    if (!resultado) return;
    setSalvando(true);
    try {
      await api.post('/pis-cofins', {
        empresaId: empresaId || undefined, ano, mes,
        regimePisCofins: regime,
        receitaBruta: parse(receita),
        exclusoesBase: parse(exclusoes),
        creditosPis: parse(credPis),
        creditosCofins: parse(credCofins),
      });
      toast.success('Cálculo salvo no histórico');
    } catch { toast.error('Erro ao salvar'); }
    finally { setSalvando(false); }
  }

  const vencimento = resultado?.dataVencimento
    ? new Date(resultado.dataVencimento).toLocaleDateString('pt-BR')
    : null;

  const diasVenc = resultado?.dataVencimento
    ? Math.ceil((new Date(resultado.dataVencimento).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <div className="p-6 max-w-[1100px]">

      <div className="page-header">
        <div>
          <h1 className="page-title">PIS / COFINS</h1>
          <p className="page-subtitle">Conferência mensal — regime cumulativo e não-cumulativo</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5">

        {/* ── Formulário ───────────────────────────────────────────────── */}
        <div className="card space-y-4">
          <div className="card-header">
            <span className="card-title">Dados de Entrada</span>
          </div>

          <div className="form-group">
            <label className="label">Empresa</label>
            <EmpresaBusca
              value={empresaId}
              empresas={empresas}
              onChange={handleEmpresaChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="form-group">
              <label className="label">Mês</label>
              <select className="input" value={mes} onChange={e => setMes(Number(e.target.value))}>
                {MESES.map((m, i) => <option key={i} value={i+1}>{m}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Ano</label>
              <select className="input" value={ano} onChange={e => setAno(Number(e.target.value))}>
                {ANOS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle regime */}
          <div className="form-group">
            <label className="label">Regime</label>
            <div className="flex rounded border border-[#D8DDE8] overflow-hidden">
              {(['cumulativo','nao_cumulativo'] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setRegime(r)}
                  className={`flex-1 py-1.5 text-[12px] font-semibold transition-colors ${
                    regime === r
                      ? 'bg-[#0D47A1] text-white'
                      : 'bg-white text-[#4A5468] hover:bg-[#F2F4F8]'
                  }`}
                >
                  {r === 'cumulativo' ? 'Cumulativo' : 'Não-Cumulativo'}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#8A93A6] mt-1">
              {regime === 'cumulativo'
                ? 'PIS 0,65% · COFINS 3,00% — Lei 9.718/1998'
                : 'PIS 1,65% · COFINS 7,60% — Leis 10.637/02 e 10.833/03'}
            </p>
          </div>

          <div className="form-group">
            <label className="label">Receita Bruta (R$) *</label>
            <input className="input font-mono" placeholder="0,00" value={receita}
              onChange={e => setReceita(e.target.value)} />
          </div>

          <div className="form-group">
            <label className="label">Exclusões da Base (R$)</label>
            <input className="input font-mono" placeholder="Devoluções, IPI, ICMS-ST..."
              value={exclusoes} onChange={e => setExclusoes(e.target.value)} />
          </div>

          {regime === 'nao_cumulativo' && (
            <div className="p-3 border border-[#D8DDE8] rounded space-y-3 bg-[#F7F9FC]">
              <p className="section-label">Créditos</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="label">Créditos PIS</label>
                  <input className="input font-mono" placeholder="0,00" value={credPis}
                    onChange={e => setCredPis(e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="label">Créditos COFINS</label>
                  <input className="input font-mono" placeholder="0,00" value={credCofins}
                    onChange={e => setCredCofins(e.target.value)} />
                </div>
              </div>
            </div>
          )}

          <button onClick={calcular} disabled={calculando} className="btn-primary btn-lg w-full">
            {calculando ? 'Calculando...' : 'Calcular'}
          </button>
        </div>

        {/* ── Resultado ────────────────────────────────────────────────── */}
        <div className="space-y-3">
          {resultado ? (
            <>
              {/* Alerta vencimento */}
              {diasVenc !== null && diasVenc <= 10 && (
                <div className={diasVenc <= 3 ? 'alert-danger' : 'alert-warning'}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  Vencimento em {diasVenc} dia{diasVenc !== 1 ? 's' : ''}: {vencimento}
                </div>
              )}

              <div className="card">
                <div className="card-header">
                  <span className="card-title">Resultado — {MESES[mes-1]}/{ano}</span>
                  <span className={regime === 'cumulativo' ? 'badge-success' : 'badge-info'}>
                    {regime === 'cumulativo' ? 'Cumulativo' : 'Não-Cumulativo'}
                  </span>
                </div>

                {/* Linha base */}
                <div className="flex justify-between py-2 border-b border-[#EDF0F5] text-[13px]">
                  <span className="text-[#4A5468]">Base de cálculo</span>
                  <span className="font-semibold mono">{brl(resultado.baseCalculo)}</span>
                </div>

                {/* PIS */}
                <div className="mt-3 mb-1">
                  <p className="section-label">PIS — {pct(resultado.aliquotaPis)} · DARF 8109</p>
                  <table className="w-full text-[12.5px]">
                    <tbody>
                      <Row label="PIS bruto" value={brl(resultado.pisBruto)} />
                      {resultado.creditosPis > 0 && (
                        <Row label="(−) Créditos PIS" value={`(${brl(resultado.creditosPis)})`} cls="text-[#1B7A4E]" />
                      )}
                      <Row label="PIS a Recolher" value={brl(resultado.pisARecolher)} bold />
                    </tbody>
                  </table>
                </div>

                <div className="border-t border-[#EDF0F5] my-2" />

                {/* COFINS */}
                <div className="mb-3">
                  <p className="section-label">COFINS — {pct(resultado.aliquotaCofins)} · DARF 2172</p>
                  <table className="w-full text-[12.5px]">
                    <tbody>
                      <Row label="COFINS bruta" value={brl(resultado.cofinsBruta)} />
                      {resultado.creditosCofins > 0 && (
                        <Row label="(−) Créditos COFINS" value={`(${brl(resultado.creditosCofins)})`} cls="text-[#1B7A4E]" />
                      )}
                      <Row label="COFINS a Recolher" value={brl(resultado.cofinsARecolher)} bold />
                    </tbody>
                  </table>
                </div>

                {/* Total */}
                <div
                  className="flex justify-between px-4 py-2.5 text-[13px] font-bold text-white"
                  style={{ background: '#0A1628', borderRadius: 3 }}
                >
                  <span>Total a Recolher</span>
                  <span className="mono">{brl(resultado.totalARecolher)}</span>
                </div>

                {/* Vencimento */}
                {vencimento && (
                  <div className="flex justify-between mt-3 text-[11.5px] text-[#8A93A6]">
                    <span>Vencimento (dia 25 do mês seguinte)</span>
                    <span className="font-semibold text-[#4A5468]">{vencimento}</span>
                  </div>
                )}

                <div className="divider" />

                <button onClick={salvar} disabled={salvando} className="btn-primary w-full">
                  {salvando ? 'Salvando...' : 'Salvar no Histórico'}
                </button>
              </div>
            </>
          ) : (
            <div className="card flex flex-col items-center justify-center py-20 text-[#8A93A6]">
              <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" className="mb-3 opacity-25">
                <rect x="4" y="2" width="16" height="20" rx="2"/>
                <line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/>
                <line x1="8" y1="18" x2="12" y2="18"/>
              </svg>
              <p className="text-[13px] font-medium text-[#4A5468]">Preencha os dados e clique em Calcular</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, bold, cls }: { label: string; value: string; bold?: boolean; cls?: string }) {
  return (
    <tr className="border-b border-[#F0F3F8] last:border-0">
      <td className="py-1.5 text-[#4A5468]">{label}</td>
      <td className={`py-1.5 text-right mono ${bold ? 'font-semibold text-[#1A1F2E]' : ''} ${cls ?? ''}`}>
        {value}
      </td>
    </tr>
  );
}
