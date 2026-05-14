import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { calcularLucroPresumido, EntradaCalculo, OpcaoCalculo, LIMITE_ADICIONAL_MENSAL, LIMITE_ADICIONAL_TRIMESTRAL } from '../services/calculo.service';
import { gerarPdf } from '../services/pdf.service';
import { gerarExcel } from '../services/excel.service';

function opcoesPeriodo(ano: unknown, trimestre: unknown, modalidade?: string): OpcaoCalculo {
  const isMensalAntecipacao = modalidade === 'mensal_antecipacao';
  return {
    aplicarMajoracaoCsll: !(Number(ano) === 2026 && Number(trimestre) === 1),
    // Antecipação mensal: sem majoração (regra trimestral) e limite de 20k
    aplicarMajoracaoIrpj: !isMensalAntecipacao,
    limiteAdicionalIr: isMensalAntecipacao ? LIMITE_ADICIONAL_MENSAL : LIMITE_ADICIONAL_TRIMESTRAL,
  };
}

const prisma = new PrismaClient();

function parseEntrada(body: Record<string, unknown>): EntradaCalculo {
  return {
    receita16:            Number(body.receita16            ?? 0),
    receita8:             Number(body.receita8             ?? 0),
    receita16p:           Number(body.receita16p           ?? 0),
    receita32:            Number(body.receita32            ?? 0),
    outrasReceitas:       Number(body.outrasReceitas       ?? 0),
    irrf:                 Number(body.irrf                 ?? 0),
    csllRetida:           Number(body.csllRetida           ?? 0),
    irpjMesesAnteriores:  Number(body.irpjMesesAnteriores  ?? 0),
    csllMesesAnteriores:  Number(body.csllMesesAnteriores  ?? 0),
  };
}
// Deserializa detalheCalculo de string JSON para objeto
function parseCalculo(c: Record<string, unknown>) {
  if (c.detalheCalculo && typeof c.detalheCalculo === 'string') {
    try { c.detalheCalculo = JSON.parse(c.detalheCalculo); } catch { /* mantém string */ }
  }
  return c;
}

async function registrarLog(usuarioId: number, acao: string, entidadeId: number, detalhes?: object) {
  await prisma.logAuditoria.create({
    data: {
      acao, entidade: 'CalculoTrimestral', entidadeId,
      detalhes: detalhes ? JSON.stringify(detalhes) : null,
      usuarioId,
    },
  });
}

export async function listar(req: Request, res: Response) {
  const { ano, trimestre, empresaId, empresa, comMajoracao, page = '1', limit = '20' } = req.query;

  const where: Record<string, unknown> = {};
  if (ano) where.ano = Number(ano);
  if (trimestre) where.trimestre = Number(trimestre);
  if (empresaId) where.empresaId = String(empresaId);
  if (comMajoracao === 'true') where.excedenteMajorado = { gt: 0 };
  if (empresa) where.empresa = { razaoSocial: { contains: String(empresa) } };

  const skip = (Number(page) - 1) * Number(limit);
  const [total, calculos] = await Promise.all([
    prisma.calculoTrimestral.count({ where }),
    prisma.calculoTrimestral.findMany({
      where, skip, take: Number(limit),
      orderBy: [{ ano: 'desc' }, { trimestre: 'desc' }],
      include: {
        usuarioCriacao: { select: { nome: true } },
        usuarioAtualizacao: { select: { nome: true } },
        empresa: { select: { razaoSocial: true, cnpj: true } },
      },
    }),
  ]);

  return res.json({ total, pagina: Number(page), calculos });
}

export async function buscarPorId(req: Request, res: Response) {
  const id = Number(req.params.id);
  const [calculo, logAlteracoes] = await Promise.all([
    prisma.calculoTrimestral.findUnique({
      where: { id },
      include: {
        usuarioCriacao: { select: { nome: true } },
        usuarioAtualizacao: { select: { nome: true } },
      },
    }),
    prisma.logAuditoria.findMany({
      where: { entidade: 'CalculoTrimestral', entidadeId: id, acao: 'EDITAR' },
      orderBy: { criadoEm: 'asc' },
      select: { criadoEm: true, usuario: { select: { nome: true } } },
    }),
  ]);
  if (!calculo) return res.status(404).json({ erro: 'Cálculo não encontrado.' });
  return res.json({ ...parseCalculo(calculo as unknown as Record<string, unknown>), logAlteracoes });
}

