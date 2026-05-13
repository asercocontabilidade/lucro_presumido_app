import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import NovoCalculoPage from './pages/NovoCalculoPage';
import HistoricoPage from './pages/HistoricoPage';
import DetalhePage from './pages/DetalhePage';
import ConfiguracoesPage from './pages/ConfiguracoesPage';
import EmpresasPage from './pages/EmpresasPage';
import PisCofinsPage from './pages/PisCofinsPage';
import RelatorioAnualPage from './pages/RelatorioAnualPage';
import UsuariosPage from './pages/UsuariosPage';
import FeedbackPage from './pages/FeedbackPage';

function RotaProtegida({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="flex items-center justify-center h-screen text-gray-500">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function RotaAdmin({ children }: { children: React.ReactNode }) {
  const { usuario, carregando } = useAuth();
  if (carregando) return <div className="flex items-center justify-center h-screen text-gray-500">Carregando...</div>;
  if (!usuario) return <Navigate to="/login" replace />;
  if (usuario.perfil !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<RotaProtegida><Layout /></RotaProtegida>}>
        <Route index element={<Navigate to="/historico" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="empresas" element={<EmpresasPage />} />
        <Route path="calculos/novo" element={<NovoCalculoPage />} />
        <Route path="calculos/:id/editar" element={<NovoCalculoPage />} />
        <Route path="calculos/:id" element={<DetalhePage />} />
        <Route path="historico" element={<HistoricoPage />} />
        <Route path="pis-cofins/novo" element={<PisCofinsPage />} />
        <Route path="relatorio-anual" element={<RelatorioAnualPage />} />
        <Route path="configuracoes" element={<ConfiguracoesPage />} />
        <Route path="usuarios" element={<RotaAdmin><UsuariosPage /></RotaAdmin>} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
