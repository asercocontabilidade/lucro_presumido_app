import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface NavChild { to: string; label: string }
interface NavItem  { to?: string; label: string; icon: React.ReactNode; children?: NavChild[]; adminOnly?: boolean }

const navItems: NavItem[] = [
  { to: '/historico',       label: 'Histórico',     icon: <IcHistory /> },
  { label: 'Apuração',      icon: <IcCalc />,
    children: [
      { to: '/calculos/novo',   label: 'IRPJ / CSLL' },
      { to: '/pis-cofins/novo', label: 'PIS / COFINS' },
    ],
  },
  { label: 'Relatórios',    icon: <IcReport />,
    children: [
      { to: '/relatorio-anual', label: 'Relatório Anual' },
      { to: '/dashboard',       label: 'Dashboard' },
    ],
  },
  { to: '/empresas',        label: 'Empresas',      icon: <IcBuilding /> },
  { to: '/feedback',        label: 'Melhorias',     icon: <IcFeedback /> },
  { to: '/usuarios',        label: 'Usuários',      icon: <IcUsers />, adminOnly: true },
  { to: '/configuracoes',   label: 'Configurações', icon: <IcSettings /> },
];

/* ── Ícones ─────────────────────────────────────────────────────────────── */
function IcGrid()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg> }
function IcCalc()     { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="12" y2="18"/><line x1="8" y1="6" x2="16" y2="6"/></svg> }
function IcBuilding() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg> }
function IcHistory()  { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><polyline points="12 8 12 12 14 14"/><path d="M3.05 11a9 9 0 1 0 .5-4.5L1 9"/><polyline points="1 4 1 9 6 9"/></svg> }
function IcSettings() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg> }
function IcReport()   { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg> }
function IcUsers()    { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg> }
function IcFeedback() { return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg> }
function IcLogout()   { return <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> }
function IcMenu()     { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6"  x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg> }
function IcChevronR() { return <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg> }

type SidebarMode = 'full' | 'icons' | 'hidden';

/* ── NavItem component ──────────────────────────────────────────────────── */
function SidebarItem({ item, mode }: { item: NavItem; mode: SidebarMode }) {
  const location = useLocation();
  const isChildActive = item.children?.some(c => location.pathname.startsWith(c.to));
  const [open, setOpen] = useState(isChildActive ?? false);
  const iconsOnly = mode === 'icons';

  const base = `
    flex items-center gap-2.5 w-full px-2.5 py-2 text-[12.5px] font-medium
    rounded transition-all duration-100 cursor-pointer select-none
    focus:outline-none focus:ring-1 focus:ring-white/30
  `;
  const active   = 'bg-[#1565C0] text-white';
  const inactive = 'text-[#B8C8E0] hover:bg-white/[0.10] hover:text-white';

  if (item.children) {
    return (
      <div>
        <button
          onClick={() => setOpen(v => !v)}
          className={`${base} ${isChildActive ? active : inactive} ${iconsOnly ? 'justify-center' : ''}`}
          title={iconsOnly ? item.label : undefined}
        >
          <span className="shrink-0 opacity-85">{item.icon}</span>
          {!iconsOnly && (
            <>
              <span className="flex-1 text-left">{item.label}</span>
              <span className={`transition-transform duration-150 opacity-40 ${open ? 'rotate-90' : ''}`}>
                <IcChevronR />
              </span>
            </>
          )}
        </button>
        {open && !iconsOnly && (
          <div className="ml-5 mt-0.5 border-l border-white/15 pl-2.5 space-y-0.5">
            {item.children.map(c => (
              <NavLink
                key={c.to} to={c.to}
                className={({ isActive }) => `
                  block px-2 py-1.5 rounded text-[12px] font-medium transition-colors
                  focus:outline-none focus:ring-1 focus:ring-white/30
                  ${isActive ? 'text-white bg-white/15 font-semibold' : 'text-[#9DB4CC] hover:text-white hover:bg-white/[0.10]'}
                `}
              >
                {c.label}
              </NavLink>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <NavLink
      to={item.to!}
      title={iconsOnly ? item.label : undefined}
      className={({ isActive }) =>
        `${base} ${isActive ? active : inactive} ${iconsOnly ? 'justify-center' : ''}`
      }
    >
      <span className="shrink-0 opacity-85">{item.icon}</span>
      {!iconsOnly && <span>{item.label}</span>}
    </NavLink>
  );
}

/* ── Layout ─────────────────────────────────────────────────────────────── */
export default function Layout() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<SidebarMode>('full');

  const cycle = () => setMode(m =>
    m === 'full' ? 'icons' : m === 'icons' ? 'hidden' : 'full'
  );

  const sideW = mode === 'full' ? 'w-[220px]' : mode === 'icons' ? 'w-[48px]' : 'w-0';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--c-surface)' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside
        className={`
          ${sideW} flex flex-col shrink-0 overflow-hidden
          transition-all duration-200 no-print
        `}
        style={{ background: 'var(--sidebar-bg)' }}
      >
        {/* Logo — logo grande no full, favicon no modo ícones */}
        <div
          className="flex items-center justify-center shrink-0 px-2"
          style={{ height: 'var(--topbar-h)', borderBottom: '1px solid var(--sidebar-border)' }}
        >
          {mode === 'full' ? (
            <img
              src="/LOGO.png"
              alt="Aserco"
              className="h-8 max-w-[140px] object-contain"
              onError={e => {
                e.currentTarget.style.display = 'none';
                const fb = e.currentTarget.nextSibling as HTMLElement;
                if (fb) fb.style.display = 'flex';
              }}
            />
          ) : (
            <img
              src="/favicon2.ico"
              alt="Aserco"
              className="h-7 w-7 object-contain rounded"
              title="Aserco Contabilidade"
            />
          )}
          {/* Fallback texto quando logo não carrega */}
          <span
            style={{ display: 'none' }}
            className="h-7 w-7 rounded bg-[#F57C00] text-white font-bold text-xs items-center justify-center"
          >
            AS
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
          {navItems
            .filter(item => !item.adminOnly || usuario?.perfil === 'ADMIN')
            .map((item, i) => (
              <SidebarItem key={i} item={item} mode={mode} />
            ))}
        </nav>

        {/* Footer */}
        <div
          className="shrink-0 px-1.5 py-2 border-t"
          style={{ borderColor: 'var(--sidebar-border)' }}
        >
          {mode === 'full' && (
            <div className="px-2 mb-2">
              <p className="text-[12px] font-semibold text-white/90 truncate">{usuario?.nome}</p>
              <p className="text-[10px] text-white/50 truncate">{usuario?.email}</p>
            </div>
          )}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            title="Sair"
            className={`
              w-full flex items-center gap-2 px-2 py-1.5 rounded text-[11.5px]
              text-[#7A9AB8] hover:text-white hover:bg-white/[0.10] transition-colors
              focus:outline-none focus:ring-1 focus:ring-white/30
              ${mode !== 'full' ? 'justify-center' : ''}
            `}
          >
            <IcLogout />
            {mode === 'full' && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Topbar */}
        <header
          className="shrink-0 flex items-center gap-3 px-4 no-print"
          style={{
            height: 'var(--topbar-h)',
            background: 'var(--c-white)',
            borderBottom: '1px solid var(--c-border)',
          }}
        >
          {/* Toggle sidebar */}
          <button
            onClick={cycle}
            className="btn-ghost w-8 h-8 p-0 flex items-center justify-center"
            title={mode === 'hidden' ? 'Exibir menu' : mode === 'icons' ? 'Ocultar menu' : 'Recolher menu'}
          >
            <IcMenu />
          </button>

          <div className="flex-1 min-w-0" />

          <span
            className="text-[11px] font-semibold uppercase tracking-wider px-2 py-1 rounded-[3px]"
            style={{ background: 'var(--c-primary-light)', color: 'var(--c-primary)' }}
          >
            {usuario?.perfil === 'ADMIN' ? 'Administrador' : 'Usuário'}
          </span>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
