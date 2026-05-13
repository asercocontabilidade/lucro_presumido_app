import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ConfiguracoesPage() {
  const { usuario } = useAuth();
  const [senhaAtual, setSenhaAtual] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleAlterarSenha(e: React.FormEvent) {
    e.preventDefault();
    if (novaSenha !== confirmacao) {
      toast.error('As senhas não coincidem.');
      return;
    }
    if (novaSenha.length < 6) {
      toast.error('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setSalvando(true);
    try {
      await api.put('/auth/senha', { senhaAtual, novaSenha });
      toast.success('Senha alterada com sucesso.');
      setSenhaAtual(''); setNovaSenha(''); setConfirmacao('');
    } catch {
      toast.error('Senha atual incorreta.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Configurações</h2>

      <div className="card mb-6">
        <h3 className="font-semibold text-gray-700 mb-4">Meu Perfil</h3>
        <div className="space-y-2 text-sm">
          <div className="flex gap-2"><span className="text-gray-500 w-24">Nome:</span><span className="font-medium">{usuario?.nome}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24">E-mail:</span><span className="font-medium">{usuario?.email}</span></div>
          <div className="flex gap-2"><span className="text-gray-500 w-24">Perfil:</span>
            <span className={`font-medium ${usuario?.perfil === 'ADMIN' ? 'text-[#1e3a5f]' : 'text-gray-700'}`}>
              {usuario?.perfil === 'ADMIN' ? 'Administrador' : 'Usuário'}
            </span>
          </div>
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold text-gray-700 mb-4">Alterar Senha</h3>
        <form onSubmit={handleAlterarSenha} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha atual</label>
            <input type="password" value={senhaAtual} onChange={e => setSenhaAtual(e.target.value)} className="input-field" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nova senha</label>
            <input type="password" value={novaSenha} onChange={e => setNovaSenha(e.target.value)} className="input-field" required minLength={6} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar nova senha</label>
            <input type="password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)} className="input-field" required />
          </div>
          <button type="submit" disabled={salvando} className="btn-primary">
            {salvando ? 'Salvando...' : 'Alterar senha'}
          </button>
        </form>
      </div>

      <div className="card mt-6">
        <h3 className="font-semibold text-gray-700 mb-2">Sobre o Sistema</h3>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Limite trimestral sem majoração: <strong>R$ 1.250.000,00</strong></p>
          <p>Adicional de IR: <strong>10%</strong> sobre base acima de R$ 60.000,00/trimestre</p>
          <p>Alíquota IRPJ: <strong>15%</strong></p>
          <p>Alíquota CSLL: <strong>9%</strong></p>
          <p className="text-xs text-gray-400 mt-3">Versão 1.0.0 — Uso interno</p>
        </div>
      </div>
    </div>
  );
}
