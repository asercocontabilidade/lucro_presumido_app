"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_controller_1 = require("../controllers/auth.controller");
const calculo = __importStar(require("../controllers/calculo.controller"));
const usuario = __importStar(require("../controllers/usuario.controller"));
const empresa = __importStar(require("../controllers/empresa.controller"));
const pisCofins = __importStar(require("../controllers/pisCofins.controller"));
const auth_middleware_1 = require("../middleware/auth.middleware");
const relatorioAnual_service_1 = require("../services/relatorioAnual.service");
const router = (0, express_1.Router)();
// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', auth_controller_1.login);
router.get('/auth/perfil', auth_middleware_1.autenticar, auth_controller_1.perfil);
router.put('/auth/senha', auth_middleware_1.autenticar, auth_controller_1.alterarSenha);
// ─── Relatório Anual ──────────────────────────────────────────────────────────
router.get('/relatorio-anual', auth_middleware_1.autenticar, async (req, res, next) => {
    try {
        const { empresaId, ano } = req.query;
        if (!ano)
            return res.status(400).json({ erro: 'Parâmetro "ano" é obrigatório.' });
        const anoNum = Number(ano);
        if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
            return res.status(400).json({ erro: 'Ano inválido.' });
        }
        const resultado = await (0, relatorioAnual_service_1.consolidarAnual)(empresaId ? String(empresaId) : null, anoNum);
        return res.json(resultado);
    }
    catch (err) {
        return next(err);
    }
});
// ─── Cálculos Majoração (fluxo original) ─────────────────────────────────────
router.get('/calculos', auth_middleware_1.autenticar, calculo.listar);
router.get('/calculos/dashboard', auth_middleware_1.autenticar, calculo.dashboard);
router.get('/calculos/:id', auth_middleware_1.autenticar, calculo.buscarPorId);
router.post('/calculos/preview', auth_middleware_1.autenticar, calculo.calcularPreview);
router.post('/calculos', auth_middleware_1.autenticar, calculo.criar);
router.put('/calculos/:id', auth_middleware_1.autenticar, calculo.atualizar);
router.delete('/calculos/:id', auth_middleware_1.autenticar, calculo.excluir);
router.post('/calculos/:id/duplicar', auth_middleware_1.autenticar, calculo.duplicar);
router.get('/calculos/:id/pdf', auth_middleware_1.autenticar, calculo.exportarPdf);
router.get('/calculos/:id/excel', auth_middleware_1.autenticar, calculo.exportarExcel);
// ─── Empresas ─────────────────────────────────────────────────────────────────
router.get('/empresas', auth_middleware_1.autenticar, empresa.listar);
router.get('/empresas/percentuais', auth_middleware_1.autenticar, empresa.listarPercentuais);
router.get('/empresas/:id', auth_middleware_1.autenticar, empresa.buscarPorId);
router.post('/empresas', auth_middleware_1.autenticar, empresa.criar);
router.put('/empresas/:id', auth_middleware_1.autenticar, empresa.atualizar);
router.delete('/empresas/:id', auth_middleware_1.autenticar, empresa.desativar);
// ─── PIS / COFINS ─────────────────────────────────────────────────────────────
router.get('/pis-cofins', auth_middleware_1.autenticar, pisCofins.listar);
router.get('/pis-cofins/vencimento', auth_middleware_1.autenticar, pisCofins.calcularVencimento);
router.get('/pis-cofins/:id', auth_middleware_1.autenticar, pisCofins.buscarPorId);
router.post('/pis-cofins/preview', auth_middleware_1.autenticar, pisCofins.calcularPreview);
router.post('/pis-cofins', auth_middleware_1.autenticar, pisCofins.salvar);
// ─── Usuários (admin) ─────────────────────────────────────────────────────────
router.get('/usuarios', auth_middleware_1.autenticar, auth_middleware_1.apenasAdmin, usuario.listar);
router.post('/usuarios', auth_middleware_1.autenticar, auth_middleware_1.apenasAdmin, usuario.criar);
router.put('/usuarios/:id', auth_middleware_1.autenticar, auth_middleware_1.apenasAdmin, usuario.atualizar);
router.put('/usuarios/:id/senha', auth_middleware_1.autenticar, auth_middleware_1.apenasAdmin, usuario.resetarSenha);
exports.default = router;
