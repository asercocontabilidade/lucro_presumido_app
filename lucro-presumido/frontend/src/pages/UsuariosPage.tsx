import { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'USUARIO';
  ativo: boolean;
  criadoEm: string;
}

const VAZIO_NOVO  = { nome: '', email: '', senha: '', perfil: 'USUARIO' as 'ADMIN' | 'USUARIO' };
const VAZIO_SENHA = { novaSenha: '', confirmacao: '' };

export default function UsuariosPage() {
  const [usuarios, setUsuarios]     = useState<Usuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando]     = useState(false);

  const [modalNovo,   setModalNovo]   = useState(false);
  const [modalEditar, setModalEditar] = useState<Usuario | null>(null);
  const [modalSenha,  setModalSenha]  = useState<Usuario | null>(null);

  const [formNovo,  setFormNovo]  = useState(VAZIO_NOVO);
  const [formSenha, setFormSenha] = useState(VAZIO_SENHA);

  async function carregar() {
    setCarregando(true);
    try {
      const { data } = await api.get('/usuarios');
      setUsuarios(data);
    } catch {
      toast.error('Erro ao carregar usuários.');
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => { carregar(); }, []);

  async function handleCriar(e: React.FormEvent) {
    e.preventDefault();
    if (formNovo.senha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    setSalvando(true);
    try {
      await api.post('/usuarios', formNovo);
      toast.success('Usuário criado com sucesso.');
      setModalNovo(false);
      setFormNovo(VAZIO_NOVO);
      carregar();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro ?? 'Erro ao criar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleEditar(e: React.FormEvent) {
    e.preventDefault();
    if (!modalEditar) return;
    setSalvando(true);
    try {
      await api.put(`/usuarios/${modalEditar.id}`, {
        nome:   modalEditar.nome,
        email:  modalEditar.email,
        perfil: modalEditar.perfil,
        ativo:  modalEditar.ativo,
      });
      toast.success('Usuário atualizado.');
      setModalEditar(null);
      carregar();
    } catch (err: any) {
      toast.error(err?.response?.data?.erro ?? 'Erro ao atualizar usuário.');
    } finally {
      setSalvando(false);
    }
  }

  async function handleResetarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (!modalSenha) return;
    if (formSenha.novaSenha !== formSenha.confirmacao) { toast.error('As senhas não coincidem.'); return; }
    if (formSenha.novaSenha.length < 6) { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    setSalvando(true);
    try {
      await api.put(`/usuarios/${modalSenha.id}/senha`, { novaSenha: formSenha.novaSenha });
      toast.success('Senha redefinida com sucesso.');
      setModalSenha(null);
      setFormSenha(VAZIO_SENHA);
    } catch {
      toast.error('Erro ao redefinir senha.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Usuários</h2>
        <button className="btn-primary" onClick={() => { setFormNovo(VAZIO_NOVO); setModalNovo(true); }}>
          + Novo Usuário
        </button>
      </div>

      <div className="card p-0 overflow-hidden">
        {carregando ? (
          <div className="p-8 text-center text-gray-400">Carregando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b" style={{ background: 'var(--c-surface)' }}>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Nome</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">E-mail</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Perfil</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600">Cadastrado em</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map(u => (
                <tr key={u.id} className="border-b last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800">{u.nome}</td>
                  <td className="px-4 py-3 text-gray-600">{u.email}</td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-[3px] ${
                      u.perfil === 'ADMIN'
                        ? 'bg-[#e8effa] text-[#1e3a5f]'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {u.perfil === 'ADMIN' ? 'Administrador' : 'Usuário'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-[3px] ${
                      u.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                    }`}>
                      {u.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {new Date(u.criadoEm).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <button
                        className="btn-ghost text-xs px-2 py-1"
                        onClick={() => setModalEditar({ ...u })}
                      >
                        Editar
                      </button>
                      <button
                        className="btn-ghost text-xs px-2 py-1"
                        onClick={() => { setFormSenha(VAZIO_SENHA); setModalSenha(u); }}
                      >
                        Redefinir senha
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {usuarios.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Nenhum usuário encontrado.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal — Novo Usuário */}
      {modalNovo && (
        <Modal titulo="Novo Usuário" onClose={() => setModalNovo(false)}>
          <form onSubmit={handleCriar} className="space-y-3">
            <Campo label="Nome completo">
              <input
                type="text" className="input-field" required
                value={formNovo.nome}
                onChange={e => setFormNovo(f => ({ ...f, nome: e.target.value }))}
              />
            </Campo>
            <Campo label="E-mail">
              <input
                type="email" className="input-field" required
                value={formNovo.email}
                onChange={e => setFormNovo(f => ({ ...f, email: e.target.value }))}
              />
            </Campo>
            <Campo label="Senha inicial">
              <input
                type="password" className="input-field" required minLength={6}
                value={formNovo.senha}
                onChange={e => setFormNovo(f => ({ ...f, senha: e.target.value }))}
              />
            </Campo>
            <Campo label="Perfil">
              <select
                className="input-field"
                value={formNovo.perfil}
                onChange={e => setFormNovo(f => ({ ...f, perfil: e.target.value as 'ADMIN' | 'USUARIO' }))}
              >
                <option value="USUARIO">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Campo>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setModalNovo(false)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Criar usuário'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal — Editar Usuário */}
      {modalEditar && (
        <Modal titulo="Editar Usuário" onClose={() => setModalEditar(null)}>
          <form onSubmit={handleEditar} className="space-y-3">
            <Campo label="Nome completo">
              <input
                type="text" className="input-field" required
                value={modalEditar.nome}
                onChange={e => setModalEditar(u => u && ({ ...u, nome: e.target.value }))}
              />
            </Campo>
            <Campo label="E-mail">
              <input
                type="email" className="input-field" required
                value={modalEditar.email}
                onChange={e => setModalEditar(u => u && ({ ...u, email: e.target.value }))}
              />
            </Campo>
            <Campo label="Perfil">
              <select
                className="input-field"
                value={modalEditar.perfil}
                onChange={e => setModalEditar(u => u && ({ ...u, perfil: e.target.value as 'ADMIN' | 'USUARIO' }))}
              >
                <option value="USUARIO">Usuário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </Campo>
            <Campo label="Status">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalEditar.ativo}
                  onChange={e => setModalEditar(u => u && ({ ...u, ativo: e.target.checked }))}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm text-gray-700">Usuário ativo</span>
              </label>
            </Campo>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setModalEditar(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Modal — Redefinir Senha */}
      {modalSenha && (
        <Modal titulo={`Redefinir senha — ${modalSenha.nome}`} onClose={() => setModalSenha(null)}>
          <form onSubmit={handleResetarSenha} className="space-y-3">
            <Campo label="Nova senha">
              <input
                type="password" className="input-field" required minLength={6}
                value={formSenha.novaSenha}
                onChange={e => setFormSenha(f => ({ ...f, novaSenha: e.target.value }))}
              />
            </Campo>
            <Campo label="Confirmar nova senha">
              <input
                type="password" className="input-field" required
                value={formSenha.confirmacao}
                onChange={e => setFormSenha(f => ({ ...f, confirmacao: e.target.value }))}
              />
            </Campo>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" className="btn-ghost" onClick={() => setModalSenha(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={salvando}>
                {salvando ? 'Redefinindo...' : 'Redefinir senha'}
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
      <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
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
