"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ALIQUOTA_COFINS_NAO_CUMULATIVA = exports.ALIQUOTA_PIS_NAO_CUMULATIVO = exports.ALIQUOTA_COFINS_CUMULATIVA = exports.ALIQUOTA_PIS_CUMULATIVO = void 0;
exports.calcularPisCofins = calcularPisCofins;
exports.calcularVencimento = calcularVencimento;
exports.salvarCalculo = salvarCalculo;
exports.listarCalculos = listarCalculos;
exports.buscarCalculoPorId = buscarCalculoPorId;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
exports.ALIQUOTA_PIS_CUMULATIVO = 0.0065;
exports.ALIQUOTA_COFINS_CUMULATIVA = 0.03;
exports.ALIQUOTA_PIS_NAO_CUMULATIVO = 0.0165;
exports.ALIQUOTA_COFINS_NAO_CUMULATIVA = 0.076;
function calcularPisCofins(entrada) {
    const exclusoes = entrada.exclusoesBase ?? 0;
    const baseCalculo = Math.max(0, entrada.receitaBruta - exclusoes);
    const aliquotaPis = entrada.regimePisCofins === 'cumulativo'
        ? exports.ALIQUOTA_PIS_CUMULATIVO
        : exports.ALIQUOTA_PIS_NAO_CUMULATIVO;
    const aliquotaCofins = entrada.regimePisCofins === 'cumulativo'
        ? exports.ALIQUOTA_COFINS_CUMULATIVA
        : exports.ALIQUOTA_COFINS_NAO_CUMULATIVA;
    const pisBruto = baseCalculo * aliquotaPis;
    const cofinsBruta = baseCalculo * aliquotaCofins;
    const creditosPis = entrada.creditosPis ?? 0;
    const creditosCofins = entrada.creditosCofins ?? 0;
    const pisARecolher = Math.max(0, pisBruto - creditosPis);
    const cofinsARecolher = Math.max(0, cofinsBruta - creditosCofins);
    // Vencimento: dia 25 do mês seguinte
    const dataVencimento = calcularVencimento(entrada.ano, entrada.mes);
    return {
        baseCalculo,
        aliquotaPis,
        pisBruto,
        creditosPis,
        pisARecolher,
        aliquotaCofins,
        cofinsBruta,
        creditosCofins,
        cofinsARecolher,
        totalARecolher: pisARecolher + cofinsARecolher,
        dataVencimento,
    };
}
function calcularVencimento(ano, mes) {
    // Dia 25 do mês seguinte; se fim de ano, janeiro do próximo ano
    let mesSeguinte = mes + 1;
    let anoVencimento = ano;
    if (mesSeguinte > 12) {
        mesSeguinte = 1;
        anoVencimento += 1;
    }
    const dt = new Date(anoVencimento, mesSeguinte - 1, 25);
    // Se cair no fim de semana, ajusta para sexta anterior
    const diaSemana = dt.getDay();
    if (diaSemana === 0)
        dt.setDate(dt.getDate() - 2); // domingo → sexta
    if (diaSemana === 6)
        dt.setDate(dt.getDate() - 1); // sábado → sexta
    return dt;
}
async function salvarCalculo(entrada, resultado) {
    return prisma.calculoPisCofins.create({
        data: {
            empresaId: entrada.empresaId,
            ano: entrada.ano,
            mes: entrada.mes,
            regimePisCofins: entrada.regimePisCofins,
            receitaBruta: entrada.receitaBruta,
            exclusoesBase: entrada.exclusoesBase ?? 0,
            baseCalculo: resultado.baseCalculo,
            aliquotaPis: resultado.aliquotaPis,
            pisBruto: resultado.pisBruto,
            creditosPis: resultado.creditosPis,
            pisARecolher: resultado.pisARecolher,
            aliquotaCofins: resultado.aliquotaCofins,
            cofinsBruta: resultado.cofinsBruta,
            creditosCofins: resultado.creditosCofins,
            cofinsARecolher: resultado.cofinsARecolher,
            usuarioCalculo: entrada.usuarioCalculo,
        },
    });
}
async function listarCalculos(empresaId, ano) {
    const where = {};
    if (empresaId)
        where.empresaId = empresaId;
    if (ano)
        where.ano = ano;
    return prisma.calculoPisCofins.findMany({
        where,
        orderBy: [{ ano: 'desc' }, { mes: 'desc' }],
        include: { empresa: { select: { razaoSocial: true, cnpj: true } } },
    });
}
async function buscarCalculoPorId(id) {
    return prisma.calculoPisCofins.findUnique({
        where: { id },
        include: { empresa: true },
    });
}
