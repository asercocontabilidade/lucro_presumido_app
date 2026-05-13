"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listarEmpresas = listarEmpresas;
exports.buscarEmpresaPorId = buscarEmpresaPorId;
exports.criarEmpresa = criarEmpresa;
exports.atualizarEmpresa = atualizarEmpresa;
exports.desativarEmpresa = desativarEmpresa;
exports.listarPercentuaisPresuncao = listarPercentuaisPresuncao;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function listarEmpresas(filtros = {}) {
    const { busca, regimeTributario, ativo = true, page = 1, limit = 50 } = filtros;
    const skip = (page - 1) * limit;
    const where = { ativo };
    if (busca) {
        where.OR = [
            { razaoSocial: { contains: busca } },
            { nomeFantasia: { contains: busca } },
            { cnpj: { contains: busca } },
        ];
    }
    if (regimeTributario)
        where.regimeTributario = regimeTributario;
    const [empresas, total] = await Promise.all([
        prisma.empresa.findMany({ where, skip, take: limit, orderBy: { razaoSocial: 'asc' } }),
        prisma.empresa.count({ where }),
    ]);
    return { empresas, total, page, limit };
}
async function buscarEmpresaPorId(id) {
    return prisma.empresa.findUnique({ where: { id } });
}
async function criarEmpresa(dados) {
    return prisma.empresa.create({ data: dados });
}
async function atualizarEmpresa(id, dados) {
    return prisma.empresa.update({ where: { id }, data: dados });
}
async function desativarEmpresa(id) {
    return prisma.empresa.update({ where: { id }, data: { ativo: false } });
}
async function listarPercentuaisPresuncao() {
    return prisma.percentualPresuncao.findMany({
        where: { ativo: true },
        orderBy: { descricaoAtividade: 'asc' },
    });
}
