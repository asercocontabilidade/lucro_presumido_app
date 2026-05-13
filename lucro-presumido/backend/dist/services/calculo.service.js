"use strict";
/**
 * Serviço de cálculo do Lucro Presumido e IRPJ
 * Regras baseadas na planilha "Lucro presumido majoração.xlsx"
 *
 * Limite trimestral sem majoração: R$ 1.250.000,00
 * Adicional de IR: 10% sobre base que exceder R$ 20.000,00/mês (R$ 60.000,00/trimestre)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIMITE_ADICIONAL_IR = exports.LIMITE_ADICIONAL_TRIMESTRAL = exports.LIMITE_ADICIONAL_MENSAL = exports.LIMITE_SEM_MAJORACAO = void 0;
exports.calcularLucroPresumido = calcularLucroPresumido;
exports.LIMITE_SEM_MAJORACAO = 1250000;
exports.LIMITE_ADICIONAL_MENSAL = 20000; // por mês (antecipação)
exports.LIMITE_ADICIONAL_TRIMESTRAL = 60000; // por trimestre (fechamento)
/** @deprecated use LIMITE_ADICIONAL_TRIMESTRAL */
exports.LIMITE_ADICIONAL_IR = 60000;
function calcularFaixas(receitas, receitaTotal, excedente) {
    return receitas.map(({ descricao, aliquota, valor }) => {
        const proporcao = receitaTotal > 0 ? valor / receitaTotal : 0;
        const parcelaSemAcrescimo = excedente > 0
            ? proporcao * exports.LIMITE_SEM_MAJORACAO
            : valor;
        const parcelaComAcrescimo = excedente > 0 ? proporcao * excedente : 0;
        const aliquotaAcrescimo = aliquota * 1.1;
        const baseCalculo = parcelaSemAcrescimo * aliquota + parcelaComAcrescimo * aliquotaAcrescimo;
        return {
            descricao,
            aliquota,
            aliquotaAcrescimo,
            valor,
            proporcao,
            parcelaSemAcrescimo,
            parcelaComAcrescimo,
            baseCalculo,
        };
    });
}
function calcularLucroPresumido(entrada, opcoes = {}) {
    const { receita16, receita8, receita16p, receita32, outrasReceitas } = entrada;
    const irrf = entrada.irrf ?? 0;
    const csllRetida = entrada.csllRetida ?? 0;
    const irpjMesesAnteriores = entrada.irpjMesesAnteriores ?? 0;
    const csllMesesAnteriores = entrada.csllMesesAnteriores ?? 0;
    const aplicarMajoracaoCsll = opcoes.aplicarMajoracaoCsll ?? true;
    const aplicarMajoracaoIrpj = opcoes.aplicarMajoracaoIrpj ?? true;
    const limiteAdicional = opcoes.limiteAdicionalIr ?? exports.LIMITE_ADICIONAL_TRIMESTRAL;
    const receitaTotal = receita16 + receita8 + receita16p + receita32;
    const excedente = Math.max(0, receitaTotal - exports.LIMITE_SEM_MAJORACAO);
    const houveExcedente = excedente > 0;
    // Excedente para IRPJ: zero quando cálculo mensal (majoração é regra trimestral)
    const excedenteIrpj = aplicarMajoracaoIrpj ? excedente : 0;
    const faixasIrpj = [
        { descricao: 'Receitas sujeitas à alíquota de 1,6%', aliquota: 0.016, valor: receita16 },
        { descricao: 'Receitas sujeitas à alíquota de 8%', aliquota: 0.08, valor: receita8 },
        { descricao: 'Receitas sujeitas à alíquota de 16%', aliquota: 0.16, valor: receita16p },
        { descricao: 'Receitas sujeitas à alíquota de 32%', aliquota: 0.32, valor: receita32 },
    ];
    const linhasIrpj = calcularFaixas(faixasIrpj, receitaTotal, excedenteIrpj);
    const basePresumidaIrpj = linhasIrpj.reduce((s, l) => s + l.baseCalculo, 0) + outrasReceitas;
    const irpj15 = basePresumidaIrpj * 0.15;
    const adicionalIr10 = Math.max(0, basePresumidaIrpj - limiteAdicional) * 0.10;
    const irpjTotal = irpj15 + adicionalIr10;
    const irpjARecolher = Math.max(0, irpjTotal - irrf);
    const exedenteCsll = aplicarMajoracaoCsll ? excedente : 0;
    const csllMajoracaBloqueada = houveExcedente && !aplicarMajoracaoCsll;
    const faixasCsll = [
        { descricao: 'Receitas sujeitas à alíquota de 12% (CSLL)', aliquota: 0.12, valor: receita16 + receita8 + receita16p },
        { descricao: 'Receitas sujeitas à alíquota de 32% (CSLL)', aliquota: 0.32, valor: receita32 },
    ];
    const linhasCsll = calcularFaixas(faixasCsll, receitaTotal, exedenteCsll);
    const basePresumidaCsll = linhasCsll.reduce((s, l) => s + l.baseCalculo, 0) + outrasReceitas;
    const csll9 = basePresumidaCsll * 0.09;
    const csllARecolher = Math.max(0, csll9 - csllRetida);
    const irpjResidual = Math.max(0, irpjARecolher - irpjMesesAnteriores);
    const csllResidual = Math.max(0, csllARecolher - csllMesesAnteriores);
    const temPagamentosMensais = irpjMesesAnteriores > 0 || csllMesesAnteriores > 0;
    // Saldo pago a maior: quando antecipações excedem o valor apurado
    const irpjSaldoPagoMaior = Math.max(0, irpjMesesAnteriores - irpjARecolher);
    const csllSaldoPagoMaior = Math.max(0, csllMesesAnteriores - csllARecolher);
    return {
        receita16, receita8, receita16p, receita32, outrasReceitas,
        receitaTotal,
        // excedenteMajorado reflete apenas o excedente efetivamente aplicado no IRPJ
        excedenteMajorado: excedenteIrpj,
        houveExcedente: excedenteIrpj > 0,
        linhasIrpj, basePresumidaIrpj, irpj15, adicionalIr10, irpjTotal, irrf, irpjARecolher,
        linhasCsll, basePresumidaCsll, csll9, csllRetida, csllARecolher, csllMajoracaBloqueada,
        irpjMesesAnteriores, csllMesesAnteriores, irpjResidual, csllResidual, temPagamentosMensais,
        irpjSaldoPagoMaior, csllSaldoPagoMaior,
    };
}
