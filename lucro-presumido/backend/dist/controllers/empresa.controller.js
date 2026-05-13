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
exports.listar = listar;
exports.buscarPorId = buscarPorId;
exports.criar = criar;
exports.atualizar = atualizar;
exports.desativar = desativar;
exports.listarPercentuais = listarPercentuais;
const empresaService = __importStar(require("../services/empresa.service"));
async function listar(req, res) {
    try {
        const { busca, regimeTributario, page, limit } = req.query;
        const resultado = await empresaService.listarEmpresas({
            busca: busca,
            regimeTributario: regimeTributario,
            page: page ? Number(page) : 1,
            limit: limit ? Number(limit) : 50,
        });
        res.json(resultado);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao listar empresas' });
    }
}
async function buscarPorId(req, res) {
    try {
        const empresa = await empresaService.buscarEmpresaPorId(req.params.id);
        if (!empresa)
            return res.status(404).json({ error: 'Empresa não encontrada' });
        res.json(empresa);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar empresa' });
    }
}
async function criar(req, res) {
    try {
        const empresa = await empresaService.criarEmpresa(req.body);
        res.status(201).json(empresa);
    }
    catch (err) {
        if (err.code === 'P2002') {
            return res.status(409).json({ error: 'CNPJ já cadastrado' });
        }
        res.status(500).json({ error: 'Erro ao criar empresa' });
    }
}
async function atualizar(req, res) {
    try {
        const empresa = await empresaService.atualizarEmpresa(req.params.id, req.body);
        res.json(empresa);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao atualizar empresa' });
    }
}
async function desativar(req, res) {
    try {
        await empresaService.desativarEmpresa(req.params.id);
        res.json({ ok: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao desativar empresa' });
    }
}
async function listarPercentuais(req, res) {
    try {
        const percentuais = await empresaService.listarPercentuaisPresuncao();
        res.json(percentuais);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao listar percentuais' });
    }
}
