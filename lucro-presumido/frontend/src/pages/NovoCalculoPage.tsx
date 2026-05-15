import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { calcular, EntradaCalculo, LIMITE_ADICIONAL_MENSAL, LIMITE_ADICIONAL_TRIMESTRAL } from '../utils/calculo';
import { TRIMESTRES, brl } from '../utils/format';
import CampoMonetario from '../components/CampoMonetario';
import TabelaCalculo from '../components/TabelaCalculo';
import EmpresaBusca, { EmpresaItem } from '../components/EmpresaBusca';
import { usePeriodoRules } from '../hooks/usePeriodoRules';

const anoAtual = new Date().getFullYear();
const anos     = Array.from({ length: 6 }, (_, i) => anoAtual - 2 + i);

const entradaVazia: EntradaCalculo = {
  receita16: 0, receita8: 0, receita16p: 0, receita32: 0,
  outrasReceitas: 0, irrf: 0, csllRetida: 0,
};

type MesEntrada = Pick<EntradaCalculo, 'receita16'|'receita8'|'receita16p'|'receita32'|'outrasReceitas'|'irrf'|'csllRetida'>;
const mesPadrao: MesEntrada = { receita16: 0, receita8: 0, receita16p: 0, receita32: 0, outrasReceitas: 0, irrf: 0, csllRetida: 0 };
const sumMeses = (meses: [MesEntrada, MesEntrada, MesEntrada], k: keyof MesEntrada) =>
  (meses[0][k] ?? 0) + (meses[1][k] ?? 0) + (meses[2][k] ?? 0);
const MESES_TRI: Record<number, [string, string, string]> = {
  1: ['Janeiro', 'Fevereiro', 'Março'],
  2: ['Abril', 'Maio', 'Junho'],
  3: ['Julho', 'Agosto', 'Setembro'],
  4: ['Outubro', 'Novembro', 'Dezembro'],
};

/** Dados de apurações mensais anteriores encontradas no sistema */
interface ApuracaoAnterior {
  mes: string;       // ex: "Janeiro"
  mesIdx: number;    // 0 ou 1
  irpjARecolher: number;
  csllARecolher: number;
  calculoId: number;
  descricao: string;
  receitasMes?: MesEntrada;  // receitas do mês para restaurar na aba correspondente
}

// ── Autosave helpers ─────────────────────────────────────────────────────────
interface Rascunho {
  ano: number; trimestre: number; descricao: string;
  empresaId: string; entrada: EntradaCalculo;
  modoMensal: boolean;
  meses: [MesEntrada, MesEntrada, MesEntrada];
  irpjMesesAnt: number; csllMesesAnt: number;
  /** Antecipações detalhadas por mês (empresa mensal) */
  irpjAntMes1: number; irpjAntMes2: number;
  csllAntMes1: number; csllAntMes2: number;
  savedAt: string;
}

function rascunhoKey(id?: string) {
  return id ? `rascunho_calculo_${id}` : 'rascunho_calculo_novo';
}

function salvarRascunho(key: string, dados: Omit<Rascunho, 'savedAt'>) {
  try {
    localStorage.setItem(key, JSON.stringify({ ...dados, savedAt: new Date().toISOString() }));
  } catch { /* quota exceeded — ignora */ }
}

function limparRascunho(key: string) {
  localStorage.removeItem(key);
}

