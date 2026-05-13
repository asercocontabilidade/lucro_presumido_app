import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface FiltrosEmpresa {
  busca?: string;
  regimeTributario?: string;
  ativo?: boolean;
  page?: number;
  limit?: number;
}

export async function listarEmpresas(filtros: FiltrosEmpresa = {}) {
  const { busca, regimeTributario, ativo = true, page = 1, limit = 50 } = filtros;
  const skip = (page - 1) * limit;

  const where: any = { ativo };
  if (busca) {
    where.OR = [
      { razaoSocial: { contains: busca } },
      { nomeFantasia: { contains: busca } },
      { cnpj: { contains: busca } },
    ];
  }
  if (regimeTributario) where.regimeTributario = regimeTributario;

  const [empresas, total] = await Promise.all([
    prisma.empresa.findMany({ where, skip, take: limit, orderBy: { razaoSocial: 'asc' } }),
    prisma.empresa.count({ where }),
  ]);

  return { empresas, total, page, limit };
}

export async function buscarEmpresaPorId(id: string) {
  return prisma.empresa.findUnique({ where: { id } });
}

export async function criarEmpresa(dados: any) {
  return prisma.empresa.create({ data: dados });
}

export async function atualizarEmpresa(id: string, dados: any) {
  return prisma.empresa.update({ where: { id }, data: dados });
}

export async function desativarEmpresa(id: string) {
  return prisma.empresa.update({ where: { id }, data: { ativo: false } });
}

export async function listarPercentuaisPresuncao() {
  return prisma.percentualPresuncao.findMany({
    where: { ativo: true },
    orderBy: { descricaoAtividade: 'asc' },
  });
}
