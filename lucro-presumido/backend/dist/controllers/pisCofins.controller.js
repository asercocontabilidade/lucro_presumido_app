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
exports.calcularPreview = calcularPreview;
exports.salvar = salvar;
exports.listar = listar;
exports.buscarPorId = buscarPorId;
exports.calcularVencimento = calcularVencimento;
const pisCofinsService = __importStar(require("../services/pisCofins.service"));
async function calcularPreview(req, res) {
    try {
        const entrada = req.body;
        if (!entrada.ano || !entrada.mes || !entrada.regimePisCofins) {
            return res.status(400).json({ error: 'ano, mes e regimePisCofins são obrigatórios' });
        }
        const resultado = pisCofinsService.calcularPisCofins(entrada);
        res.json(resultado);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao calcular PIS/COFINS' });
    }
}
async function salvar(req, res) {
    try {
        const entrada = req.body;
        const resultado = pisCofinsService.calcularPisCofins(entrada);
        const registro = await pisCofinsService.salvarCalculo(entrada, resultado);
        res.status(201).json({ ...registro, resultado });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao salvar cálculo PIS/COFINS' });
    }
}
async function listar(req, res) {
    try {
        const { empresaId, ano } = req.query;
        const calculos = await pisCofinsService.listarCalculos(empresaId, ano ? Number(ano) : undefined);
        res.json(calculos);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao listar cálculos PIS/COFINS' });
    }
}
async function buscarPorId(req, res) {
    try {
        const calculo = await pisCofinsService.buscarCalculoPorId(req.params.id);
        if (!calculo)
            return res.status(404).json({ error: 'Cálculo não encontrado' });
        res.json(calculo);
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao buscar cálculo' });
    }
}
async function calcularVencimento(req, res) {
    try {
        const { ano, mes } = req.query;
        if (!ano || !mes)
            return res.status(400).json({ error: 'ano e mes são obrigatórios' });
        const data = pisCofinsService.calcularVencimento(Number(ano), Number(mes));
        res.json({ dataVencimento: data });
    }
    catch (err) {
        res.status(500).json({ error: 'Erro ao calcular vencimento' });
    }
}