export async function criar(req: Request, res: Response, next: NextFunction) {
  try {
    const { ano, trimestre, descricao, empresaId, irrf, csllRetida, irpjMesesAnteriores, csllMesesAnteriores, modalidadeRecolhimento, irpjAntecipacaoMes1, irpjAntecipacaoMes2, csllAntecipacaoMes1, csllAntecipacaoMes2, receitasMensais, ...body } = req.body;
    const entrada = parseEntrada({ ...body, irrf, csllRetida, irpjMesesAnteriores, csllMesesAnteriores });
    const resultado = calcularLucroPresumido(entrada, opcoesPeriodo(ano, trimestre));

    // Inclui modalidadeRecolhimento, antecipações e receitas mensais no detalheCalculo para rastreabilidade
    const detalheComModalidade = {
      ...resultado,
      modalidadeRecolhimento: modalidadeRecolhimento ?? 'trimestral',
      ...(irpjAntecipacaoMes1 !== undefined && { irpjAntecipacaoMes1: Number(irpjAntecipacaoMes1) }),
      ...(irpjAntecipacaoMes2 !== undefined && { irpjAntecipacaoMes2: Number(irpjAntecipacaoMes2) }),
      ...(csllAntecipacaoMes1 !== undefined && { csllAntecipacaoMes1: Number(csllAntecipacaoMes1) }),
      ...(csllAntecipacaoMes2 !== undefined && { csllAntecipacaoMes2: Number(csllAntecipacaoMes2) }),
      ...(receitasMensais !== undefined && { receitasMensais }),
    };

    const calculo = await prisma.calculoTrimestral.create({
      data: {
        ano: Number(ano), trimestre: Number(trimestre), descricao,
        empresaId: empresaId || null,
        receita16: resultado.receita16, receita8: resultado.receita8,
        receita16p: resultado.receita16p, receita32: resultado.receita32,
        outrasReceitas: resultado.outrasReceitas, receitaTotal: resultado.receitaTotal,
        excedenteMajorado: resultado.excedenteMajorado, basePresumidaIrpj: resultado.basePresumidaIrpj,
        irpj15: resultado.irpj15, adicionalIr10: resultado.adicionalIr10,
        irpjTotal: resultado.irpjTotal, irrf: resultado.irrf,
        irpjARecolher: resultado.irpjARecolher, basePresumidaCsll: resultado.basePresumidaCsll,
        csll9: resultado.csll9, csllRetida: resultado.csllRetida,
        csllARecolher: resultado.csllARecolher,
        detalheCalculo: JSON.stringify(detalheComModalidade),
        usuarioCriacaoId: req.usuario!.id,
      },
    });

    await registrarLog(req.usuario!.id, 'CRIAR', calculo.id);
    return res.status(201).json(calculo);
  } catch (err: unknown) {
    // Conflito de unicidade (ano+trimestre+empresa já existe) — retorna o id do existente
    const msg = err instanceof Error ? err.message : '';
    if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
      const { ano, trimestre, empresaId } = req.body;
      const existente = await prisma.calculoTrimestral.findFirst({
        where: { ano: Number(ano), trimestre: Number(trimestre), empresaId: empresaId || null },
        select: { id: true, ano: true, trimestre: true, descricao: true, criadoEm: true },
      });
      return res.status(409).json({
        erro: 'Já existe um cálculo para esta empresa neste trimestre/ano.',
        existente,
      });
    }
    return next(err);
  }
}

