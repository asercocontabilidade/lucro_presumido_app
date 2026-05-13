import { useState, useEffect, useRef, useCallback } from 'react';

export interface EmpresaItem {
  id: string;
  razaoSocial: string;
  nomeFantasia?: string;
  cnpj?: string;
  codigoErp?: string;
  codigoInterno?: string;
  regimeTributario: string;
  sujeitoMajoracao?: boolean;
  /** 'trimestral' (padrão) ou 'mensal' (estimativa mensal / antecipações mensais) */
  modalidadeRecolhimento?: string;
}

interface Props {
  value: string;
  onChange: (id: string, empresa?: EmpresaItem) => void;
  empresas: EmpresaItem[];
  placeholder?: string;
  disabled?: boolean;
}

const REGIME_BADGE: Record<string, string> = {
  lucro_presumido:       'badge-success',
  lucro_real_trimestral: 'badge-info',
  lucro_real_anual:      'badge-purple',
  simples:               'badge-neutral',
};

const REGIME_SHORT: Record<string, string> = {
  lucro_presumido:       'LP',
  lucro_real_trimestral: 'LRT',
  lucro_real_anual:      'LRA',
  simples:               'SN',
};

/** Remove acentos, traços, pontos e barras; retorna minúsculas */
function norm(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.\-/]/g, '');
}

/** Retorna true se o campo contém a query normalizada */
function match(field: string | null | undefined, q: string) {
  if (!field) return false;
  return norm(field).includes(q);
}

