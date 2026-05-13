import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { ResultadoCalculo } from '../utils/calculo';
import { brl, TRIMESTRES } from '../utils/format';
import TabelaCalculo from '../components/TabelaCalculo';

interface Calculo {
  id: number; ano: number; trimestre: number; descricao?: string;
  receitaTotal: string; excedenteMajorado: string;
  basePresumidaIrpj: string; irpjTotal: string; irpjARecolher: string;
  basePresumidaCsll: string; csll9: string; csllARecolher: string;
  irpj15: string; adicionalIr10: string; irrf: string; csllRetida: string;
  criadoEm: string; atualizadoEm: string;
  usuarioCriacao: { nome: string };
  usuarioAtualizacao?: { nome: string };
  detalheCalculo: ResultadoCalculo;
}

export default function DetalhePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [calculo, setCalculo] = useState<Calculo | null>(null);

  useEffect(() => {
    api.get(`/calculos/${id}`).then(r => setCalculo(r.data));
  }, [id]);

  async function handleExcluir() {
    if (!confirm('Confirma a exclusão deste cálculo?')) return;
    await api.delete(`/calculos/${id}`);
    toast.success('Cálculo excluído.');
    navigate('/historico');
  }

  async function handleDuplicar() {
    const { data } = await api.post(`/calculos/${id}/duplicar`);
    toast.success('Cálculo duplicado.');
    navigate(`/calculos/${data.id}/editar`);
  }

  async function handlePdf() {
    try {
      const res = await api.get(`/calculos/${id}/pdf`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `calculo-${calculo?.ano}-T${calculo?.trimestre}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar PDF.');
    }
  }

  async function handleExcel() {
    try {
      const res = await api.get(`/calculos/${id}/excel`, { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `calculo-${calculo?.ano}-T${calculo?.trimestre}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao exportar Excel.');
    }
  }

  if (!calculo) return <div className="p-8 text-gray-400">Carregando...</div>;

  const resultado = calculo.detalheCalculo as ResultadoCalculo;

  return (
    <div className="p-8 max-w-6xl mx-auto">

      {/* ── Cabeçalho de impressão (só aparece no print) ─────────────── */}
      <div className="hidden print-only mb-4">
        <div style={{ background: '#0A1628', borderRadius: 4, padding: '10px 16px 8px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ color: 'white', fontWeight: 700, fontSize: 14, letterSpacing: '-0.01em' }}>
              APURAÇÃO DO LUCRO PRESUMIDO — IRPJ / CSLL
            </div>
            <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10, marginTop: 2 }}>
              {TRIMESTRES[calculo.trimestre]} — {calculo.ano}
              {calculo.descricao && ` · ${calculo.descricao}`}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>
            <div>Criado por {calculo.usuarioCriacao.nome}</div>
            <div>Impresso em {new Date().toLocaleString('pt-BR')}</div>
          </div>
        </div>
        {/* KPIs resumidos para impressão */}
        <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
          {[
            { label: 'Receita Total',       value: brl(calculo.receitaTotal) },
            { label: 'Excedente Majorado',  value: brl(calculo.excedenteMajorado), red: Number(calculo.excedenteMajorado) > 0 },
            { label: 'Base Presumida IRPJ', value: brl(calculo.basePresumidaIrpj) },
            { label: 'IRPJ a Recolher',     value: brl(calculo.irpjARecolher), blue: true },
            { label: 'Base Presumida CSLL', value: brl(calculo.basePresumidaCsll) },
            { label: 'CSLL a Recolher',     value: brl(calculo.csllARecolher), blue: true },
          ].map(k => (
            <div key={k.label} style={{ flex: 1, border: '1px solid #D8DDE8', borderRadius: 3, padding: '4px 8px' }}>
              <div style={{ fontSize: 8, color: '#8A93A6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</div>
              <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace', color: k.red ? '#B91C1C' : k.blue ? '#0D47A1' : '#1A1F2E', marginTop: 1 }}>{k.value}</div>
            </div>
          ))}
        </div>
        <hr style={{ borderColor: '#D8DDE8', marginTop: 8, marginBottom: 0 }} />
      </div>

      {/* ── Header da tela (escondido no print) ──────────────────────── */}
      <div className="flex items-start justify-between mb-6 no-print">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">
            {TRIMESTRES[calculo.trimestre]} / {calculo.ano}
            {calculo.descricao && <span className="text-gray-400 font-normal ml-2">— {calculo.descricao}</span>}
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Criado por {calculo.usuarioCriacao.nome} em {new Date(calculo.criadoEm).toLocaleString('pt-BR')}
            {calculo.usuarioAtualizacao && ` · Editado por ${calculo.usuarioAtualizacao.nome}`}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          <button className="btn-secondary text-sm" onClick={() => navigate(`/calculos/${id}/editar`)}>✏️ Editar</button>
          <button className="btn-secondary text-sm" onClick={handleDuplicar}>📋 Duplicar</button>
          <button className="btn-secondary text-sm" onClick={handlePdf}>📄 PDF</button>
          <button className="btn-secondary text-sm" onClick={handleExcel}>📊 Excel</button>
          <button className="btn-secondary text-sm" onClick={() => window.print()}>🖨️ Imprimir</button>
          <button className="btn-danger text-sm" onClick={handleExcluir}>🗑️ Excluir</button>
        </div>
      </div>

      {/* ── KPIs (escondidos no print) ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 no-print">
        {[
          { label: 'Receita Total',        value: brl(calculo.receitaTotal) },
          { label: 'Excedente Majorado',   value: brl(calculo.excedenteMajorado), red: Number(calculo.excedenteMajorado) > 0 },
          { label: 'Base Presumida IRPJ',  value: brl(calculo.basePresumidaIrpj) },
          { label: 'IRPJ a Recolher',      value: brl(calculo.irpjARecolher), blue: true },
          { label: 'Base Presumida CSLL',  value: brl(calculo.basePresumidaCsll) },
          { label: 'CSLL a Recolher',      value: brl(calculo.csllARecolher), blue: true },
        ].map(k => (
          <div key={k.label} className={`card py-3 px-3 min-w-0 ${k.red ? 'border-red-200 bg-red-50' : ''}`}>
            <p className="text-[10px] text-gray-500 uppercase tracking-wide leading-tight mb-1">{k.label}</p>
            <p className={`text-[13px] font-bold font-mono leading-tight break-all ${k.red ? 'text-red-600' : k.blue ? 'text-[#1e3a5f]' : 'text-gray-800'}`}>
              {k.value}
            </p>
          </div>
        ))}
      </div>

      <TabelaCalculo resultado={resultado} />
    </div>
  );
}
