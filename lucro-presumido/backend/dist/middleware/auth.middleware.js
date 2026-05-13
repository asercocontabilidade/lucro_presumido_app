"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.autenticar = autenticar;
exports.apenasAdmin = apenasAdmin;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
function autenticar(req, res, next) {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
        return res.status(401).json({ erro: 'Token não fornecido.' });
    }
    try {
        const token = header.split(' ')[1];
        const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        req.usuario = payload;
        next();
    }
    catch {
        return res.status(401).json({ erro: 'Token inválido ou expirado.' });
    }
}
function apenasAdmin(req, res, next) {
    if (req.usuario?.perfil !== 'ADMIN') {
        return res.status(403).json({ erro: 'Acesso restrito a administradores.' });
    }
    next();
}