export async function atualizar(req: Request, res: Response, next: NextFunction) {
  try {
    const id = Number(req.params.id);
    const existente = await prisma.calculoTrimestral.findUnique({ where: { id } });
    if (!existente) return res.status(404).json({ erro: 'Cálculo não encontrado.' });

    const { ano, trimestre, descricao, empresaId, irrf, csllRetida, irpjMesesAnteriores, csllMesesAnteriores, modalidadeRecolhimento, irpjAntecipacaoMes1, irpjAntecipacaoMes2, csllAntecipacaoMes1, csllAntecipacaoMes2, receitasMensais, ...body } = req.body;
    const entrada = parseEntrada({ ...body, irrf, csllRetida, irpjMesesAnteriores, csllMesesAnteriores });
    const resultado = calcularLucroPresumido(entrada, opcoesPeriodo(ano, trimestre));

    // Inclui modalidadeRecolhimento, antecipações e receitas mensais no detalheCalculo para rastreabilidade
    const detalheComModalidade = {
      ...resultado,
      modalidadeRecolhimento: modalidadeRecolhimento ?? 'trimestral',
      ...(irpjAntecipacaoMes1 !== undefined && { irpjAntecipacaoMes1: Number(irpjAntecipacaoMes1) }),
      ...(irpjAntecipacaoMes2 !== undefined && { irpjAntecipacaoMes2: Number(irpjAntecipacaoMes2) }),
      ...(csllAntecipacaoMes1 !== undefined && { csllAntecipacaoMes1: Number(csllAntecipacaoMes1) }),
      ...(csllAntecipacaoMes2 !== undefined && { csllAntecipacaoMes2: Number(csllAntecipacaoMes2) }),
      ...(receitasMensais !== undefined && { receitasMensais }),
    };

    const calculo = await prisma.calculoTrimestral.update({
      where: { id },
      data: {
        ano: Number(ano), trimestre: Number(trimestre), descricao,
        empresaId: empresaId || null,
        receita16: resultado.receita16, receita8: resultado.receita8,
        receita16p: resultado.receita16p, receita32: resultado.receita32,
        outrasReceitas: resultado.outrasReceitas, receitaTotal: resultado.receitaTotal,
        excedenteMajorado: resultado.excedenteMajorado, basePresumidaIrpj: resultado.basePresumidaIrpj,
        irpj15: resultado.irpj15, adicionalIr10: resultado.adicionalIr10,
        irpjTotal: resultado.irpjTotal, irrf: resultado.irrf,
        irpjARecolher: resultado.irpjARecolher, basePresumidaCsll: resultado.basePresumidaCsll,
        csll9: resultado.csll9, csllRetida: resultado.csllRetida,
        csllARecolher: resultado.csllARecolher,
        detalheCalculo: JSON.stringify(detalheComModalidade),
        usuarioAtualizacaoId: req.usuario!.id,
      },
    });

    await registrarLog(req.usuario!.id, 'EDITAR', calculo.id);
    return res.json(calculo);
  } catch (err) {
    return next(err);
  }
}

export async function excluir(req: Request, res: Response) {
  const id = Number(req.params.id);
  const existente = await prisma.calculoTrimestral.findUnique({ where: { id } });
  if (!existente) return res.status(404).json({ erro: 'Cálculo não encontrado.' });

  await registrarLog(req.usuario!.id, 'EXCLUIR', id, { snapshot: existente });
  await prisma.calculoTrimestral.delete({ where: { id } });
  return res.status(204).send();
}

export async function duplicar(req: Request, res: Response) {
  const id = Number(req.params.id);
  const original = await prisma.calculoTrimestral.findUnique({ where: { id } });
  if (!original) return res.status(404).json({ erro: 'Cálculo não encontrado.' });

  let novoTrimestre = original.trimestre < 4 ? original.trimestre + 1 : 1;
  let novoAno = original.trimestre < 4 ? original.ano : original.ano + 1;

  for (let t = 0; t < 8; t++) {
    const existe = await prisma.calculoTrimestral.findFirst({
      where: { ano: novoAno, trimestre: novoTrimestre, empresaId: original.empresaId },
    });
    if (!existe) break;
    novoTrimestre = novoTrimestre < 4 ? novoTrimestre + 1 : 1;
    if (novoTrimestre === 1) novoAno++;
  }

  const { id: _, criadoEm, atualizadoEm, usuarioCriacaoId, usuarioAtualizacaoId, ...dados } = original;

  const copia = await prisma.calculoTrimestral.create({
    data: {
      ...dados,
      ano: novoAno, trimestre: novoTrimestre,
      descricao: `Cópia de ${original.descricao ?? `${original.trimestre}T${original.ano}`}`,
      usuarioCriacaoId: req.usuario!.id,
      usuarioAtualizacaoId: null,
    },
  });

  await registrarLog(req.usuario!.id, 'DUPLICAR', copia.id, { originalId: id });
  return res.status(201).json(copia);
}

