"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listar = listar;
exports.criar = criar;
exports.atualizar = atualizar;
exports.excluir = excluir;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function listar(req, res) {
    const feedbacks = await prisma.feedback.findMany({
        orderBy: { criadoEm: 'desc' },
        include: { usuario: { select: { id: true, nome: true } } },
    });
    return res.json(feedbacks);
}
async function criar(req, res) {
    const { tipo, titulo, descricao } = req.body;
    if (!titulo || !descricao) {
        return res.status(400).json({ erro: 'Título e descrição são obrigatórios.' });
    }
    const feedback = await prisma.feedback.create({
        data: { tipo: tipo ?? 'melhoria', titulo, descricao, usuarioId: req.usuario.id },
        include: { usuario: { select: { id: true, nome: true } } },
    });
    return res.status(201).json(feedback);
}
async function atualizar(req, res) {
    const id = Number(req.params.id);
    const existente = await prisma.feedback.findUnique({ where: { id } });
    if (!existente)
        return res.status(404).json({ erro: 'Não encontrado.' });
    const isAdmin = req.usuario.perfil === 'ADMIN';
    const isDono = existente.usuarioId === req.usuario.id;
    if (!isAdmin && !isDono)
        return res.status(403).json({ erro: 'Sem permissão.' });
    const { tipo, titulo, descricao, status } = req.body;
    const data = {};
    if (tipo !== undefined)
        data.tipo = tipo;
    if (titulo !== undefined)
        data.titulo = titulo;
    if (descricao !== undefined)
        data.descricao = descricao;
    // apenas admin pode mudar status
    if (status !== undefined && isAdmin)
        data.status = status;
    const feedback = await prisma.feedback.update({
        where: { id }, data,
        include: { usuario: { select: { id: true, nome: true } } },
    });
    return res.json(feedback);
}
async function excluir(req, res) {
    const id = Number(req.params.id);
    const existente = await prisma.feedback.findUnique({ where: { id } });
    if (!existente)
        return res.status(404).json({ erro: 'Não encontrado.' });
    const isAdmin = req.usuario.perfil === 'ADMIN';
    const isDono = existente.usuarioId === req.usuario.id;
    if (!isAdmin && !isDono)
        return res.status(403).json({ erro: 'Sem permissão.' });
    await prisma.feedback.delete({ where: { id } });
    return res.status(204).send();
}
