import { useState, useRef, useEffect } from 'react';
import { NumericFormat } from 'react-number-format';

interface Props {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}

function parseValor(str: string): number {
  // aceita "1.234,56" ou "1234.56" ou "1234,56"
  const limpo = str.trim().replace(/[^\d,\.]/g, '');
  if (!limpo) return NaN;
  // detecta formato BR (vírgula como decimal)
  const temVirgula = limpo.includes(',');
  const temPonto   = limpo.includes('.');
  if (temVirgula && temPonto) {
    // ex: "1.234,56" → remove pontos, troca vírgula por ponto
    return parseFloat(limpo.replace(/\./g, '').replace(',', '.'));
  }
  if (temVirgula) {
    // ex: "1234,56" ou "1234,5"
    return parseFloat(limpo.replace(',', '.'));
  }
  return parseFloat(limpo);
}

function brl(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

export default function CampoMonetario({ label, value, onChange, hint }: Props) {
  const [aberta, setAberta]     = useState(false);
  const [parcelas, setParcelas] = useState<number[]>([]);
  const [digitado, setDigitado] = useState('');
  const popupRef  = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const wrapRef   = useRef<HTMLDivElement>(null);

  const total = parcelas.reduce((s, n) => s + n, 0);

  function abrirCalculadora() {
    setParcelas([]);
    setDigitado('');
    setAberta(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function adicionarParcela() {
    const v = parseValor(digitado);
    if (isNaN(v) || v === 0) return;
    setParcelas(p => [...p, v]);
    setDigitado('');
    inputRef.current?.focus();
  }

  function remover(i: number) {
    setParcelas(p => p.filter((_, idx) => idx !== i));
  }

  function aplicar() {
    // se ainda há algo digitado, inclui antes de aplicar
    const extra = parseValor(digitado);
    const soma  = parcelas.reduce((s, n) => s + n, 0) + (isNaN(extra) ? 0 : extra);
    onChange(soma);
    setAberta(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') { e.preventDefault(); adicionarParcela(); }
    if (e.key === 'Escape') setAberta(false);
  }

  // fecha ao clicar fora
  useEffect(() => {
    if (!aberta) return;
    function handle(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        setAberta(false);
      }
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [aberta]);

  return (
    <div className="form-group" ref={wrapRef}>
      <label className="label">{label}</label>
      {hint && <p className="text-[11px] text-[#8A93A6] mb-1">{hint}</p>}

      <div className="relative flex items-center gap-1">
        <NumericFormat
          value={value || ''}
          onValueChange={v => onChange(v.floatValue ?? 0)}
          thousandSeparator="."
          decimalSeparator=","
          prefix="R$ "
          decimalScale={2}
          fixedDecimalScale
          allowNegative={false}
          className="input text-right mono flex-1"
          placeholder="R$ 0,00"
        />

        {/* botão calculadora */}
        <button
          type="button"
          onClick={abrirCalculadora}
          title="Somar parcelas"
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded text-gray-400 hover:text-[#1e3a5f] hover:bg-blue-50 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8"  y1="6"  x2="16" y2="6"/>
            <line x1="8"  y1="10" x2="16" y2="10"/>
            <line x1="8"  y1="14" x2="11" y2="14"/>
            <line x1="8"  y1="18" x2="11" y2="18"/>
            <line x1="14" y1="16" x2="16" y2="16"/>
            <line x1="15" y1="15" x2="15" y2="17"/>
          </svg>
        </button>

        {/* popup calculadora */}
        {aberta && (
          <div
            ref={popupRef}
            className="absolute z-50 top-full mt-1 right-0 bg-white border border-gray-200 rounded-xl shadow-xl w-64 p-3"
            style={{ minWidth: '240px' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Somar parcelas</span>
              <button type="button" onClick={() => setAberta(false)} className="text-gray-300 hover:text-gray-500 text-lg leading-none">&times;</button>
            </div>

            {/* lista de parcelas */}
            {parcelas.length > 0 && (
              <ul className="mb-2 space-y-1 max-h-32 overflow-y-auto">
                {parcelas.map((p, i) => (
                  <li key={i} className="flex items-center justify-between text-sm">
                    <span className="mono text-gray-700">{brl(p)}</span>
                    <button
                      type="button"
                      onClick={() => remover(i)}
                      className="text-gray-300 hover:text-red-400 text-xs ml-2"
                    >✕</button>
                  </li>
                ))}
              </ul>
            )}

            {/* input de entrada */}
            <div className="flex gap-1 mb-2">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                value={digitado}
                onChange={e => setDigitado(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="0,00"
                className="input-field flex-1 text-right mono text-sm py-1"
              />
              <button
                type="button"
                onClick={adicionarParcela}
                className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-[#1e3a5f] rounded text-lg font-bold leading-none transition-colors"
                title="Adicionar (Enter)"
              >+</button>
            </div>

            <p className="text-[10px] text-gray-400 mb-2 text-right">
              {parcelas.length > 0 ? `${parcelas.length} parcela${parcelas.length > 1 ? 's' : ''}` : 'Digite e pressione Enter ou +'}&nbsp;
            </p>

            {/* total */}
            <div className="border-t pt-2 mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-500">Total</span>
              <span className="mono font-bold text-[#1e3a5f] text-sm">
                {brl(total + (parseValor(digitado) || 0))}
              </span>
            </div>

            {/* ações */}
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => setAberta(false)}
                className="flex-1 py-1.5 text-xs rounded border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={aplicar}
                className="flex-1 py-1.5 text-xs rounded bg-[#1e3a5f] text-white hover:bg-[#2a5298] transition-colors font-medium"
              >
                Aplicar total
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