export async function calcularPreview(req: Request, res: Response) {
  const { ano, trimestre, modalidade } = req.body;
  const entrada = parseEntrada(req.body);
  const resultado = calcularLucroPresumido(entrada, opcoesPeriodo(ano, trimestre, modalidade));
  return res.json(resultado);
}

const EXPORT_INCLUDE = {
  usuarioCriacao: { select: { nome: true } },
  empresa: { select: { razaoSocial: true, nomeFantasia: true, cnpj: true } },
};

export async function exportarPdf(req: Request, res: Response) {
  const id = Number(req.params.id);
  const calculo = await prisma.calculoTrimestral.findUnique({ where: { id }, include: EXPORT_INCLUDE });
  if (!calculo) return res.status(404).json({ erro: 'Cálculo não encontrado.' });

  await registrarLog(req.usuario!.id, 'EXPORTAR_PDF', id);

  // Buscar comparativo do exercicio (outros trimestres da mesma empresa/ano)
  const comparativoExercicio = calculo.empresaId
    ? await prisma.calculoTrimestral.findMany({
        where: { empresaId: calculo.empresaId, ano: calculo.ano },
        orderBy: { trimestre: 'asc' },
        select: { trimestre: true, receitaTotal: true, irpjARecolher: true, csllARecolher: true },
      })
    : [];

  const detalheObj = calculo.detalheCalculo ? JSON.parse(calculo.detalheCalculo) : {};
  const calculoComDetalhe = {
    ...calculo,
    detalheCalculo: detalheObj,
    receitasMensais: detalheObj?.receitasMensais,
    comparativoExercicio: comparativoExercicio.map(c => ({
      trimestre: c.trimestre,
      receitaTotal: Number(c.receitaTotal),
      irpjARecolher: Number(c.irpjARecolher),
      csllARecolher: Number(c.csllARecolher),
    })),
  };
  const buffer = await gerarPdf(calculoComDetalhe as Parameters<typeof gerarPdf>[0]);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="calculo-${calculo.ano}-T${calculo.trimestre}.pdf"`);
  return res.send(buffer);
}

export async function exportarExcel(req: Request, res: Response) {
  const id = Number(req.params.id);
  const calculo = await prisma.calculoTrimestral.findUnique({ where: { id }, include: EXPORT_INCLUDE });
  if (!calculo) return res.status(404).json({ erro: 'Cálculo não encontrado.' });

  await registrarLog(req.usuario!.id, 'EXPORTAR_EXCEL', id);
  const detalheObjXl = calculo.detalheCalculo ? JSON.parse(calculo.detalheCalculo) : {};
  const calculoComDetalhe = {
    ...calculo,
    detalheCalculo: detalheObjXl,
    receitasMensais: detalheObjXl?.receitasMensais,
  };
  const buffer = await gerarExcel(calculoComDetalhe as Parameters<typeof gerarExcel>[0]);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="calculo-${calculo.ano}-T${calculo.trimestre}.xlsx"`);
  return res.send(buffer);
}

export async function dashboard(req: Request, res: Response) {
  const [totalCalculos, calculos] = await Promise.all([
    prisma.calculoTrimestral.count(),
    prisma.calculoTrimestral.findMany({
      orderBy: [{ ano: 'asc' }, { trimestre: 'asc' }],
      select: { ano: true, trimestre: true, receitaTotal: true, basePresumidaIrpj: true, irpjTotal: true, excedenteMajorado: true },
    }),
  ]);

  return res.json({
    totalCalculos,
    receitaTotalAnalisada: calculos.reduce((s, c) => s + Number(c.receitaTotal), 0),
    totalIrpj: calculos.reduce((s, c) => s + Number(c.irpjTotal), 0),
    trimestresComMajoracao: calculos.filter(c => Number(c.excedenteMajorado) > 0).length,
    porTrimestre: calculos,
  });
}