/** Destaca a ocorrência da query no texto original */
function Highlight({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <>{text}</>;
  const qNorm = norm(query);
  const textNorm = norm(text);
  const idx = textNorm.indexOf(qNorm);
  if (idx === -1) return <>{text}</>;
  // Aproximar índice no texto original (pode diferir por acentos/espaços removidos)
  // Busca simples: pega os primeiros chars até o match funcionar
  let start = 0, pos = 0;
  while (pos < text.length && norm(text.slice(0, pos + 1)).length <= idx) pos++;
  start = pos;
  const end = start + query.length;
  return (
    <>
      {text.slice(0, start)}
      <mark className="bg-amber-100 text-amber-800 not-italic font-semibold" style={{ borderRadius: 2, padding: '0 1px' }}>
        {text.slice(start, end)}
      </mark>
      {text.slice(end)}
    </>
  );
}

export default function EmpresaBusca({ value, onChange, empresas, placeholder, disabled }: Props) {
  const [query,   setQuery]   = useState('');
  const [open,    setOpen]    = useState(false);
  const [cursor,  setCursor]  = useState(-1);
  const inputRef  = useRef<HTMLInputElement>(null);
  const listRef   = useRef<HTMLUListElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const selecionada = value ? empresas.find(e => e.id === value) : undefined;

  /* ── Filtragem ────────────────────────────────────────────────────── */
  const lista = useCallback(() => {
    const q = norm(query);
    if (!q) return empresas.slice(0, 80);
    return empresas
      .filter(e =>
        match(e.razaoSocial, q)    ||
        match(e.nomeFantasia, q)   ||
        match(e.cnpj, q)           ||
        match(e.codigoErp, q)      ||
        match(e.codigoInterno, q)
      )
      .slice(0, 80);
  }, [query, empresas])();

  /* ── Fechar ao clicar fora ────────────────────────────────────────── */
  useEffect(() => {
    function handler(ev: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(ev.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* ── Scroll automático no item focado ────────────────────────────── */
  useEffect(() => {
    if (cursor >= 0 && listRef.current) {
      (listRef.current.children[cursor] as HTMLElement)?.scrollIntoView({ block: 'nearest' });
    }
  }, [cursor]);

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setOpen(true);
    setCursor(-1);
    if (!e.target.value) onChange('');
  }

  function handleFocus() {
    setOpen(true);
    setQuery('');
  }

  function handleBlur() {
    setTimeout(() => {
      if (!wrapRef.current?.contains(document.activeElement)) setOpen(false);
    }, 160);
  }

  function select(emp: EmpresaItem) {
    onChange(emp.id, emp);
    setQuery('');
    setOpen(false);
    setCursor(-1);
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange('');
    setQuery('');
    inputRef.current?.focus();
  }

  function handleKey(e: React.KeyboardEvent) {
    if (!open && (e.key === 'ArrowDown' || e.key === 'Enter')) { setOpen(true); return; }
    if (e.key === 'Escape')     { setOpen(false); return; }
    if (e.key === 'ArrowDown')  { e.preventDefault(); setCursor(c => Math.min(c + 1, lista.length - 1)); return; }
    if (e.key === 'ArrowUp')    { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); return; }
    if (e.key === 'Enter' && cursor >= 0 && lista[cursor]) { e.preventDefault(); select(lista[cursor]); }
  }

  const displayValue = open ? query : (selecionada?.razaoSocial ?? query);

  return (
    <div ref={wrapRef} className="relative w-full">

      {/* ── Input ──────────────────────────────────────────────────── */}
      <div className="relative flex items-center">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#8A93A6" strokeWidth="2"
          className="absolute left-2.5 pointer-events-none shrink-0 z-10">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={displayValue}
          onChange={handleInput}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKey}
          disabled={disabled}
          placeholder={placeholder ?? 'Buscar por nome, CNPJ ou código Questor...'}
          className="input pl-8 pr-7"
          autoComplete="off"
          spellCheck={false}
        />
        {(value || query) && (
          <button
            type="button"
            onMouseDown={clear}
            tabIndex={-1}
            className="absolute right-2 text-[#C0C8D8] hover:text-[#4A5468] transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Info da empresa selecionada ────────────────────────────── */}
      {selecionada && !open && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
          {selecionada.codigoErp && (
            <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold
                             text-[#0D47A1] bg-[#E8EFF8] px-1.5 py-0.5 rounded-[3px]">
              #{selecionada.codigoErp}
            </span>
          )}
          {selecionada.cnpj && (
            <span className="text-[11px] font-mono text-[#8A93A6]">{selecionada.cnpj}</span>
          )}
          <span className={REGIME_BADGE[selecionada.regimeTributario] ?? 'badge-neutral'}>
            {REGIME_SHORT[selecionada.regimeTributario] ?? selecionada.regimeTributario}
          </span>
        </div>
      )}

      {/* ── Dropdown ───────────────────────────────────────────────── */}
      {open && (
        <div
          className="absolute z-50 left-0 right-0 mt-1 bg-white shadow-xl overflow-hidden"
          style={{ border: '1px solid #D8DDE8', borderRadius: 4, maxHeight: 340 }}
        >
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-[#EDF0F5]
                          bg-[#F7F9FC] shrink-0">
            <span className="text-[10.5px] text-[#8A93A6]">
              {query
                ? `${lista.length} resultado${lista.length !== 1 ? 's' : ''} para "${query}"`
                : `Exibindo ${lista.length} de ${empresas.length} empresas — digite para filtrar`}
            </span>
            <span className="text-[10px] text-[#C8CED8] hidden sm:block">↑↓ · Enter</span>
          </div>

          {/* Lista */}
          {lista.length === 0 ? (
            <div className="px-4 py-6 text-center text-[12px] text-[#8A93A6]">
              Nenhuma empresa encontrada para <strong>"{query}"</strong>
            </div>
          ) : (
            <ul ref={listRef} className="overflow-y-auto" style={{ maxHeight: 290 }}>
              {lista.map((emp, i) => (
                <li
                  key={emp.id}
                  onMouseDown={() => select(emp)}
                  className={`
                    flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors
                    border-b border-[#F0F3F8] last:border-0
                    ${i === cursor   ? 'bg-[#EBF3FF]' : 'hover:bg-[#F7F9FC]'}
                    ${emp.id === value ? 'bg-[#F0F5FF]' : ''}
                  `}
                >
                  {/* Código Questor — destaque principal */}
                  {emp.codigoErp && (
                    <span
                      className="shrink-0 font-mono font-bold text-[11px] text-[#0D47A1]
                                 bg-[#E8EFF8] px-1.5 py-1 rounded-[3px] min-w-[52px] text-center"
                    >
                      <Highlight text={emp.codigoErp} query={query} />
                    </span>
                  )}

                  {/* Nome */}
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] font-medium text-[#1A1F2E] truncate leading-tight">
                      <Highlight text={emp.razaoSocial} query={query} />
                    </p>
                    {emp.cnpj && (
                      <p className="text-[10.5px] font-mono text-[#8A93A6] mt-0.5">
                        <Highlight text={emp.cnpj} query={query} />
                      </p>
                    )}
                  </div>

                  {/* Regime badge */}
                  <span className={`shrink-0 ${REGIME_BADGE[emp.regimeTributario] ?? 'badge-neutral'}`}>
                    {REGIME_SHORT[emp.regimeTributario] ?? emp.regimeTributario}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
