import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [modo, setModo] = useState<'login' | 'cadastro'>('login');
  const [carregando, setCarregando] = useState(false);

  const [email, setEmail]           = useState('');
  const [senha, setSenha]           = useState('');
  const [nome, setNome]             = useState('');
  const [confirmacao, setConfirmacao] = useState('');

  function trocarModo(m: 'login' | 'cadastro') {
    setModo(m);
    setEmail(''); setSenha(''); setNome(''); setConfirmacao('');
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setCarregando(true);
    try {
      await login(email, senha);
      navigate('/dashboard');
    } catch {
      toast.error('E-mail ou senha inválidos.');
    } finally {
      setCarregando(false);
    }
  }

  async function handleCadastro(e: React.FormEvent) {
    e.preventDefault();
    if (senha !== confirmacao) { toast.error('As senhas não coincidem.'); return; }
    if (senha.length < 6)      { toast.error('A senha deve ter pelo menos 6 caracteres.'); return; }
    setCarregando(true);
    try {
      const { data } = await api.post('/auth/registrar', { nome, email, senha });
      localStorage.setItem('token', data.token);
      await login(email, senha);
      toast.success(`Bem-vindo, ${nome.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (err: any) {
      toast.error(err?.response?.data?.erro ?? 'Erro ao criar conta.');
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#1e3a5f] to-[#2a5298] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">

        {/* Logo / título */}
        <div className="text-center mb-6">
          <div className="text-4xl mb-3">📊</div>
          <h1 className="text-2xl font-bold text-gray-800">Lucro Presumido</h1>
          <p className="text-gray-500 text-sm mt-1">Sistema de Cálculo de IRPJ</p>
        </div>

        {/* Abas */}
        <div className="flex rounded-lg overflow-hidden border border-gray-200 mb-6">
          <button
            type="button"
            onClick={() => trocarModo('login')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              modo === 'login'
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => trocarModo('cadastro')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              modo === 'cadastro'
                ? 'bg-[#1e3a5f] text-white'
                : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
          >
            Criar conta
          </button>
        </div>

        {/* Formulário de login */}
        {modo === 'login' && (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="seu@email.com.br" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                className="input-field" placeholder="••••••••" required
              />
            </div>
            <button type="submit" disabled={carregando} className="btn-primary w-full py-3 text-base">
              {carregando ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        )}

        {/* Formulário de cadastro */}
        {modo === 'cadastro' && (
          <form onSubmit={handleCadastro} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome completo</label>
              <input
                type="text" value={nome} onChange={e => setNome(e.target.value)}
                className="input-field" placeholder="Seu nome" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="input-field" placeholder="seu@email.com.br" required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
              <input
                type="password" value={senha} onChange={e => setSenha(e.target.value)}
                className="input-field" placeholder="Mínimo 6 caracteres" required minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar senha</label>
              <input
                type="password" value={confirmacao} onChange={e => setConfirmacao(e.target.value)}
                className="input-field" placeholder="••••••••" required
              />
            </div>
            <button type="submit" disabled={carregando} className="btn-primary w-full py-3 text-base">
              {carregando ? 'Criando conta...' : 'Criar conta'}
            </button>
          </form>
        )}

        <p className="text-center text-xs text-gray-400 mt-6">
          Uso interno — Intranet corporativa
        </p>
      </div>
    </div>
  );
}
