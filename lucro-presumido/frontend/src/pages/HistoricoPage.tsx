import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { brl, TRIMESTRES } from '../utils/format';

interface Calculo {
  id: number; ano: number; trimestre: number; descricao?: string;
  receitaTotal: string; irpjARecolher: string; excedenteMajorado: string;
  criadoEm: string;
  usuarioCriacao: { nome: string };
  empresa?: { razaoSocial: string; cnpj?: string } | null;
  detalheCalculo?: string;
}

function getModalidade(c: Calculo): string {
  try {
    if (!c.detalheCalculo) return 'trimestral';
    const d = typeof c.detalheCalculo === 'string' ? JSON.parse(c.detalheCalculo) : c.detalheCalculo;
    return d?.modalidadeRecolhimento ?? 'trimestral';
  } catch { return 'trimestral'; }
}

export default function HistoricoPage() {
  const [calculos, setCalculos]       = useState<Calculo[]>([]);
  const [total, setTotal]             = useState(0);
  const [filtroAno, setFiltroAno]     = useState('');
  const [filtroTri, setFiltroTri]     = useState('');
  const [filtroEmp, setFiltroEmp]     = useState('');
  const [soMajoracao, setSoMajoracao] = useState(false);
  const [buscaInput, setBuscaInput]   = useState('');
  const navigate = useNavigate();

  const carregar = useCallback(() => {
    const params = new URLSearchParams();
    if (filtroAno)    params.set('ano', filtroAno);
    if (filtroTri)    params.set('trimestre', filtroTri);
    if (filtroEmp)    params.set('empresa', filtroEmp);
    if (soMajoracao)  params.set('comMajoracao', 'true');
    api.get(`/calculos?${params}`).then(r => {
      setCalculos(r.data.calculos);
      setTotal(r.data.total);
    });
  }, [filtroAno, filtroTri, filtroEmp, soMajoracao]);

  useEffect(() => { carregar(); }, [carregar]);

  // debounce no campo empresa
  useEffect(() => {
    const t = setTimeout(() => setFiltroEmp(buscaInput), 400);
    return () => clearTimeout(t);
  }, [buscaInput]);

  function limparFiltros() {
    setFiltroAno(''); setFiltroTri('');
    setBuscaInput(''); setFiltroEmp('');
    setSoMajoracao(false);
  }

  const filtrosAtivos = filtroAno || filtroTri || filtroEmp || soMajoracao;

  async function handleExcluir(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm('Confirma a exclusão?')) return;
    await api.delete(`/calculos/${id}`);
    toast.success('Excluído.');
    carregar();
  }

  async function handleDuplicar(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    const { data } = await api.post(`/calculos/${id}/duplicar`);
    toast.success('Duplicado.');
    navigate(`/calculos/${data.id}/editar`);
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Histórico de Cálculos</h2>
          <p className="text-gray-500 text-sm mt-0.5">{total} registro(s) encontrado(s)</p>
        </div>
        <button className="btn-primary" onClick={() => navigate('/calculos/novo')}>+ Novo Cálculo</button>
      </div>

      {/* ── Filtros ──────────────────────────────────────────────────────── */}
      <div className="card p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">

          {/* Busca empresa */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-500 mb-1">Empresa</label>
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <input
                type="text"
                value={buscaInput}
                onChange={e => setBuscaInput(e.target.value)}
                placeholder="Buscar por nome da empresa..."
                className="input-field pl-7 text-sm"
              />
            </div>
          </div>

          {/* Ano */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Ano</label>
            <select value={filtroAno} onChange={e => setFiltroAno(e.target.value)} className="input-field w-28 text-sm">
              <option value="">Todos</option>
              {[2022, 2023, 2024, 2025, 2026, 2027].map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>

          {/* Trimestre */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Trimestre</label>
            <select value={filtroTri} onChange={e => setFiltroTri(e.target.value)} className="input-field w-40 text-sm">
              <option value="">Todos</option>
              {[1, 2, 3, 4].map(t => <option key={t} value={t}>{TRIMESTRES[t]}</option>)}
            </select>
          </div>

          {/* Majoração */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Majoração</label>
            <button
              type="button"
              onClick={() => setSoMajoracao(v => !v)}
              className={`flex items-center gap-2 px-3 py-2 rounded border text-sm font-medium transition-colors ${
                soMajoracao
                  ? 'bg-orange-50 border-orange-300 text-orange-700'
                  : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center shrink-0 transition-colors ${
                soMajoracao ? 'bg-orange-500 border-orange-500' : 'border-gray-300'
              }`}>
                {soMajoracao && <svg width="8" height="8" viewBox="0 0 10 10" fill="white"><polyline points="1.5,5 4,7.5 8.5,2.5" strokeWidth="1.5" stroke="white" fill="none"/></svg>}
              </span>
              Somente com majoração
            </button>
          </div>

          {/* Limpar filtros */}
          {filtrosAtivos && (
            <button
              type="button"
              onClick={limparFiltros}
              className="text-xs text-gray-400 hover:text-gray-600 underline self-end pb-2"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {/* ── Tabela ───────────────────────────────────────────────────────── */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="table-header">
              <th className="px-4 py-3 text-left">Período</th>
              <th className="px-4 py-3 text-left">Empresa</th>
              <th className="px-4 py-3 text-left">Descrição</th>
              <th className="px-4 py-3 text-right">Receita Total</th>
              <th className="px-4 py-3 text-right">IRPJ a Recolher</th>
              <th className="px-4 py-3 text-center">Majoração</th>
              <th className="px-4 py-3 text-center">Recolhimento</th>
              <th className="px-4 py-3 text-left">Criado por</th>
              <th className="px-4 py-3 text-left">Data</th>
              <th className="px-4 py-3 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {calculos.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-gray-400">
                  {filtrosAtivos ? 'Nenhum resultado para os filtros aplicados.' : 'Nenhum cálculo encontrado.'}
                </td>
              </tr>
            )}
            {calculos.map((c, i) => (
              <tr
                key={c.id}
                className={`cursor-pointer hover:bg-blue-50 transition-colors ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}
                onClick={() => navigate(`/calculos/${c.id}`)}
              >
                <td className="px-4 py-3 font-medium whitespace-nowrap">{TRIMESTRES[c.trimestre]} / {c.ano}</td>
                <td className="px-4 py-3 max-w-[200px]">
                  {c.empresa
                    ? <span className="text-gray-800 truncate block" title={c.empresa.razaoSocial}>{c.empresa.razaoSocial}</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 max-w-[140px] truncate">{c.descricao ?? '—'}</td>
                <td className="px-4 py-3 text-right font-mono whitespace-nowrap">{brl(c.receitaTotal)}</td>
                <td className="px-4 py-3 text-right font-mono font-semibold text-[#1e3a5f] whitespace-nowrap">{brl(c.irpjARecolher)}</td>
                <td className="px-4 py-3 text-center">
                  {Number(c.excedenteMajorado) > 0
                    ? <span className="majoracao-badge">⚠ Sim</span>
                    : <span className="text-gray-300 text-xs">—</span>}
                </td>
                <td className="px-4 py-3 text-center">
                  {getModalidade(c) === 'mensal'
                    ? <span className="badge-info text-[10px]">Estimativa mensal</span>
                    : <span className="text-[#8A93A6] text-[11px]">Trimestral</span>}
                </td>
                <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{c.usuarioCriacao.nome}</td>
                <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">{new Date(c.criadoEm).toLocaleDateString('pt-BR')}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-1 justify-center" onClick={e => e.stopPropagation()}>
                    <button className="text-blue-600 hover:text-blue-800 text-xs px-2 py-1 rounded hover:bg-blue-50" onClick={() => navigate(`/calculos/${c.id}/editar`)}>Editar</button>
                    <button className="text-gray-500 hover:text-gray-700 text-xs px-2 py-1 rounded hover:bg-gray-100" onClick={e => handleDuplicar(c.id, e)}>Duplicar</button>
                    <button className="text-red-500 hover:text-red-700 text-xs px-2 py-1 rounded hover:bg-red-50" onClick={e => handleExcluir(c.id, e)}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
