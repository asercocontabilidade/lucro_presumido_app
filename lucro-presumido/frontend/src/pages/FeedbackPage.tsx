import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface Feedback {
  id: number;
  tipo: 'erro' | 'melhoria';
  titulo: string;
  descricao: string;
  status: 'aberto' | 'em_analise' | 'resolvido';
  criadoEm: string;
  usuario: { id: number; nome: string };
}

const TIPO_LABEL: Record<string, string>   = { erro: 'Erro', melhoria: 'Melhoria' };
const STATUS_LABEL: Record<string, string> = { aberto: 'Aberto', em_analise: 'Em análise', resolvido: 'Resolvido' };

const TIPO_STYLE: Record<string, string> = {
  erro:     'bg-red-50 text-red-700 border-red-200',
  melhoria: 'bg-blue-50 text-blue-700 border-blue-200',
};
const STATUS_STYLE: Record<string, string> = {
  aberto:     'bg-yellow-50 text-yellow-700 border-yellow-200',
  em_analise: 'bg-purple-50 text-purple-700 border-purple-200',
  resolvido:  'bg-green-50 text-green-700 border-green-200',
};

const VAZIO = { tipo: 'melhoria' as 'erro' | 'melhoria', titulo: '', descricao: '' };

export default function FeedbackPage() {
  const { usuario } = useAuth();
  const isAdmin = usuario?.perfil === 'ADMIN';

  const [lista, setLista]         = useState<Feedback[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]   = useState(false);

  const [modalNovo,   setModalNovo]   = useState(false);
  const [modalEditar, setModalEditar] = useState<Feedback | null>(null);
  const [expandido,   setExpandido]   = useState<number | null>(null);

  const [form, setForm] = useState(VAZIO);

  // filtros
  const [filtroTipo,   setFiltroTipo]   = useState('');
  const [filtroStatus, setFiltroStatus] = useState('');

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/feedbacks');
      setLista(data);
    } catch { toast.error('Erro ao carregar.'); }
    finally { setCarregando(false); }
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await api.post('/feedbacks', form);
      toast.success('Enviado com sucesso!');
      setModalNovo(false);
      setForm(VAZIO);
      carregar();
    } catch { toast.error('Erro ao enviar.'); }
    finally { setSalvando(false); }
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEditar) return;
    setSalvando(true);
    try {
      await api.put(`/feedbacks/${modalEditar.id}`, {
        tipo: modalEditar.tipo,
        titulo: modalEditar.titulo,
        descricao: modalEditar.descricao,
        status: modalEditar.status,
      });
      toast.success('Atualizado.');
      setModalEditar(null);
      carregar();
    } catch { toast.error('Erro ao atualizar.'); }
    finally { setSalvando(false); }
  }

  async function handleExcluir(id: number) {
    if (!confirm('Excluir este item?')) return;
    try {
      await api.delete(`/feedbacks/${id}`);
      toast.success('Excluído.');
      carregar();
    } catch { toast.error('Sem permissão ou erro ao excluir.'); }
  }

  const podeEditar = (f: Feedback) => isAdmin || f.usuario.id === usuario?.id;

  const filtrado = lista.filter(f => {
    if (filtroTipo   && f.tipo   !== filtroTipo)   return false;
    if (filtroStatus && f.status !== filtroStatus) return false;
    return true;
  });

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Melhorias e Erros</h2>
          <p className="text-gray-500 text-sm mt-0.5">Reporte problemas ou sugestões para o sistema</p>
        </div>
        <button className="btn-primary" onClick={() => { setForm(VAZIO); setModalNovo(true); }}>
          + Novo Relato
        </button>
      </div>

      {/* Filtros */}
      <div className="flex gap-3 mb-4">
        <select value={filtroTipo} onChange={e => setFiltroTipo(e.target.value)} className="input-field w-36 text-sm">
          <option value="">Todos os tipos</option>
          <option value="erro">Erro</option>
          <option value="melhoria">Melhoria</option>
        </select>
        <select value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)} className="input-field w-40 text-sm">
          <option value="">Todos os status</option>
          <option value="aberto">Aberto</option>
          <option value="em_analise">Em análise</option>
          <option value="resolvido">Resolvido</option>
        </select>
        <span className="self-center text-xs text-gray-400">{filtrado.length} item(s)</span>
      </div>

      {/* Lista */}
      {carregando ? (
        <div className="text-center py-16 text-gray-400">Carregando...</div>
      ) : filtrado.length === 0 ? (
        <div className="card text-center py-16 text-gray-400">
          <p className="font-medium text-gray-500 mb-1">Nenhum relato encontrado</p>
          <p className="text-sm">Seja o primeiro a reportar uma melhoria ou erro!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtrado.map(f => (
            <div key={f.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  {/* Header do card */}
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${TIPO_STYLE[f.tipo]}`}>
                      {TIPO_LABEL[f.tipo]}
                    </span>
                    <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded border ${STATUS_STYLE[f.status]}`}>
                      {STATUS_LABEL[f.status]}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {f.usuario.nome} · {new Date(f.criadoEm).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  {/* Título */}
                  <button
                    type="button"
                    className="text-left w-full"
                    onClick={() => setExpandido(expandido === f.id ? null : f.id)}
                  >
                    <p className="font-semibold text-gray-800 text-sm hover:text-[#1e3a5f] transition-colors">
                      {f.titulo}
                      <span className="ml-1 text-gray-300 text-xs">{expandido === f.id ? '▲' : '▼'}</span>
                    </p>
                  </button>

                  {/* Descrição expandida */}
                  {expandido === f.id && (
                    <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap border-t pt-2">
                      {f.descricao}
                    </p>
                  )}
                </div>

                {/* Ações */}
                {podeEditar(f) && (
                  <div className="flex gap-1 shrink-0">
                    <button
                      className="btn-ghost text-xs px-2 py-1"
                      onClick={() => setModalEditar({ ...f })}
                    >
                      Editar
                    </button>
                    <button
                      className="text-red-400 hover:text-red-600 text-xs px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      onClick={() => handleExcluir(f.id)}
                    >
                      Excluir
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal — Novo relato */}
      {modalNovo && (
        <Modal titulo="Novo Relato" onClose={() => setModalNovo(false)}>
          <form onSubmit={handleCriar} className="space-y-3">
            <Campo label="Tipo">
              <select className="input-field" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as 'erro' | 'melhoria' }))}>
                <option value="melhoria">💡 Melhoria / Sugestão</option>
                <option value="erro">🐛 Erro / Problema</option>
              </select>
            </Campo>
            <Campo label="Título">
              <input
                type="text" className="input-field" required maxLength={120}
                placeholder="Resumo em uma linha..."
                value={form.titulo}
                onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              />
            </Campo>
            <Campo label="Descrição">
              <textarea
                className="input-field resize-none" required rows={4}
                placeholder="Descreva com detalhes o que precisa ser melhorado ou o erro encontrado..."
                value={form.descricao}
                onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
              />
            </Campo>
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-ghost" onClick={() => setModalNovo(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Enviando...' : 'Enviar relato'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal — Editar relato */}
      {modalEditar && (
        <Modal titulo="Editar Relato" onClose={() => setModalEditar(null)}>
          <form onSubmit={handleEditar} className="space-y-3">
            <Campo label="Tipo">
              <select className="input-field" value={modalEditar.tipo} onChange={e => setModalEditar(f => f && ({ ...f, tipo: e.target.value as 'erro' | 'melhoria' }))}>
                <option value="melhoria">💡 Melhoria / Sugestão</option>
                <option value="erro">🐛 Erro / Problema</option>
              </select>
            </Campo>
            <Campo label="Título">
              <input
                type="text" className="input-field" required maxLength={120}
                value={modalEditar.titulo}
                onChange={e => setModalEditar(f => f && ({ ...f, titulo: e.target.value }))}
              />
            </Campo>
            <Campo label="Descrição">
              <textarea
                className="input-field resize-none" required rows={4}
                value={modalEditar.descricao}
                onChange={e => setModalEditar(f => f && ({ ...f, descricao: e.target.value }))}
              />
            </Campo>
            {isAdmin && (
              <Campo label="Status">
                <select className="input-field" value={modalEditar.status} onChange={e => setModalEditar(f => f && ({ ...f, status: e.target.value as Feedback['status'] }))}>
                  <option value="aberto">Aberto</option>
                  <option value="em_analise">Em análise</option>
                  <option value="resolvido">Resolvido</option>
                </select>
              </Campo>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button type="button" className="btn-ghost" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function Modal({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">{titulo}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Campo({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  );
}