function lerRascunho(key: string): Rascunho | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export default function NovoCalculoPage() {
  const { id }      = useParams();
  const navigate    = useNavigate();
  const isEdicao    = Boolean(id);
  const RASCUNHO_KEY = rascunhoKey(id);

  const [ano,        setAno]        = useState(anoAtual);
  const [trimestre,  setTrimestre]  = useState(1);
  const [descricao,  setDescricao]  = useState('');
  const [empresaId,  setEmpresaId]  = useState('');
  const [empresaSel, setEmpresaSel] = useState<EmpresaItem | undefined>();
  const [empresas,   setEmpresas]   = useState<EmpresaItem[]>([]);  const [entrada,    setEntrada]    = useState<EntradaCalculo>(entradaVazia);
  const [salvando,   setSalvando]   = useState(false);
  const [modoMensal, setModoMensal] = useState(false);
  const [mesAtivo,   setMesAtivo]   = useState(0);
  const [meses,      setMeses]      = useState<[MesEntrada, MesEntrada, MesEntrada]>(
    [{ ...mesPadrao }, { ...mesPadrao }, { ...mesPadrao }]
  );
  const [irpjMesesAnt, setIrpjMesesAnt] = useState(0);
  const [csllMesesAnt, setCsllMesesAnt] = useState(0);
  // Antecipações detalhadas por mês (empresa mensal)
  const [irpjAntMes1, setIrpjAntMes1] = useState(0);
  const [irpjAntMes2, setIrpjAntMes2] = useState(0);
  const [csllAntMes1, setCsllAntMes1] = useState(0);
  const [csllAntMes2, setCsllAntMes2] = useState(0);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [temRascunho,    setTemRascunho]    = useState(false);
  const [periodoConflito, setPeriodoConflito] = useState<{ id: number; descricao: string } | null>(null);
  /** Indica que o cálculo editado é mensal mas não tem detalhamento por mês (registro antigo) */
  const [edicaoMensalSemDetalhe, setEdicaoMensalSemDetalhe] = useState(false);
  /** Apurações mensais anteriores encontradas no sistema para recuperação */
  const [apuracoesAnteriores, setApuracoesAnteriores] = useState<ApuracaoAnterior[]>([]);
  const [modalRecuperacao, setModalRecuperacao] = useState(false);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Impede autosave durante o carregamento inicial dos dados
  const carregandoDados = useRef(true);

  // Regras do período selecionado
  const periodoRules = usePeriodoRules(
    ano,
    trimestre,
    empresaSel?.sujeitoMajoracao ?? false
  );

  // Alerta 1T/2026 independente da empresa
  const alerta1T2026 = ano === 2026 && trimestre === 1;

  useEffect(() => {
    api.get('/empresas', { params: { limit: 5000 } })
      .then(r => setEmpresas(r.data.empresas ?? []));
  }, []);

  useEffect(() => {
    if (id) {
      api.get(`/calculos/${id}`).then(r => {
        const c = r.data;
        setAno(c.ano);
        setTrimestre(c.trimestre);
        setDescricao(c.descricao ?? '');
        if (c.empresaId) setEmpresaId(c.empresaId);
        setEntrada({
          receita16:      Number(c.receita16),
          receita8:       Number(c.receita8),
          receita16p:     Number(c.receita16p),
          receita32:      Number(c.receita32),
          outrasReceitas: Number(c.outrasReceitas),
          irrf:           Number(c.irrf),
          csllRetida:     Number(c.csllRetida),
        });

        // ── Restaurar modo mensal, mesReferencia e antecipações a partir do detalheCalculo ──
        const detalhe = c.detalheCalculo ?? {};
        const modalidade = detalhe.modalidadeRecolhimento ?? 'trimestral';
        const mesRef = detalhe.mesReferencia as number | undefined;
        if (modalidade === 'mensal') {
          setModoMensal(true);
          // Restaurar aba ativa com base no tipo de registro
          if (mesRef === 1) setMesAtivo(0);
          else if (mesRef === 2) setMesAtivo(1);
          // mesRef=3 ou undefined → mantém aba 0 (fechamento trimestral, usuário navega)
          // Restaurar receitas individuais por mês, se disponíveis
          if (detalhe.receitasMensais) {
            setMeses(detalhe.receitasMensais as [MesEntrada, MesEntrada, MesEntrada]);
          }
          // Restaurar antecipações detalhadas por mês (apenas em registros de fechamento)
          if (detalhe.irpjAntecipacaoMes1 !== undefined) {
            setIrpjAntMes1(Number(detalhe.irpjAntecipacaoMes1));
            setIrpjAntMes2(Number(detalhe.irpjAntecipacaoMes2 ?? 0));
            setCsllAntMes1(Number(detalhe.csllAntecipacaoMes1 ?? 0));
            setCsllAntMes2(Number(detalhe.csllAntecipacaoMes2 ?? 0));
          } else {
            // Fallback: cálculo antigo — usa valores consolidados
            setIrpjMesesAnt(Number(detalhe.irpjMesesAnteriores ?? 0));
            setCsllMesesAnt(Number(detalhe.csllMesesAnteriores ?? 0));
            setEdicaoMensalSemDetalhe(true);
          }
        } else {
          // Trimestral: restaurar pagamentos consolidados se existirem
          setIrpjMesesAnt(Number(detalhe.irpjMesesAnteriores ?? 0));
          setCsllMesesAnt(Number(detalhe.csllMesesAnteriores ?? 0));
        }
      }).finally(() => { carregandoDados.current = false; });
    } else {
      // Novo cálculo — libera autosave imediatamente
      carregandoDados.current = false;
    }
  }, [id]);

  // Sincronizar empresaSel quando empresas carregarem (edição)
  useEffect(() => {
    if (empresaId && empresas.length > 0 && !empresaSel) {
      const found = empresas.find(e => e.id === empresaId);
      if (found) setEmpresaSel(found);
    }
  }, [empresas, empresaId]);

  // Resetar aba mensal ativa ao trocar trimestre
  useEffect(() => { setMesAtivo(0); }, [trimestre]);

  // ── Busca apurações mensais anteriores para recuperação ──────────────────
  // Ativado quando: modo mensal + empresa selecionada + não é edição
  useEffect(() => {
    setApuracoesAnteriores([]);
    if (!modoMensal || !empresaId || isEdicao) return;

    const mesesTri = MESES_TRI[trimestre as keyof typeof MESES_TRI];
    if (!mesesTri) return;

    const timer = setTimeout(async () => {
      try {
        // Busca cálculos da mesma empresa no mesmo ano/trimestre
        const { data } = await api.get('/calculos', {
          params: { empresaId, ano, trimestre, limit: 10 },
        });
        const calculos: Array<{
          id: number; descricao: string;
          irpjARecolher: number; csllARecolher: number;
          detalheCalculo?: string | Record<string, unknown>;
        }> = data.calculos ?? [];

        // Filtra registros de antecipação mensal (mesReferencia 1 ou 2)
        const encontradas: ApuracaoAnterior[] = [];
        for (const c of calculos) {
          const detalhe = typeof c.detalheCalculo === 'string'
            ? JSON.parse(c.detalheCalculo)
            : (c.detalheCalculo ?? {});
          const modalidade = detalhe?.modalidadeRecolhimento ?? 'trimestral';
          const mesRef = detalhe?.mesReferencia as number | undefined;

          // Antecipação mês 1 (mesReferencia=1) ou mês 2 (mesReferencia=2)
          if (modalidade === 'mensal' && (mesRef === 1 || mesRef === 2)) {
            const mesIdx = mesRef - 1; // 1→0, 2→1
            const receitasMensais = detalhe?.receitasMensais as [MesEntrada, MesEntrada, MesEntrada] | undefined;
            encontradas.push({
              mes: mesesTri[mesIdx],
              mesIdx,
              irpjARecolher: Number(c.irpjARecolher),
              csllARecolher: Number(c.csllARecolher),
              calculoId: c.id,
              descricao: c.descricao ?? `Mês ${mesRef}`,
              receitasMes: receitasMensais?.[mesIdx],
            });
          }
        }

        if (encontradas.length > 0) {
          setApuracoesAnteriores(encontradas);
          setModalRecuperacao(true);
        }
      } catch { /* ignora erros silenciosamente */ }
    }, 600);

    return () => clearTimeout(timer);
  }, [modoMensal, empresaId, ano, trimestre, isEdicao]);

  // Verificar proativamente se já existe registro com o mesmo mesReferencia para a empresa/período
  useEffect(() => {
    setPeriodoConflito(null);
    if (isEdicao || !empresaId) return;
    const mesReferenciaCheck = modoMensal && mesAtivo < 2 ? mesAtivo + 1 : 3;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/calculos', { params: { ano, trimestre, empresaId, mesReferencia: mesReferenciaCheck, limit: 1 } });
        if (data.total > 0) {
          const c = data.calculos[0];
          setPeriodoConflito({ id: c.id, descricao: c.descricao || `${ano} - T${trimestre}` });
        }
      } catch { /* ignora erros de rede silenciosamente */ }
    }, 400);
    return () => clearTimeout(timer);
  }, [ano, trimestre, empresaId, isEdicao, modoMensal, mesAtivo]);

  // ── Autosave ─────────────────────────────────────────────────────────────
  // Verifica rascunho ao montar (só para novo cálculo ou edição sem dados carregados ainda)
  useEffect(() => {
    const rascunho = lerRascunho(RASCUNHO_KEY);
    if (rascunho) setTemRascunho(true);
  }, [RASCUNHO_KEY]);

  // Dispara autosave 2s após qualquer mudança nos dados
  const dispararAutosave = useCallback(() => {
    if (carregandoDados.current) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    setAutoSaveStatus('saving');
    autoSaveTimer.current = setTimeout(() => {
      salvarRascunho(RASCUNHO_KEY, {
        ano, trimestre, descricao, empresaId, entrada,
        modoMensal, meses, irpjMesesAnt, csllMesesAnt,
        irpjAntMes1, irpjAntMes2, csllAntMes1, csllAntMes2,
      });
      setAutoSaveStatus('saved');
      setTimeout(() => setAutoSaveStatus('idle'), 2000);
    }, 2000);
  }, [RASCUNHO_KEY, ano, trimestre, descricao, empresaId, entrada, modoMensal, meses, irpjMesesAnt, csllMesesAnt, irpjAntMes1, irpjAntMes2, csllAntMes1, csllAntMes2]);

  useEffect(() => {
    dispararAutosave();
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [dispararAutosave]);

  function restaurarRascunho() {
    const rascunho = lerRascunho(RASCUNHO_KEY);
    if (!rascunho) return;
    setAno(rascunho.ano);
    setTrimestre(rascunho.trimestre);
    setDescricao(rascunho.descricao);
    setEmpresaId(rascunho.empresaId);
    setEntrada(rascunho.entrada);
    setModoMensal(rascunho.modoMensal);
    setMeses(rascunho.meses);
    setIrpjMesesAnt(rascunho.irpjMesesAnt);
    setCsllMesesAnt(rascunho.csllMesesAnt);
    setIrpjAntMes1(rascunho.irpjAntMes1 ?? 0);
    setIrpjAntMes2(rascunho.irpjAntMes2 ?? 0);
    setCsllAntMes1(rascunho.csllAntMes1 ?? 0);
    setCsllAntMes2(rascunho.csllAntMes2 ?? 0);
    setTemRascunho(false);
    toast.success('Rascunho restaurado.');
  }

  function descartarRascunho() {
    limparRascunho(RASCUNHO_KEY);
    setTemRascunho(false);
  }

  const isEmpresaMensal = empresaSel?.modalidadeRecolhimento === 'mensal';

  // Quando modo mensal ativo, irpjMesesAnt = soma das antecipações individuais
  const irpjMesesAntEfetivo = modoMensal ? (irpjAntMes1 + irpjAntMes2) : irpjMesesAnt;
  const csllMesesAntEfetivo = modoMensal ? (csllAntMes1 + csllAntMes2) : csllMesesAnt;

  const entradaEfetiva: EntradaCalculo = useMemo(() => {
    if (!modoMensal) return entrada;
    return {
      receita16:      sumMeses(meses, 'receita16'),
      receita8:       sumMeses(meses, 'receita8'),
      receita16p:     sumMeses(meses, 'receita16p'),
      receita32:      sumMeses(meses, 'receita32'),
      outrasReceitas: sumMeses(meses, 'outrasReceitas'),
      // No modo mensal, IRRF e CSLL retida são por mês — soma os 3 para o fechamento
      irrf:           sumMeses(meses, 'irrf'),
      csllRetida:     sumMeses(meses, 'csllRetida'),
      irpjMesesAnteriores: irpjMesesAntEfetivo,
      csllMesesAnteriores: csllMesesAntEfetivo,
    };
  }, [modoMensal, meses, entrada, irpjMesesAntEfetivo, csllMesesAntEfetivo]);

  const resultado = useMemo(
    () => calcular(entradaEfetiva, {
      aplicarMajoracaoCsll: !(ano === 2026 && trimestre === 1),
      // Fechamento trimestral: sempre usa limite de 60.000
      limiteAdicionalIr: LIMITE_ADICIONAL_TRIMESTRAL,
    }),
    [entradaEfetiva, ano, trimestre]
  );

  /**
   * Resultado do mês ativo isolado — usado para exibir o cálculo de antecipação
   * dos meses 1 e 2.
   * Regras para antecipação mensal:
   *   - SEM majoração (excedente = 0): a majoração é regra trimestral
   *   - Limite adicional IR: R$ 20.000 (não R$ 60.000 do trimestre)
   *   - IRRF e CSLL retida do próprio mês
   * No mês 3 (fechamento) usa o resultado trimestral completo.
   */
  const resultadoMesAtivo = useMemo(() => {
    if (!modoMensal || mesAtivo === 2) return null; // mês 3 = fechamento trimestral
    const entradaMes: EntradaCalculo = {
      receita16:      meses[mesAtivo].receita16,
      receita8:       meses[mesAtivo].receita8,
      receita16p:     meses[mesAtivo].receita16p,
      receita32:      meses[mesAtivo].receita32,
      outrasReceitas: meses[mesAtivo].outrasReceitas,
      irrf:           meses[mesAtivo].irrf      ?? 0,
      csllRetida:     meses[mesAtivo].csllRetida ?? 0,
    };
    return calcular(entradaMes, {
      aplicarMajoracaoCsll: false,          // sem majoração CSLL no mês isolado
      aplicarMajoracaoIrpj: false,          // sem majoração IRPJ no mês isolado
      limiteAdicionalIr: LIMITE_ADICIONAL_MENSAL, // R$ 20.000 por mês
    });
  }, [modoMensal, mesAtivo, meses, ano, trimestre]);

  function set(field: keyof EntradaCalculo) {
    return (v: number) => setEntrada(prev => ({ ...prev, [field]: v }));
  }

  function setMes(mi: number, field: keyof MesEntrada, value: number) {
    setMeses(prev => {
      const next = [...prev] as typeof prev;
      next[mi] = { ...next[mi], [field]: value };
      return next;
    });
  }

  function toggleModoMensal() {
    if (modoMensal) {
      // Saindo do modo mensal: consolida receitas e deduções dos 3 meses no estado único
      setEntrada(prev => ({
        ...prev,
        receita16:      sumMeses(meses, 'receita16'),
        receita8:       sumMeses(meses, 'receita8'),
        receita16p:     sumMeses(meses, 'receita16p'),
        receita32:      sumMeses(meses, 'receita32'),
        outrasReceitas: sumMeses(meses, 'outrasReceitas'),
        irrf:           sumMeses(meses, 'irrf'),
        csllRetida:     sumMeses(meses, 'csllRetida'),
      }));
    } else {
      // Entrando no modo mensal: distribui IRRF/CSLL retida do estado único para o mês 3 (fechamento)
      setMeses([
        { ...mesPadrao },
        { ...mesPadrao },
        { ...mesPadrao, irrf: entrada.irrf ?? 0, csllRetida: entrada.csllRetida ?? 0 },
      ]);
      setMesAtivo(0);
    }
    setModoMensal(v => !v);
  }

  /** Aplica as apurações anteriores encontradas como antecipações e restaura receitas nas abas */
  function aplicarRecuperacao() {
    let maxMesIdx = -1;
    setMeses(prev => {
      const next = [...prev] as typeof prev;
      for (const ap of apuracoesAnteriores) {
        if (ap.mesIdx === 0) {
          setIrpjAntMes1(ap.irpjARecolher);
          setCsllAntMes1(ap.csllARecolher);
          if (ap.receitasMes) next[0] = ap.receitasMes;
        } else if (ap.mesIdx === 1) {
          setIrpjAntMes2(ap.irpjARecolher);
          setCsllAntMes2(ap.csllARecolher);
          if (ap.receitasMes) next[1] = ap.receitasMes;
        }
        if (ap.mesIdx > maxMesIdx) maxMesIdx = ap.mesIdx;
      }
      return next;
    });
    // Navega automaticamente para o próximo mês a preencher
    setMesAtivo(Math.min(maxMesIdx + 1, 2));
    setModalRecuperacao(false);
    toast.success('Antecipações e receitas anteriores importadas com sucesso.');
  }

  async function handleSalvar() {
    setSalvando(true);
    try {
      // mesReferencia: 1=antecipação mês 1, 2=antecipação mês 2, 3=fechamento trimestral
      const mesReferencia = modoMensal && mesAtivo < 2 ? mesAtivo + 1 : 3;
      const isAntecipacao = mesReferencia === 1 || mesReferencia === 2;

      let payload: Record<string, unknown>;

      if (isAntecipacao) {
        // Antecipação mensal: envia apenas as receitas do mês ativo
        const entMes = meses[mesAtivo];
        payload = {
          ano, trimestre, descricao,
          empresaId: empresaId || undefined,
          mesReferencia,
          modalidadeRecolhimento: 'mensal',
          receita16:      entMes.receita16,
          receita8:       entMes.receita8,
          receita16p:     entMes.receita16p,
          receita32:      entMes.receita32,
          outrasReceitas: entMes.outrasReceitas,
          irrf:           entMes.irrf      ?? 0,
          csllRetida:     entMes.csllRetida ?? 0,
          irpjMesesAnteriores: 0,
          csllMesesAnteriores: 0,
          receitasMensais: meses, // armazena tudo para referência
        };
      } else {
        // Fechamento trimestral: soma os 3 meses e aplica antecipações
        payload = {
          ano, trimestre, descricao,
          empresaId: empresaId || undefined,
          mesReferencia: 3,
          modalidadeRecolhimento: empresaSel?.modalidadeRecolhimento ?? (modoMensal ? 'mensal' : 'trimestral'),
          irpjAntecipacaoMes1: modoMensal ? irpjAntMes1 : undefined,
          irpjAntecipacaoMes2: modoMensal ? irpjAntMes2 : undefined,
          csllAntecipacaoMes1: modoMensal ? csllAntMes1 : undefined,
          csllAntecipacaoMes2: modoMensal ? csllAntMes2 : undefined,
          receitasMensais: modoMensal ? meses : undefined,
          ...entradaEfetiva,
        };
      }

      if (isEdicao) {
        await api.put(`/calculos/${id}`, payload);
        limparRascunho(RASCUNHO_KEY);
        toast.success('Cálculo atualizado.');
        navigate(`/calculos/${id}`);
      } else {
        const { data } = await api.post('/calculos', payload);
        limparRascunho(RASCUNHO_KEY);
        toast.success(isAntecipacao
          ? `Antecipação de ${MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[mesAtivo]} salva com sucesso.`
          : 'Fechamento trimestral salvo.');
        navigate(`/calculos/${data.id}`);
      }
    } catch (err: unknown) {
      const resp = (err as { response?: { data?: { erro?: string; existente?: { id: number; descricao: string } } } })?.response?.data;
      if (resp?.existente?.id) {
        setPeriodoConflito({ id: resp.existente.id, descricao: resp.existente.descricao || '' });
      }
      toast.error(resp?.erro ?? 'Erro ao salvar cálculo.');
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="p-6 max-w-[1360px]">

      {/* ── Modal de recuperação de apurações anteriores ─────────────── */}
      {modalRecuperacao && apuracoesAnteriores.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-2xl border border-[#D8DDE8] w-full max-w-md mx-4 overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 flex items-center gap-3" style={{ background: '#0D47A1' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" className="shrink-0">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <div>
                <p className="text-white font-bold text-[13px]">Apurações anteriores encontradas</p>
                <p className="text-white/70 text-[11px]">Deseja usar como antecipações do trimestre?</p>
              </div>
            </div>

            {/* Corpo */}
            <div className="px-5 py-4 space-y-3">
              <p className="text-[12px] text-[#4A5468] leading-relaxed">
                O sistema encontrou apurações mensais anteriores para esta empresa neste trimestre.
                Você pode importá-las automaticamente como antecipações já pagas, para calcular a guia residual do 3º mês.
              </p>

              {/* Tabela de apurações encontradas */}
              <div className="rounded border border-[#D8DDE8] overflow-hidden">
                <div className="px-3 py-1.5 bg-[#EEF2F8]">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#4A5468]">Apurações encontradas</span>
                </div>
                {apuracoesAnteriores.map((ap, i) => (
                  <div key={i} className={`px-3 py-2.5 ${i > 0 ? 'border-t border-[#F0F3F8]' : ''}`}>
                    <p className="text-[11.5px] font-semibold text-[#1A1F2E] mb-1">{ap.mes} — {ap.descricao}</p>
                    <div className="flex gap-4 text-[11px]">
                      <span className="text-[#4A5468]">IRPJ: <strong className="text-[#0D47A1]">{brl(ap.irpjARecolher)}</strong></span>
                      <span className="text-[#4A5468]">CSLL: <strong className="text-[#0D47A1]">{brl(ap.csllARecolher)}</strong></span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Aviso sobre majoração */}
              <div className="rounded bg-[#FEF3C7] border border-[#FCD34D] px-3 py-2 flex gap-2">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
                <span className="text-[11px] text-[#92400E] leading-snug">
                  Esses valores foram calculados <strong>sem majoração</strong> (regra trimestral). A majoração será apurada no fechamento do trimestre.
                </span>
              </div>
            </div>

            {/* Botões */}
            <div className="px-5 pb-4 flex gap-2 justify-end">
              <button
                onClick={() => setModalRecuperacao(false)}
                className="btn-secondary btn-sm"
              >
                Preencher manualmente
              </button>
              <button
                onClick={aplicarRecuperacao}
                className="btn-primary btn-sm"
              >
                ✓ Importar antecipações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">{isEdicao ? 'Editar Cálculo' : 'Novo Cálculo'}</h1>
          <p className="page-subtitle">Lucro Presumido — IRPJ e CSLL com Majoração</p>
        </div>
        <button className="btn-secondary" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      {/* ── Banner de rascunho disponível ──────────────────────────── */}
      {temRascunho && (
        <div className="alert-warning mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="text-[12px]">
              <strong>Rascunho encontrado.</strong> Você tem dados não salvos de uma sessão anterior.
            </span>
          </div>
          <div className="flex gap-2 shrink-0">
            <button onClick={restaurarRascunho} className="btn-secondary btn-sm">Restaurar</button>
            <button onClick={descartarRascunho} className="btn-ghost btn-sm text-[#B45309]">Descartar</button>
          </div>
        </div>
      )}

      {/* ── Alerta período já existente ────────────────────────────────── */}
      {periodoConflito && !isEdicao && (
        <div className="alert-warning mb-5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <span className="text-[12px]">
              <strong>Período já possui cálculo:</strong>{' '}
              {periodoConflito.descricao || `${TRIMESTRES[trimestre]}/${ano}`}.
              {' '}Salvar criará um duplicado ou use o botão para abrir o existente.
            </span>
          </div>
          <button
            onClick={() => navigate(`/calculos/${periodoConflito.id}`)}
            className="btn-secondary btn-sm shrink-0"
          >
            Ver cálculo
          </button>
        </div>
      )}

      {/* ── Alerta 1T/2026 ─────────────────────────────────────────────── */}
      {alerta1T2026 && (
        <div className="alert-info mb-5">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <div>
            <strong>1º Trimestre / 2026 — Regra de Transição MP 1.262/2024 (QDMTT/BEPS):</strong>
            {' '}No primeiro trimestre de 2026 (jan–mar/2026),{' '}
            <strong>a CSLL majorada (QDMTT) não é exigível</strong>.
            Apenas o IRPJ pode ter incidência do adicional de majoração neste período.
            A CSLL majorada passa a ser exigida a partir do 2º trimestre de 2026 (abr/2026 em diante).
            {' '}<span className="opacity-70">Base: MP 1.262/2024 · IN RFB 2.228/2024 · implementação faseada do Pilar 2 OCDE.</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-5">

        {/* ── Coluna esquerda ──────────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Identificação */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Identificação</span>
            </div>
            <div className="space-y-3">

              {/* Busca inteligente de empresa */}
              <div className="form-group">
                <label className="label">Empresa</label>
                <EmpresaBusca
                  value={empresaId}
                  empresas={empresas as any}
                  onChange={(id, emp) => {
                    setEmpresaId(id);
                    setEmpresaSel(emp);
                    if (emp && !descricao) setDescricao(emp.razaoSocial);
                    // Ativa modo mensal automaticamente se empresa for de estimativa mensal
                    if (emp?.modalidadeRecolhimento === 'mensal' && !modoMensal) {
                      setModoMensal(true);
                      setMeses([{ ...mesPadrao }, { ...mesPadrao }, { ...mesPadrao }]);
                      setMesAtivo(0);
                    }
                  }}
                />
                {/* Indicador de modalidade de recolhimento */}
                {empresaSel && (
                  <div className={`mt-1.5 flex items-center gap-1.5 text-[11px] font-medium px-2 py-1 rounded ${
                    empresaSel.modalidadeRecolhimento === 'mensal'
                      ? 'bg-[#E8EFF8] text-[#0D47A1]'
                      : 'bg-[#F2F4F8] text-[#4A5468]'
                  }`}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <rect x="3" y="4" width="18" height="18" rx="2"/>
                      <line x1="16" y1="2" x2="16" y2="6"/>
                      <line x1="8" y1="2" x2="8" y2="6"/>
                      <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>
                      Recolhimento IRPJ/CSLL:{' '}
                      <strong>
                        {empresaSel.modalidadeRecolhimento === 'mensal'
                          ? 'Estimativa mensal / antecipações mensais'
                          : 'Trimestral'}
                      </strong>
                    </span>
                  </div>
                )}
              </div>

              {/* Período */}
              <div className="grid grid-cols-2 gap-2">
                <div className="form-group">
                  <label className="label">Ano</label>
                  <select value={ano} onChange={e => setAno(Number(e.target.value))} className="input">
                    {anos.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="label">Trimestre</label>
                  <select value={trimestre} onChange={e => setTrimestre(Number(e.target.value))} className="input">
                    {[1,2,3,4].map(t => (
                      <option key={t} value={t}>{TRIMESTRES[t]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Label de período */}
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-[#8A93A6]">{periodoRules.periodoLabel}</span>
                {alerta1T2026 && (
                  <span className="badge-warning">⚠ CSLL Majorada N/A</span>
                )}
              </div>

              <div className="form-group">
                <label className="label">Descrição</label>
                <input
                  type="text"
                  value={descricao}
                  onChange={e => setDescricao(e.target.value)}
                  className="input"
                  placeholder="Identificação do cálculo"
                />
              </div>
            </div>
          </div>

          {/* Receitas */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Receitas do Trimestre</span>
              <button
                type="button"
                onClick={toggleModoMensal}
                className={`text-[11px] font-semibold px-2 py-0.5 rounded transition-colors ${
                  modoMensal
                    ? 'bg-[#0D47A1] text-white'
                    : 'bg-[#EEF2F8] text-[#4A5468] hover:bg-[#D8DDE8]'
                }`}
              >
                {modoMensal ? '✓ Por mês' : 'Por mês'}
              </button>
            </div>

            {/* Aviso para empresa com estimativa mensal */}
            {empresaSel?.modalidadeRecolhimento === 'mensal' && (
              <div className="alert-info mb-3 text-[11.5px]">
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span>
                  Empresa configurada para <strong>estimativa mensal</strong>. Informe as receitas por mês e os pagamentos/antecipações já realizados para apurar a guia residual do 3º mês.
                </span>
              </div>
            )}

            {modoMensal ? (
              <div className="space-y-3">
                {/* Abas de mês */}
                <div className="flex rounded border border-[#D8DDE8] overflow-hidden">
                  {MESES_TRI[trimestre as keyof typeof MESES_TRI].map((m, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setMesAtivo(i)}
                      className={`flex-1 py-1.5 text-[11.5px] font-semibold transition-colors ${
                        mesAtivo === i
                          ? 'bg-[#0D47A1] text-white'
                          : 'bg-white text-[#4A5468] hover:bg-[#F2F4F8]'
                      }`}
                    >
                      {m.slice(0, 3)}
                    </button>
                  ))}
                </div>

                {/* Campos do mês ativo — key={mesAtivo} força remontagem ao trocar de mês */}
                <div key={mesAtivo} className="space-y-2.5">
                  <CampoMonetario label="Presunção 1,6%" value={meses[mesAtivo].receita16}      onChange={v => setMes(mesAtivo, 'receita16', v)} />
                  <CampoMonetario label="Presunção 8%"   value={meses[mesAtivo].receita8}       onChange={v => setMes(mesAtivo, 'receita8', v)} />
                  <CampoMonetario label="Presunção 16%"  value={meses[mesAtivo].receita16p}     onChange={v => setMes(mesAtivo, 'receita16p', v)} />
                  <CampoMonetario label="Presunção 32%"  value={meses[mesAtivo].receita32}      onChange={v => setMes(mesAtivo, 'receita32', v)} />
                  <CampoMonetario label="Outras receitas" value={meses[mesAtivo].outrasReceitas} onChange={v => setMes(mesAtivo, 'outrasReceitas', v)} />
                </div>

                {/* Resumo trimestral */}
                <div className="rounded bg-[#EEF2F8] px-3 py-2.5 text-[11.5px] space-y-1">
                  <p className="text-[10.5px] font-bold uppercase tracking-wider text-[#8A93A6] mb-1.5">Total Trimestral</p>
                  {([['1,6%', 'receita16'], ['8%', 'receita8'], ['16%', 'receita16p'], ['32%', 'receita32']] as const).map(([lbl, k]) => {
                    const total = meses[0][k] + meses[1][k] + meses[2][k];
                    return total > 0 ? (
                      <div key={k} className="flex justify-between text-[#4A5468]">
                        <span>{lbl}</span>
                        <span className="mono font-medium">{brl(total)}</span>
                      </div>
                    ) : null;
                  })}
                  <div className="flex justify-between font-bold text-[#0D47A1] border-t border-[#D8DDE8] pt-1.5 mt-0.5">
                    <span>Receita Total</span>
                    <span className="mono">{brl(entradaEfetiva.receita16 + entradaEfetiva.receita8 + entradaEfetiva.receita16p + entradaEfetiva.receita32)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <CampoMonetario label="Receitas — presunção 1,6%" value={entrada.receita16}      onChange={set('receita16')}      hint="Revenda de combustíveis" />
                <CampoMonetario label="Receitas — presunção 8%"   value={entrada.receita8}       onChange={set('receita8')}       hint="Comércio e indústria" />
                <CampoMonetario label="Receitas — presunção 16%"  value={entrada.receita16p}     onChange={set('receita16p')}     hint="Transporte de passageiros" />
                <CampoMonetario label="Receitas — presunção 32%"  value={entrada.receita32}      onChange={set('receita32')}      hint="Serviços em geral" />
                <CampoMonetario label="Outras receitas"            value={entrada.outrasReceitas} onChange={set('outrasReceitas')} hint="Ganhos de capital, etc." />
              </div>
            )}
          </div>

          {/* Deduções */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Deduções</span>
            </div>
            <div className="space-y-3">

              {/* No modo mensal: IRRF e CSLL retida são por mês (ficam nos campos do mês ativo) */}
              {!modoMensal && (
                <>
                  <CampoMonetario label="IRRF a deduzir"       value={entrada.irrf ?? 0}       onChange={set('irrf')} />
                  <CampoMonetario label="CSLL Retida na Fonte" value={entrada.csllRetida ?? 0} onChange={set('csllRetida')} />
                </>
              )}

              {modoMensal && (
                <>
                  {/* IRRF e CSLL retida por mês */}
                  <div key={mesAtivo} className="rounded bg-[#EEF2F8] px-3 py-2.5 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[#0D47A1] mb-1">
                      Deduções — {MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[mesAtivo] ?? `Mês ${mesAtivo + 1}`}
                    </p>
                    <CampoMonetario
                      label="IRRF a deduzir"
                      value={meses[mesAtivo].irrf ?? 0}
                      onChange={v => setMes(mesAtivo, 'irrf', v)}
                      hint="Imposto Retido na Fonte deste mês"
                    />
                    <CampoMonetario
                      label="CSLL Retida na Fonte"
                      value={meses[mesAtivo].csllRetida ?? 0}
                      onChange={v => setMes(mesAtivo, 'csllRetida', v)}
                      hint="CSLL retida neste mês"
                    />
                    {/* Totais acumulados */}
                    {(sumMeses(meses, 'irrf') > 0 || sumMeses(meses, 'csllRetida') > 0) && (
                      <div className="border-t border-[#D8DDE8] pt-1.5 space-y-1">
                        {sumMeses(meses, 'irrf') > 0 && (
                          <div className="flex justify-between text-[11px] text-[#4A5468]">
                            <span>IRRF total trimestre</span>
                            <span className="mono font-semibold text-[#0D47A1]">{brl(sumMeses(meses, 'irrf'))}</span>
                          </div>
                        )}
                        {sumMeses(meses, 'csllRetida') > 0 && (
                          <div className="flex justify-between text-[11px] text-[#4A5468]">
                            <span>CSLL retida total trimestre</span>
                            <span className="mono font-semibold text-[#0D47A1]">{brl(sumMeses(meses, 'csllRetida'))}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* Pagamentos mensais anteriores — só no fechamento trimestral (aba 3) */}
              {modoMensal && mesAtivo === 2 && (
                <>
                  <div className="divider" />
                  <div className="flex items-center gap-1.5 mb-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#0D47A1]">
                      <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#0D47A1]">
                      Pagamentos / Antecipações Mensais
                    </span>
                    {/* Botão para reabrir modal de recuperação */}
                    {apuracoesAnteriores.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setModalRecuperacao(true)}
                        className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded bg-[#0D47A1] text-white hover:bg-[#1565C0] transition-colors"
                        title="Importar valores das apurações anteriores"
                      >
                        ↑ Importar apurações
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-[#8A93A6] -mt-1 mb-1">
                    Valores de IRPJ e CSLL já recolhidos nos meses anteriores do trimestre. O sistema calculará o residual da guia do 3º mês.
                  </p>
                  {/* Aviso: antecipações mensais NÃO incluem majoração */}
                  <div className="rounded bg-[#FEF3C7] border border-[#FCD34D] px-2.5 py-2 flex gap-2 mb-1">
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="shrink-0 mt-0.5">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <span className="text-[11px] text-[#92400E] leading-snug">
                      <strong>Antecipações dos meses 1 e 2 são calculadas SEM majoração.</strong>{' '}
                      A majoração de 10% no percentual de presunção é uma regra <strong>trimestral</strong> — só se verifica se a receita do trimestre completo ultrapassar R$ 1.250.000. Nos meses 1 e 2, o imposto é calculado sobre a receita do mês isolado, sem aplicar o acréscimo. A majoração é apurada apenas no fechamento do trimestre (3º mês).
                    </span>
                  </div>

                  {isEmpresaMensal || modoMensal ? (
                    /* Modo mensal ativo: campos separados por mês (Jan/Fev ou equivalente) */
                    <>
                      {/* Aviso para cálculo antigo sem detalhamento */}
                      {edicaoMensalSemDetalhe && (
                        <div className="alert-warning text-[11px] mb-1">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                            <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                          </svg>
                          <span>Detalhamento mensal não disponível para este cálculo antigo. Os valores consolidados foram restaurados. Preencha os campos abaixo para atualizar.</span>
                        </div>
                      )}
                      {/* IRPJ por mês */}
                      <div className="rounded bg-[#EEF2F8] px-3 py-2.5 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#0D47A1] mb-1">IRPJ — DARF 2089</p>
                        <CampoMonetario
                          label={`IRPJ pago em ${MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[0] ?? 'Mês 1'}`}
                          value={irpjAntMes1}
                          onChange={setIrpjAntMes1}
                          hint="1º mês do trimestre"
                        />
                        <CampoMonetario
                          label={`IRPJ pago em ${MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[1] ?? 'Mês 2'}`}
                          value={irpjAntMes2}
                          onChange={setIrpjAntMes2}
                          hint="2º mês do trimestre"
                        />
                        <div className="flex justify-between text-[11px] font-semibold text-[#0D47A1] border-t border-[#D8DDE8] pt-1.5 mt-0.5">
                          <span>Total antecipado IRPJ</span>
                          <span className="mono">{brl(irpjAntMes1 + irpjAntMes2)}</span>
                        </div>
                      </div>

                      {/* CSLL por mês */}
                      <div className="rounded bg-[#EEF2F8] px-3 py-2.5 space-y-2">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#112240] mb-1">CSLL — DARF 2372</p>
                        <CampoMonetario
                          label={`CSLL paga em ${MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[0] ?? 'Mês 1'}`}
                          value={csllAntMes1}
                          onChange={setCsllAntMes1}
                          hint="1º mês do trimestre"
                        />
                        <CampoMonetario
                          label={`CSLL paga em ${MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[1] ?? 'Mês 2'}`}
                          value={csllAntMes2}
                          onChange={setCsllAntMes2}
                          hint="2º mês do trimestre"
                        />
                        <div className="flex justify-between text-[11px] font-semibold text-[#112240] border-t border-[#D8DDE8] pt-1.5 mt-0.5">
                          <span>Total antecipado CSLL</span>
                          <span className="mono">{brl(csllAntMes1 + csllAntMes2)}</span>
                        </div>
                      </div>
                    </>
                  ) : (
                    /* Modo mensal genérico: campos consolidados */
                    <>
                      <CampoMonetario
                        label="IRPJ pago (meses anteriores)"
                        value={irpjMesesAnt}
                        onChange={setIrpjMesesAnt}
                        hint="Soma dos DARFs 2089 já enviados"
                      />
                      <CampoMonetario
                        label="CSLL paga (meses anteriores)"
                        value={csllMesesAnt}
                        onChange={setCsllMesesAnt}
                        hint="Soma dos DARFs 2372 já enviados"
                      />
                    </>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            onClick={handleSalvar}
            disabled={salvando}
            className="btn-primary btn-lg w-full"
          >
            {salvando ? 'Salvando...' : (() => {
              if (modoMensal && mesAtivo < 2) {
                const nomeMes = MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[mesAtivo] ?? `Mês ${mesAtivo + 1}`;
                return isEdicao ? `Atualizar Antecipação — ${nomeMes}` : `Salvar Antecipação — ${nomeMes}`;
              }
              if (modoMensal && mesAtivo === 2) {
                return isEdicao ? 'Atualizar Fechamento do Trimestre' : 'Salvar Fechamento do Trimestre';
              }
              return isEdicao ? 'Salvar Alterações' : 'Salvar Cálculo';
            })()}
          </button>

          {/* Indicador de autosave */}
          {autoSaveStatus !== 'idle' && (
            <p className="text-center text-[11px] text-[#8A93A6] -mt-1">
              {autoSaveStatus === 'saving' && '⏳ Salvando rascunho...'}
              {autoSaveStatus === 'saved'  && '✓ Rascunho salvo localmente'}
            </p>
          )}
        </div>

        {/* ── Coluna direita (resultado) ───────────────────────────────── */}
        <div className="space-y-4 min-w-0">

          {/* Seletor de visualização quando modo mensal ativo */}
          {modoMensal && (
            <div className="flex items-center gap-2 rounded border border-[#D8DDE8] overflow-hidden">
              {(MESES_TRI[trimestre as keyof typeof MESES_TRI] ?? []).map((m, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setMesAtivo(i)}
                  className={`flex-1 py-1.5 text-[11.5px] font-semibold transition-colors ${
                    mesAtivo === i
                      ? 'bg-[#0D47A1] text-white'
                      : 'bg-white text-[#4A5468] hover:bg-[#F2F4F8]'
                  }`}
                >
                  {i < 2 ? `${m.slice(0, 3)} (antecipação)` : `${m.slice(0, 3)} (fechamento)`}
                </button>
              ))}
            </div>
          )}

          {/* Aviso quando visualizando mês de antecipação */}
          {modoMensal && resultadoMesAtivo && (
            <div className="rounded bg-[#FEF3C7] border border-[#FCD34D] px-3 py-2 flex gap-2">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" className="shrink-0 mt-0.5">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <span className="text-[11.5px] text-[#92400E] leading-snug">
                <strong>Cálculo de antecipação — {MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[mesAtivo]}.</strong>{' '}
                Limite do adicional de IR: <strong>R$ 20.000</strong> (mês isolado, sem majoração).
                O fechamento trimestral com limite de R$ 60.000 e majoração aparece na aba <strong>{MESES_TRI[trimestre as keyof typeof MESES_TRI]?.[2]} (fechamento)</strong>.
              </span>
            </div>
          )}

          {/* KPIs — usa resultado do mês ativo ou trimestral */}
          {(() => {
            const res = resultadoMesAtivo ?? resultado;
            return (
              <div className="grid grid-cols-2 xl:grid-cols-3 gap-3">
                <KpiMini label="Receita Total"        value={brl(res.receitaTotal)} />
                <KpiMini label="Excedente Majorado"   value={brl(res.excedenteMajorado)} alert={res.houveExcedente} />
                <KpiMini label="Base Presumida IRPJ"  value={brl(res.basePresumidaIrpj)} color="text-[#0D47A1]" />
                <KpiMini label={res.temPagamentosMensais ? 'IRPJ — Guia do Mês' : 'IRPJ a Recolher'}
                  value={brl(res.temPagamentosMensais ? res.irpjResidual : res.irpjARecolher)}
                  color="text-[#0D47A1]" />
                <KpiMini label="Base Presumida CSLL"  value={brl(res.basePresumidaCsll)} color="text-[#0D47A1]" />
                <KpiMini label={res.temPagamentosMensais ? 'CSLL — Guia do Mês' : 'CSLL a Recolher'}
                  value={brl(res.temPagamentosMensais ? res.csllResidual : res.csllARecolher)}
                  color="text-[#0D47A1]" />
              </div>
            );
          })()}

          <TabelaCalculo resultado={resultadoMesAtivo ?? resultado} />
        </div>
      </div>
    </div>
  );
}

function KpiMini({ label, value, color, alert }: { label: string; value: string; color?: string; alert?: boolean }) {
  return (
    <div className={`kpi-card ${alert ? 'border-[#FECACA] bg-[#FEF2F2]' : ''}`}>
      <p className="kpi-label">{label}</p>
      <p className={`kpi-value ${color ?? (alert ? 'text-[#B91C1C]' : 'text-[#1A1F2E]')}`}>
        {value}
      </p>
    </div>
  );
}
