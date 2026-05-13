import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';

interface Usuario {
  id: number;
  nome: string;
  email: string;
  perfil: 'ADMIN' | 'USUARIO';
}

interface AuthContextType {
  usuario: Usuario | null;
  token: string | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  carregando: boolean;
}

const AuthContext = createContext<AuthContextType>(null!);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    if (token) {
      api.get('/auth/perfil')
        .then(r => setUsuario(r.data))
        .catch(() => { localStorage.removeItem('token'); setToken(null); })
        .finally(() => setCarregando(false));
    } else {
      setCarregando(false);
    }
  }, [token]);

  async function login(email: string, senha: string) {
    const { data } = await api.post('/auth/login', { email, senha });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUsuario(data.usuario);
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUsuario(null);
  }

  return (
    <AuthContext.Provider value={{ usuario, token, login, logout, carregando }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
