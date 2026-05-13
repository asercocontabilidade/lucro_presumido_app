import { useEffect, useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Empresa {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  regimeTributario: string;
  cnaePrimario?: string;
  ativo: boolean;
  sujeitoMajoracao: boolean;
  modalidadeRecolhimento: string;
}

const REGIME_CONFIG: Record<string, { label: string; badge: string }> = {
  lucro_presumido:       { label: 'Lucro Presumido',       badge: 'badge-success' },
  lucro_real_trimestral: { label: 'Lucro Real Trim.',      badge: 'badge-info'    },
  lucro_real_anual:      { label: 'Lucro Real Anual',      badge: 'badge-purple'  },
  simples:               { label: 'Simples Nacional',      badge: 'badge-neutral' },
};

interface FormState {
  razaoSocial: string; nomeFantasia: string; cnpj: string;
  regimeTributario: string; cnaePrimario: string;
  modalidadeRecolhimento: string; sujeitoMajoracao: boolean;
}

const FORM0: FormState = {
  razaoSocial: '', nomeFantasia: '', cnpj: '',
  regimeTributario: 'lucro_presumido', cnaePrimario: '',
  modalidadeRecolhimento: 'trimestral', sujeitoMajoracao: false,
};

export default function EmpresasPage() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [total, setTotal]       = useState(0);
  const [busca, setBusca]       = useState('');
  const [regime, setRegime]     = useState('');
  const [loading, setLoading]   = useState(true);
  const [modal, setModal]       = useState(false);
  const [editando, setEditando] = useState<Empresa | null>(null);
  const [form, setForm]         = useState<FormState>(FORM0);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (busca)   params.busca             = busca;
      if (regime)  params.regimeTributario  = regime;
      const { data } = await api.get('/empresas', { params });
      setEmpresas(data.empresas);
      setTotal(data.total);
    } finally { setLoading(false); }
  }

  useEffect(() => { carregar(); }, [busca, regime]);

  function abrirNova() {
    setEditando(null); setForm(FORM0); setModal(true);
  }

  function abrirEditar(e: Empresa) {
    setEditando(e);
    setForm({
      razaoSocial: e.razaoSocial, nomeFantasia: e.nomeFantasia ?? '',
      cnpj: e.cnpj ?? '', regimeTributario: e.regimeTributario,
      cnaePrimario: e.cnaePrimario ?? '',
      modalidadeRecolhimento: e.modalidadeRecolhimento,
      sujeitoMajoracao: e.sujeitoMajoracao,
    });
    setModal(true);
  }

  async function salvar() {
    if (!form.razaoSocial.trim()) { toast.error('Razão social é obrigatória'); return; }
    setSalvando(true);
    try {
      if (editando) {
        await api.put(`/empresas/${editando.id}`, form);
        toast.success('Empresa atualizada');
      } else {
        await api.post('/empresas', form);
        toast.success('Empresa cadastrada');
      }
      setModal(false); carregar();
    } catch (err: any) {
      toast.error(err.response?.data?.error ?? 'Erro ao salvar');
    } finally { setSalvando(false); }
  }

  async function desativar(id: string, nome: string) {
    if (!confirm(`Desativar "${nome}"?`)) return;
    await api.delete(`/empresas/${id}`);
    toast.success('Empresa desativada');
    carregar();
  }

  function F(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm(f => ({ ...f, [field]: (e.target as HTMLInputElement).type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value }));
  }

  return (
    <div className="p-6">

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Empresas</h1>
          <p className="page-subtitle">{total} empresa{total !== 1 ? 's' : ''} cadastrada{total !== 1 ? 's' : ''}</p>
        </div>
        <button className="btn-primary" onClick={abrirNova}>+ Nova Empresa</button>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-4">
        <input
          type="text" placeholder="Buscar por nome ou CNPJ..."
          value={busca} onChange={e => setBusca(e.target.value)}
          className="input flex-1 max-w-sm"
        />
        <select value={regime} onChange={e => setRegime(e.target.value)} className="input w-44">
          <option value="">Todos os regimes</option>
          <option value="lucro_presumido">Lucro Presumido</option>
          <option value="lucro_real_trimestral">Lucro Real Trim.</option>
          <option value="lucro_real_anual">Lucro Real Anual</option>
          <option value="simples">Simples Nacional</option>
        </select>
      </div>

      {/* Tabela */}
      <div className="table-wrap">
        <table className="table-pro">
          <thead>
            <tr>
              <th>Razão Social</th>
              <th>CNPJ</th>
              <th>Regime</th>
              <th>CNAE</th>
              <th>Recolhimento</th>
              <th className="text-center">Maj.</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center py-10 text-[#8A93A6]">Carregando...</td></tr>
            ) : empresas.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-14 text-[#8A93A6]">
                  <p className="font-semibold text-[#4A5468] text-sm">Nenhuma empresa encontrada</p>
                  <button className="btn-primary mt-3 btn-sm" onClick={abrirNova}>
                    Cadastrar primeira empresa
                  </button>
                </td>
              </tr>
            ) : (
              empresas.map(emp => {
                const cfg = REGIME_CONFIG[emp.regimeTributario] ?? { label: emp.regimeTributario, badge: 'badge-neutral' };
                return (
                  <tr key={emp.id}>
                    <td>
                      <p className="font-medium text-[13px]">{emp.razaoSocial}</p>
                      {emp.nomeFantasia && emp.nomeFantasia !== emp.razaoSocial && (
                        <p className="text-[11px] text-[#8A93A6]">{emp.nomeFantasia}</p>
                      )}
                    </td>
                    <td className="font-mono text-[12px] text-[#4A5468]">{emp.cnpj ?? '—'}</td>
                    <td><span className={cfg.badge}>{cfg.label}</span></td>
                    <td className="max-w-[180px]">
                      <span className="text-[12px] text-[#4A5468] truncate block" title={emp.cnaePrimario ?? ''}>
                        {emp.cnaePrimario ? emp.cnaePrimario.split(' - ')[0] : '—'}
                      </span>
                    </td>
                    <td className="text-[12px] text-[#4A5468]">
                      {emp.modalidadeRecolhimento === 'mensal'
                        ? <span className="badge-info">Estimativa mensal</span>
                        : <span className="text-[#4A5468]">Trimestral</span>}
                    </td>
                    <td className="text-center">
                      {emp.sujeitoMajoracao
                        ? <span className="majoracao-badge">MAJ</span>
                        : <span className="text-[#D8DDE8]">—</span>}
                    </td>
                    <td className="text-right">
                      <button
                        onClick={() => abrirEditar(emp)}
                        className="btn-ghost btn-sm mr-1"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => desativar(emp.id, emp.razaoSocial)}
                        className="btn-danger btn-sm"
                      >
                        Desativar
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-lg shadow-2xl" style={{ borderRadius: 6, border: '1px solid #D8DDE8' }}>

            {/* Modal header */}
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#E8ECF2]">
              <h3 className="text-[14px] font-semibold text-[#1A1F2E]">
                {editando ? 'Editar Empresa' : 'Cadastrar Empresa'}
              </h3>
              <button onClick={() => setModal(false)} className="btn-ghost btn-sm w-7 h-7 p-0 flex items-center justify-center text-lg">×</button>
            </div>

            {/* Modal body */}
            <div className="px-5 py-4 space-y-3">
              <div className="form-group">
                <label className="label">Razão Social *</label>
                <input className="input" value={form.razaoSocial} onChange={F('razaoSocial')} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Nome Fantasia</label>
                  <input className="input" value={form.nomeFantasia} onChange={F('nomeFantasia')} />
                </div>
                <div className="form-group">
                  <label className="label">CNPJ</label>
                  <input className="input font-mono" value={form.cnpj} onChange={F('cnpj')} placeholder="00.000.000/0000-00" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="form-group">
                  <label className="label">Regime Tributário</label>
                  <select className="input" value={form.regimeTributario} onChange={F('regimeTributario')}>
                    <option value="lucro_presumido">Lucro Presumido</option>
                    <option value="lucro_real_trimestral">Lucro Real Trim.</option>
                    <option value="lucro_real_anual">Lucro Real Anual</option>
                    <option value="simples">Simples Nacional</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Recolhimento IRPJ/CSLL</label>
                  <select className="input" value={form.modalidadeRecolhimento} onChange={F('modalidadeRecolhimento')}>
                    <option value="trimestral">Trimestral</option>
                    <option value="mensal">Estimativa mensal / antecipações mensais</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">CNAE Primário</label>
                <input className="input" value={form.cnaePrimario} onChange={F('cnaePrimario')} placeholder="Ex: 62.01-5-01 - Desenvolvimento de programas..." />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.sujeitoMajoracao}
                  onChange={e => setForm(f => ({ ...f, sujeitoMajoracao: e.target.checked }))}
                  className="w-3.5 h-3.5 rounded border-[#D8DDE8] accent-[#0D47A1]"
                />
                <span className="text-[12.5px] text-[#4A5468]">
                  Sujeito à majoração BEPS (grupo multinacional › EUR 750 mi)
                </span>
              </label>
            </div>

            {/* Modal footer */}
            <div className="px-5 py-3.5 border-t border-[#E8ECF2] flex justify-end gap-2">
              <button onClick={() => setModal(false)} className="btn-secondary" disabled={salvando}>Cancelar</button>
              <button onClick={salvar} className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
