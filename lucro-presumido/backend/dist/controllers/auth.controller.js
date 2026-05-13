"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.login = login;
exports.perfil = perfil;
exports.alterarSenha = alterarSenha;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function login(req, res) {
    const { email, senha } = req.body;
    if (!email || !senha) {
        return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
    }
    const usuario = await prisma.usuario.findUnique({ where: { email } });
    if (!usuario || !usuario.ativo) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    const senhaValida = await bcryptjs_1.default.compare(senha, usuario.senhaHash);
    if (!senhaValida) {
        return res.status(401).json({ erro: 'Credenciais inválidas.' });
    }
    const token = jsonwebtoken_1.default.sign({ id: usuario.id, email: usuario.email, perfil: usuario.perfil }, process.env.JWT_SECRET, { expiresIn: '8h' });
    return res.json({
        token,
        usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    });
}
async function perfil(req, res) {
    const usuario = await prisma.usuario.findUnique({
        where: { id: req.usuario.id },
        select: { id: true, nome: true, email: true, perfil: true, criadoEm: true },
    });
    return res.json(usuario);
}
async function alterarSenha(req, res) {
    const { senhaAtual, novaSenha } = req.body;
    const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario.id } });
    if (!usuario)
        return res.status(404).json({ erro: 'Usuário não encontrado.' });
    const valida = await bcryptjs_1.default.compare(senhaAtual, usuario.senhaHash);
    if (!valida)
        return res.status(400).json({ erro: 'Senha atual incorreta.' });
    const senhaHash = await bcryptjs_1.default.hash(novaSenha, 10);
    await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash } });
    return res.json({ mensagem: 'Senha alterada com sucesso.' });
}
