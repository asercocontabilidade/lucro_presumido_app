"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarPdf = gerarPdf;
const pdfkit_1 = __importDefault(require("pdfkit"));
const fs_1 = require("fs");
const path_1 = require("path");
// ── Constantes fiscais ────────────────────────────────────────────────────────
const TRIMESTRES = ['', '1 Trimestre', '2 Trimestre', '3 Trimestre', '4 Trimestre'];
const TRIMESTRES_LABEL = ['', '1o Trimestre', '2o Trimestre', '3o Trimestre', '4o Trimestre'];
const LIMITE_MAJORACAO = 1250000;
const LIMITE_ADICIONAL = 60000;
const LIMITE_ADICIONAL_MENSAL_PDF = 20000;
const MESES_TRI_PDF = {
    1: ['Janeiro', 'Fevereiro', 'Marco'],
    2: ['Abril', 'Maio', 'Junho'],
    3: ['Julho', 'Agosto', 'Setembro'],
    4: ['Outubro', 'Novembro', 'Dezembro'],
};
// ── Dimensoes A4 paisagem ─────────────────────────────────────────────────────
const PAGE_W = 841.89;
const PAGE_H = 595.28;
const MARGIN = 36;
const PW = Math.round(PAGE_W - MARGIN * 2); // 770pt largura util
const L = MARGIN;
const FOOTER_H = 28;
const FOOTER_Y = Math.round(PAGE_H - FOOTER_H);
// ── Logo da Aserco ────────────────────────────────────────────────────────────
// Tenta carregar do mesmo diretorio da raiz do projeto
const LOGO_PATHS = [
    (0, path_1.resolve)(__dirname, '../../../LOGO.png'),
    (0, path_1.resolve)(__dirname, '../../../frontend/public/LOGO.png'),
    (0, path_1.resolve)(__dirname, '../../LOGO.png'),
];
const LOGO_PATH = LOGO_PATHS.find(p => (0, fs_1.existsSync)(p)) ?? null;
// ── Formatacao ────────────────────────────────────────────────────────────────
function brl(v) {
    return Number(v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
function pct(v) {
    return (v * 100).toFixed(4).replace(/\.?0+$/, '').replace('.', ',') + '%';
}
// Texto seguro para PDF: remove caracteres nao suportados pela Helvetica padrao
function safe(s) {
    return s
        .replace(/[⚠ℹ→←↑↓•·]/g, '-')
        .replace(/[^\x20-\x7E\xC0-\xFF]/g, '?');
}
// ── Paleta de cores ───────────────────────────────────────────────────────────
const C = {
    navy: '#0A1628',
    blue: '#0D47A1',
    blueM: '#1565C0',
    blueL: '#E8EFF8',
    gray: '#4A5468',
    grayL: '#F2F4F8',
    border: '#D8DDE8',
    white: '#FFFFFF',
    red: '#B91C1C',
    redL: '#FEE2E2',
    amber: '#B45309',
    amberL: '#FEF3C7',
    green: '#1B7A4E',
    greenL: '#E6F4ED',
    text: '#1A1F2E',
    muted: '#8A93A6',
    rowAlt: '#F7F9FC',
    totalBg: '#EEF2F8',
};
function gerarPdf(calculo) {
    return new Promise((resolve, reject) => {
        const doc = new pdfkit_1.default({ margin: MARGIN, size: 'A4', layout: 'landscape', bufferPages: true });
        const chunks = [];
        doc.on('data', (c) => chunks.push(c));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);
        // ── Extrair dados do detalheCalculo ──────────────────────────────────────
        const detalhe = calculo.detalheCalculo;
        const linhasIrpj = detalhe?.linhasIrpj ?? [];
        const linhasCsll = detalhe?.linhasCsll ?? [];
        const houveExcedente = Number(calculo.excedenteMajorado) > 0;
        const csllBloqueada = !!(detalhe?.csllMajoracaBloqueada);
        const irpjMesesAnt = Number(detalhe?.irpjMesesAnteriores ?? 0);
        const csllMesesAnt = Number(detalhe?.csllMesesAnteriores ?? 0);
        const temPagMensais = irpjMesesAnt > 0 || csllMesesAnt > 0;
        const irpjResidual = Math.max(0, Number(calculo.irpjARecolher) - irpjMesesAnt);
        const csllResidual = Math.max(0, Number(calculo.csllARecolher) - csllMesesAnt);
        const irpjSaldoPagoMaior = Number(detalhe?.irpjSaldoPagoMaior ?? Math.max(0, irpjMesesAnt - Number(calculo.irpjARecolher)));
        const csllSaldoPagoMaior = Number(detalhe?.csllSaldoPagoMaior ?? Math.max(0, csllMesesAnt - Number(calculo.csllARecolher)));
        const modalidade = String(detalhe?.modalidadeRecolhimento ?? 'trimestral');
        const irpjAntMes1 = detalhe?.irpjAntecipacaoMes1 !== undefined ? Number(detalhe.irpjAntecipacaoMes1) : undefined;
        const irpjAntMes2 = detalhe?.irpjAntecipacaoMes2 !== undefined ? Number(detalhe.irpjAntecipacaoMes2) : undefined;
        const csllAntMes1 = detalhe?.csllAntecipacaoMes1 !== undefined ? Number(detalhe.csllAntecipacaoMes1) : undefined;
        const csllAntMes2 = detalhe?.csllAntecipacaoMes2 !== undefined ? Number(detalhe.csllAntecipacaoMes2) : undefined;
        const temDetalhamentoMensal = irpjAntMes1 !== undefined && irpjAntMes2 !== undefined;
        const MESES_TRI = {
            1: ['Janeiro', 'Fevereiro', 'Marco'],
            2: ['Abril', 'Maio', 'Junho'],
            3: ['Julho', 'Agosto', 'Setembro'],
            4: ['Outubro', 'Novembro', 'Dezembro'],
        };
        const mesesTri = MESES_TRI[calculo.trimestre] ?? ['Mes 1', 'Mes 2', 'Mes 3'];
        const periodoLabel = `${TRIMESTRES_LABEL[calculo.trimestre]} / ${calculo.ano}`;
        const modalidadeLabel = modalidade === 'mensal' ? 'Estimativa mensal / antecipacoes mensais' : 'Trimestral';
        const criadoEmStr = new Date(calculo.criadoEm).toLocaleString('pt-BR');
        const exportEmStr = new Date().toLocaleString('pt-BR');
        // ════════════════════════════════════════════════════════════════════════
        // 1. CABECALHO INSTITUCIONAL
        // ════════════════════════════════════════════════════════════════════════
        const CAB_H = 100;
        doc.rect(0, 0, PAGE_W, CAB_H).fill(C.navy);
        // Metade esquerda: logo da Aserco
        const metadeW = PAGE_W / 2;
        if (LOGO_PATH) {
            try {
                // Centraliza a logo verticalmente na metade esquerda
                doc.image(LOGO_PATH, L, 18, { height: 52, fit: [metadeW - L * 2, 52] });
            }
            catch { /* fallback textual */
                doc.fillColor(C.white).fontSize(13).font('Helvetica-Bold')
                    .text('ASERCO CONTABILIDADE', L, 36, { width: metadeW - L * 2 });
            }
        }
        else {
            doc.fillColor(C.white).fontSize(13).font('Helvetica-Bold')
                .text('ASERCO CONTABILIDADE', L, 36, { width: metadeW - L * 2 });
        }
        // Metade direita: titulo centralizado
        const tituloX = metadeW;
        const tituloW = metadeW - MARGIN;
        doc.fillColor(C.white).fontSize(15).font('Helvetica-Bold')
            .text('APURACAO DO LUCRO PRESUMIDO', tituloX, 18, { width: tituloW, align: 'center' });
        doc.fillColor(C.white).fontSize(11).font('Helvetica-Bold')
            .text('IRPJ & CSLL', tituloX, 42, { width: tituloW, align: 'center' });
        doc.fillColor('rgba(255,255,255,0.65)').fontSize(9).font('Helvetica')
            .text(periodoLabel, tituloX, 62, { width: tituloW, align: 'center' });
        // ── Faixa de identificacao da empresa (fundo azul medio) ─────────────────
        const EMP_Y = CAB_H;
        const EMP_H = 44;
        doc.rect(0, EMP_Y, PAGE_W, EMP_H).fill(C.blueM);
        if (calculo.empresa) {
            const emp = calculo.empresa;
            const nome = emp.razaoSocial;
            const cnpj = emp.cnpj ? `CNPJ: ${emp.cnpj}` : '';
            // Nome da empresa — linha inteira, sem espremido
            doc.fillColor(C.white).fontSize(10).font('Helvetica-Bold')
                .text(safe(nome), L, EMP_Y + 6, { width: PW, ellipsis: true });
            // CNPJ + modalidade na linha abaixo
            const infoEmp = [cnpj, `Recolhimento: ${modalidadeLabel}`].filter(Boolean).join('   |   ');
            doc.fillColor('rgba(255,255,255,0.75)').fontSize(8).font('Helvetica')
                .text(safe(infoEmp), L, EMP_Y + 22, { width: PW });
        }
        // ── Barra de meta-informacoes ─────────────────────────────────────────────
        const META_Y = EMP_Y + EMP_H;
        const META_H = 18;
        doc.rect(0, META_Y, PAGE_W, META_H).fill(C.blueL);
        doc.fillColor(C.gray).fontSize(7).font('Helvetica')
            .text(`Calculado em ${criadoEmStr}   |   Responsavel: ${safe(calculo.usuarioCriacao.nome)}`, L, META_Y + 5, { width: PW / 2 });
        const descSuffix = calculo.descricao ? `${safe(calculo.descricao)}   |   ` : '';
        doc.text(`${descSuffix}Exportado em: ${exportEmStr}`, L + PW / 2, META_Y + 5, { width: PW / 2, align: 'right' });
        doc.y = META_Y + META_H + 8;
        // ════════════════════════════════════════════════════════════════════════
        // 2. RESUMO EXECUTIVO
        // ════════════════════════════════════════════════════════════════════════
        paginaSeNecessario(doc, 80);
        renderSecaoLabel(doc, L, PW, 'RESUMO EXECUTIVO');
        const resumoItens = [
            { label: 'Receita Total', value: brl(calculo.receitaTotal), destaque: false },
            { label: 'Excedente Majorado', value: brl(calculo.excedenteMajorado), destaque: houveExcedente },
            { label: 'Base Presumida IRPJ', value: brl(calculo.basePresumidaIrpj), destaque: false },
            { label: 'IRPJ a Recolher', value: brl(calculo.irpjARecolher), destaque: false },
            { label: 'Base Presumida CSLL', value: brl(calculo.basePresumidaCsll), destaque: false },
            { label: 'CSLL a Recolher', value: brl(calculo.csllARecolher), destaque: false },
            { label: 'Guia Residual IRPJ', value: brl(irpjResidual), destaque: false },
            { label: 'Guia Residual CSLL', value: brl(csllResidual), destaque: false },
        ];
        renderResumoExecutivo(doc, L, PW, resumoItens);
        // ════════════════════════════════════════════════════════════════════════
        // 3. ALERTAS FISCAIS
        // ════════════════════════════════════════════════════════════════════════
        if (houveExcedente || csllBloqueada) {
            doc.moveDown(0.3);
            paginaSeNecessario(doc, 30);
        }
        if (houveExcedente) {
            const ay = doc.y;
            const alertText = `ALERTA: Majoracao aplicada no IRPJ. Receita de ${brl(calculo.receitaTotal)} ultrapassou ${brl(LIMITE_MAJORACAO)}. Excedente: ${brl(calculo.excedenteMajorado)}.`;
            const alertH = Math.max(20, doc.font('Helvetica').fontSize(8).heightOfString(alertText, { width: PW - 20 }) + 12);
            doc.rect(L, ay, PW, alertH).fill(C.redL);
            doc.rect(L, ay, 3, alertH).fill(C.red);
            doc.fillColor(C.red).fontSize(8).font('Helvetica-Bold')
                .text(alertText, L + 8, ay + 6, { width: PW - 20 });
            doc.y = ay + alertH + 4;
        }
        if (csllBloqueada) {
            const ay = doc.y;
            const infoText = 'INFORMACAO: CSLL sem majoracao no 1T/2026. Aliquota de acrescimo de 10% inaplicavel neste periodo, conforme MP 1.262/2024 e IN RFB 2.228/2024.';
            const infoH = Math.max(20, doc.font('Helvetica').fontSize(8).heightOfString(infoText, { width: PW - 20 }) + 12);
            doc.rect(L, ay, PW, infoH).fill(C.blueL);
            doc.rect(L, ay, 3, infoH).fill(C.blue);
            doc.fillColor(C.blue).fontSize(8).font('Helvetica-Bold')
                .text(infoText, L + 8, ay + 6, { width: PW - 20 });
            doc.y = ay + infoH + 4;
        }
        doc.moveDown(0.4);
        // ════════════════════════════════════════════════════════════════════════
        // 4. CALCULO DO IRPJ
        // ════════════════════════════════════════════════════════════════════════
        paginaSeNecessario(doc, 80);
        renderSecaoLabel(doc, L, PW, 'CALCULO DO LUCRO PRESUMIDO - IRPJ');
        renderTabelaReceitas(doc, L, PW, linhasIrpj, {
            receitaTotal: Number(calculo.receitaTotal),
            excedente: Number(calculo.excedenteMajorado),
            baseTotal: Number(calculo.basePresumidaIrpj),
            houveExcedente,
            csllBloqueada: false,
        });
        doc.moveDown(0.4);
        // ════════════════════════════════════════════════════════════════════════
        // 5. CALCULO DA CSLL
        // ════════════════════════════════════════════════════════════════════════
        paginaSeNecessario(doc, 80);
        renderSecaoLabel(doc, L, PW, 'CALCULO DO RESULTADO PRESUMIDO - CSLL');
        if (csllBloqueada) {
            const oy = doc.y;
            doc.rect(L, oy, PW, 16).fill(C.blueL);
            doc.fillColor(C.blue).fontSize(7.5).font('Helvetica-Bold')
                .text('OBSERVACAO: Majoracao da CSLL nao aplicada neste periodo (1T/2026) — MP 1.262/2024.', L + 6, oy + 4, { width: PW - 12 });
            doc.y = oy + 20;
        }
        renderTabelaReceitas(doc, L, PW, linhasCsll, {
            receitaTotal: Number(calculo.receitaTotal),
            excedente: csllBloqueada ? 0 : Number(calculo.excedenteMajorado),
            baseTotal: Number(calculo.basePresumidaCsll),
            houveExcedente: houveExcedente && !csllBloqueada,
            csllBloqueada,
        });
        doc.moveDown(0.4);
        // ════════════════════════════════════════════════════════════════════════
        // 6. RESULTADO IRPJ E CSLL (cards lado a lado)
        // ════════════════════════════════════════════════════════════════════════
        paginaSeNecessario(doc, 100);
        renderSecaoLabel(doc, L, PW, 'RESULTADO DO PERIODO - IRPJ & CSLL');
        const cardW = (PW - 12) / 2;
        const ry = doc.y;
        const linhasIrpjCard = [
            { label: 'Base de Calculo', value: brl(calculo.basePresumidaIrpj) },
            { label: 'IRPJ (15%)', value: brl(calculo.irpj15) },
            { label: `Adicional IR (10%) - excedente a R$ 20.000/mes (R$ 60.000 no trimestre)`, value: brl(calculo.adicionalIr10), highlight: Number(calculo.adicionalIr10) > 0 },
            { label: 'IRPJ + Adicional', value: brl(calculo.irpjTotal), bold: true },
            { label: '(-) IRRF', value: `(${brl(calculo.irrf)})`, muted: true },
            { label: 'IRPJ a Recolher', value: brl(calculo.irpjARecolher), total: true },
        ];
        const linhasCsllCard = [
            { label: 'Base de Calculo', value: brl(calculo.basePresumidaCsll) },
            { label: 'CSLL (9%)', value: brl(calculo.csll9) },
            { label: '(-) CSLL Retida na Fonte', value: `(${brl(calculo.csllRetida)})`, muted: true },
            { label: 'CSLL a Recolher', value: brl(calculo.csllARecolher), total: true },
        ];
        const hIrpjCard = renderCardResultado(doc, L, ry, cardW, linhasIrpjCard, 'IRPJ - DARF 2089');
        const hCsllCard = renderCardResultado(doc, L + cardW + 12, ry, cardW, linhasCsllCard, csllBloqueada ? 'CSLL - DARF 2372  (Sem majoracao 1T/2026)' : 'CSLL - DARF 2372');
        doc.y = ry + Math.max(hIrpjCard, hCsllCard) + 12;
        // ════════════════════════════════════════════════════════════════════════
        // 7. APURACAO MENSAL / GUIA RESIDUAL
        // ════════════════════════════════════════════════════════════════════════
        if (temPagMensais) {
            doc.moveDown(0.4);
            paginaSeNecessario(doc, 120);
            renderSecaoLabel(doc, L, PW, 'APURACAO MENSAL - ANTECIPACOES E GUIA RESIDUAL DO TRIMESTRE');
            const ey = doc.y;
            doc.rect(L, ey, PW, 18).fill(C.blueL);
            doc.fillColor(C.gray).fontSize(7.5).font('Helvetica')
                .text('A base de calculo e apurada sobre o trimestre completo. Os pagamentos/antecipacoes dos meses anteriores sao deduzidos para apurar a guia residual do 3o mes (art. 5o da Lei no 9.430/1996).', L + 6, ey + 4, { width: PW - 12 });
            doc.y = ey + 22;
            const halfW2 = (PW - 8) / 2;
            const cy2 = doc.y;
            // Montar linhas IRPJ
            const linhasResidualIrpj = [
                { label: 'IRPJ apurado no trimestre', value: brl(calculo.irpjARecolher), color: C.white, bold: false },
            ];
            if (temDetalhamentoMensal) {
                linhasResidualIrpj.push({ label: `(-) Antecipacao ${mesesTri[0]}`, value: `(${brl(irpjAntMes1)})`, color: '#FCA5A5', bold: false });
                linhasResidualIrpj.push({ label: `(-) Antecipacao ${mesesTri[1]}`, value: `(${brl(irpjAntMes2)})`, color: '#FCA5A5', bold: false });
                linhasResidualIrpj.push({ label: 'Total antecipado', value: `(${brl(irpjMesesAnt)})`, color: '#FCA5A5', bold: false });
            }
            else if (irpjMesesAnt > 0) {
                linhasResidualIrpj.push({ label: '(-) Pagamentos/antecipacoes anteriores', value: `(${brl(irpjMesesAnt)})`, color: '#FCA5A5', bold: false });
            }
            linhasResidualIrpj.push({ label: `Guia ${mesesTri[2]}`, value: brl(irpjResidual), color: '#7DD3FC', bold: true });
            if (irpjSaldoPagoMaior > 0) {
                linhasResidualIrpj.push({ label: 'Saldo pago a maior / credito', value: brl(irpjSaldoPagoMaior), color: '#6EE7B7', bold: true });
            }
            // Montar linhas CSLL
            const linhasResidualCsll = [
                { label: 'CSLL apurada no trimestre', value: brl(calculo.csllARecolher), color: C.white, bold: false },
            ];
            if (temDetalhamentoMensal) {
                linhasResidualCsll.push({ label: `(-) Antecipacao ${mesesTri[0]}`, value: `(${brl(csllAntMes1)})`, color: '#FCA5A5', bold: false });
                linhasResidualCsll.push({ label: `(-) Antecipacao ${mesesTri[1]}`, value: `(${brl(csllAntMes2)})`, color: '#FCA5A5', bold: false });
                linhasResidualCsll.push({ label: 'Total antecipado', value: `(${brl(csllMesesAnt)})`, color: '#FCA5A5', bold: false });
            }
            else if (csllMesesAnt > 0) {
                linhasResidualCsll.push({ label: '(-) Pagamentos/antecipacoes anteriores', value: `(${brl(csllMesesAnt)})`, color: '#FCA5A5', bold: false });
            }
            linhasResidualCsll.push({ label: `Guia ${mesesTri[2]}`, value: brl(csllResidual), color: '#7DD3FC', bold: true });
            if (csllSaldoPagoMaior > 0) {
                linhasResidualCsll.push({ label: 'Saldo pago a maior / credito', value: brl(csllSaldoPagoMaior), color: '#6EE7B7', bold: true });
            }
            // Aviso para calculos antigos sem detalhamento mensal
            if (!temDetalhamentoMensal && (irpjMesesAnt > 0 || csllMesesAnt > 0)) {
                const oy = doc.y;
                doc.rect(L, oy, PW, 14).fill(C.amberL);
                doc.fillColor(C.amber).fontSize(7).font('Helvetica')
                    .text('OBSERVACAO: Detalhamento mensal nao disponivel para este calculo. Valor informado de forma consolidada.', L + 6, oy + 3, { width: PW - 12 });
                doc.y = oy + 18;
            }
            const resCardH = 14 + Math.max(linhasResidualIrpj.length, linhasResidualCsll.length) * 16 + 8;
            renderCardResidual(doc, L, cy2, halfW2, resCardH, linhasResidualIrpj, 'IRPJ - DARF 2089', C.navy, '#0A1628', '#112240');
            renderCardResidual(doc, L + halfW2 + 8, cy2, halfW2, resCardH, linhasResidualCsll, 'CSLL - DARF 2372', '#112240', '#0D2040', '#0A1E3A');
            doc.y = cy2 + resCardH + 8;
        }
        // ════════════════════════════════════════════════════════════════════════
        // 8. LINHA DO TEMPO — APURACAO MENSAL DO TRIMESTRE
        // ════════════════════════════════════════════════════════════════════════
        if (modalidade === 'mensal' && calculo.receitasMensais && calculo.receitasMensais.length >= 3) {
            doc.moveDown(0.4);
            paginaSeNecessario(doc, 120);
            renderSecaoLabel(doc, L, PW, 'APURACAO MENSAL - LINHA DO TEMPO DO TRIMESTRE');
            const rm = calculo.receitasMensais;
            const mesesNomes = MESES_TRI_PDF[calculo.trimestre] ?? ['Mes 1', 'Mes 2', 'Mes 3'];
            function calcMesAntecipacao(m, nomeMes) {
                const receitaBruta = m.receita32 + m.receita8 + m.receita16 + m.receita16p + m.outrasReceitas;
                const baseIrpj = m.receita32 * 0.32 + m.receita8 * 0.08 + m.receita16 * 0.016 + m.receita16p * 0.16 + m.outrasReceitas;
                const irpj15v = baseIrpj * 0.15;
                const adicional = Math.max(0, baseIrpj - LIMITE_ADICIONAL_MENSAL_PDF) * 0.10;
                const irpjRecolher = Math.max(0, irpj15v + adicional - m.irrf);
                const baseCsll = m.receita32 * 0.32 + (m.receita16 + m.receita8 + m.receita16p) * 0.12 + m.outrasReceitas;
                const csllRecolher = Math.max(0, baseCsll * 0.09 - m.csllRetida);
                return { nome: nomeMes, receitaBruta, baseIrpj, irpj15: irpj15v, adicional, irpjRecolher, baseCsll, csllRecolher, fechamento: false };
            }
            const mes1 = calcMesAntecipacao(rm[0], mesesNomes[0]);
            const mes2 = calcMesAntecipacao(rm[1], mesesNomes[1]);
            // Mes 3: fechamento trimestral — usar valores do calculo
            const receitaBrutaMes3 = rm[2].receita32 + rm[2].receita8 + rm[2].receita16 + rm[2].receita16p + rm[2].outrasReceitas;
            const baseIrpjMes3 = Number(calculo.basePresumidaIrpj);
            const irpj15Mes3 = Number(calculo.irpj15);
            const adicionalMes3 = Number(calculo.adicionalIr10);
            const mes3 = {
                nome: mesesNomes[2],
                receitaBruta: receitaBrutaMes3,
                baseIrpj: baseIrpjMes3,
                irpj15: irpj15Mes3,
                adicional: adicionalMes3,
                irpjRecolher: irpjResidual,
                baseCsll: Number(calculo.basePresumidaCsll),
                csllRecolher: csllResidual,
                fechamento: true,
            };
            const totalReceitaBruta = mes1.receitaBruta + mes2.receitaBruta + mes3.receitaBruta;
            // Definir colunas
            const colWidths = [120, 100, 100, 90, 90, 100, 100, PW - 120 - 100 - 100 - 90 - 90 - 100 - 100];
            const colHeaders = ['Mes / Periodo', 'Receita Bruta', 'Base IRPJ', 'IRPJ 15%', 'Adicional 10%', 'IRPJ a Recolher', 'Base CSLL', 'CSLL a Recolher'];
            const ROW_H = 22;
            const HDR_H = 18;
            // Cabeçalho da tabela
            paginaSeNecessario(doc, HDR_H + ROW_H * 4 + 30);
            let tx = L;
            const hdrY = doc.y;
            colHeaders.forEach((h, i) => {
                doc.rect(tx, hdrY, colWidths[i], HDR_H).fill(C.navy);
                doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
                    .text(h, tx + 3, hdrY + 5, { width: colWidths[i] - 6, align: i === 0 ? 'left' : 'right' });
                tx += colWidths[i];
            });
            doc.y = hdrY + HDR_H;
            // Renderizar linha de mes
            function renderLinhaMes(dados, idx) {
                paginaSeNecessario(doc, ROW_H + 4);
                const ry = doc.y;
                const bg = dados.fechamento ? C.blueL : (idx % 2 === 0 ? C.white : C.rowAlt);
                let cx = L;
                // Fundo da linha inteira
                doc.rect(L, ry, PW, ROW_H).fill(bg);
                if (dados.fechamento) {
                    doc.rect(L, ry, 3, ROW_H).fill(C.blue);
                }
                // Col 0: nome do mes
                const labelMes = dados.fechamento
                    ? `${dados.nome} (fechamento trimestral)`
                    : `${dados.nome} (antecipacao)`;
                const subLabel = dados.fechamento ? '' : '(sem majoracao)';
                doc.fillColor(dados.fechamento ? C.blue : C.text).fontSize(7).font(dados.fechamento ? 'Helvetica-Bold' : 'Helvetica')
                    .text(labelMes, cx + 5, ry + 4, { width: colWidths[0] - 8 });
                if (subLabel) {
                    doc.fillColor(C.muted).fontSize(6).font('Helvetica')
                        .text(subLabel, cx + 5, ry + 13, { width: colWidths[0] - 8 });
                }
                cx += colWidths[0];
                // Valores numericos
                const vals = [
                    dados.receitaBruta,
                    dados.baseIrpj,
                    dados.irpj15,
                    dados.adicional,
                    dados.irpjRecolher,
                    dados.baseCsll,
                    dados.csllRecolher,
                ];
                vals.forEach((v, i) => {
                    const colIdx = i + 1;
                    doc.fillColor(dados.fechamento ? C.blue : C.text)
                        .fontSize(7).font(dados.fechamento ? 'Helvetica-Bold' : 'Helvetica')
                        .text(brl(v), cx + 3, ry + 7, { width: colWidths[colIdx] - 6, align: 'right' });
                    cx += colWidths[colIdx];
                });
                doc.y = ry + ROW_H;
            }
            renderLinhaMes(mes1, 0);
            renderLinhaMes(mes2, 1);
            renderLinhaMes(mes3, 2);
            // Linha de totais
            paginaSeNecessario(doc, ROW_H + 4);
            const totalY = doc.y;
            doc.rect(L, totalY, PW, ROW_H).fill(C.totalBg);
            let tcx = L;
            const totalValsArr = [
                totalReceitaBruta,
                mes1.baseIrpj + mes2.baseIrpj + mes3.baseIrpj,
                mes1.irpj15 + mes2.irpj15 + mes3.irpj15,
                mes1.adicional + mes2.adicional + mes3.adicional,
                Number(calculo.irpjARecolher),
                mes1.baseCsll + mes2.baseCsll + mes3.baseCsll,
                Number(calculo.csllARecolher),
            ];
            // Col 0: label
            doc.fillColor(C.navy).fontSize(7).font('Helvetica-Bold')
                .text('TOTAL DO TRIMESTRE', tcx + 5, totalY + 7, { width: colWidths[0] - 8 });
            tcx += colWidths[0];
            totalValsArr.forEach((v, i) => {
                doc.fillColor(C.navy).fontSize(7).font('Helvetica-Bold')
                    .text(brl(v), tcx + 3, totalY + 7, { width: colWidths[i + 1] - 6, align: 'right' });
                tcx += colWidths[i + 1];
            });
            doc.y = totalY + ROW_H + 4;
            // Nota explicativa
            paginaSeNecessario(doc, 24);
            const notaY = doc.y;
            const notaText = 'Meses 1 e 2: antecipacoes calculadas sobre a receita do mes isolado, sem majoracao (art. 5o Lei 9.430/1996). Mes 3: fechamento trimestral com apuracao completa. Guia residual = imposto apurado no trimestre menos antecipacoes pagas.';
            const notaH = Math.max(18, doc.font('Helvetica').fontSize(7).heightOfString(notaText, { width: PW - 12 }) + 10);
            doc.rect(L, notaY, PW, notaH).fill(C.grayL);
            doc.fillColor(C.muted).fontSize(7).font('Helvetica')
                .text(notaText, L + 6, notaY + 5, { width: PW - 12 });
            doc.y = notaY + notaH + 4;
        }
        // ════════════════════════════════════════════════════════════════════════
        // 9. COMPARATIVO DO EXERCICIO
        // ════════════════════════════════════════════════════════════════════════
        doc.moveDown(0.4);
        paginaSeNecessario(doc, 60);
        renderSecaoLabel(doc, L, PW, `COMPARATIVO DE APURACAO DO EXERCICIO - ${calculo.ano}`);
        const comp = calculo.comparativoExercicio ?? [];
        if (comp.length <= 1) {
            const oy = doc.y;
            doc.rect(L, oy, PW, 18).fill(C.grayL);
            doc.fillColor(C.muted).fontSize(8).font('Helvetica')
                .text('Nao ha periodos anteriores cadastrados para comparacao neste exercicio.', L + 8, oy + 5, { width: PW - 16 });
            doc.y = oy + 22;
        }
        else {
            renderTabelaComparativo(doc, L, PW, comp, calculo.trimestre);
        }
        // ════════════════════════════════════════════════════════════════════════
        // 10. ENQUADRAMENTO LEGAL E NOTAS TECNICAS
        // ════════════════════════════════════════════════════════════════════════
        doc.moveDown(0.4);
        paginaSeNecessario(doc, 60);
        renderSecaoLabel(doc, L, PW, 'ENQUADRAMENTO LEGAL E NOTAS TECNICAS');
        const notas = [
            {
                titulo: 'Regime Tributario - Lucro Presumido',
                texto: 'Apuracao trimestral do IRPJ e da CSLL com base no Lucro Presumido, conforme arts. 516 a 528 do RIR/2018 (Decreto no 9.580/2018) e Lei no 9.430/1996. A base de calculo e determinada pela aplicacao dos percentuais de presuncao sobre a receita bruta de cada atividade.',
                cor: C.blueL, corBarra: C.blue,
            },
        ];
        if (Number(calculo.adicionalIr10) > 0) {
            notas.push({
                titulo: 'Adicional do IRPJ (10%)',
                texto: `Incide sobre a parcela da base de calculo que exceder R$ 20.000,00/mes (R$ 60.000,00 no trimestre), conforme art. 3o, par. 1o da Lei no 9.249/1995 e art. 543 do RIR/2018. Adicional apurado: ${brl(calculo.adicionalIr10)}.`,
                cor: C.amberL, corBarra: C.amber,
            });
        }
        if (houveExcedente) {
            notas.push({
                titulo: 'Majoracao Aplicada - IRPJ (Excedente a R$ 1.250.000,00)',
                texto: `A receita trimestral de ${brl(calculo.receitaTotal)} ultrapassou o limite de ${brl(LIMITE_MAJORACAO)}. O excedente de ${brl(calculo.excedenteMajorado)} foi submetido ao percentual de presuncao acrescido de 10 p.p., conforme art. 2o da Lei no 9.430/1996 e IN RFB no 1.700/2017.`,
                cor: C.redL, corBarra: C.red,
            });
        }
        if (csllBloqueada) {
            notas.push({
                titulo: 'CSLL - Majoracao Nao Exigivel no 1o Trimestre/2026 (QDMTT/BEPS)',
                texto: 'A aliquota de acrescimo de 10% na CSLL e inaplicavel no 1T/2026 (jan-mar/2026). A CSLL majorada (QDMTT) foi instituida pela MP no 1.262/2024, regulamentada pela IN RFB no 2.228/2024, com vigencia a partir do 2T/2026 — implementacao faseada do Pilar 2 da OCDE.',
                cor: C.blueL, corBarra: C.blue,
            });
        }
        else if (houveExcedente) {
            notas.push({
                titulo: 'CSLL - Majoracao Aplicada',
                texto: `O excedente de ${brl(calculo.excedenteMajorado)} foi aplicado a base de calculo da CSLL, com acrescimo de 10 p.p. sobre o percentual de presuncao, conforme art. 2o da Lei no 9.430/1996.`,
                cor: C.redL, corBarra: C.red,
            });
        }
        if (Number(calculo.irrf) > 0) {
            notas.push({
                titulo: 'IRRF Deduzido',
                texto: `O Imposto de Renda Retido na Fonte de ${brl(calculo.irrf)} foi deduzido do IRPJ apurado, conforme art. 76 da Lei no 8.981/1995 e art. 76 da Lei no 9.430/1996.`,
                cor: C.grayL, corBarra: C.gray,
            });
        }
        if (Number(calculo.csllRetida) > 0) {
            notas.push({
                titulo: 'CSLL Retida na Fonte Deduzida',
                texto: `A CSLL Retida na Fonte de ${brl(calculo.csllRetida)} foi deduzida da CSLL apurada, conforme art. 30 da Lei no 10.833/2003.`,
                cor: C.grayL, corBarra: C.gray,
            });
        }
        if (temPagMensais) {
            notas.push({
                titulo: 'Apuracao Mensal - Guia Residual do 3o Mes',
                texto: `O imposto apurado trimestralmente pode ser recolhido em quota unica ou em tres parcelas mensais. As antecipacoes dos meses 1 e 2 sao calculadas sobre a receita de cada mes isolado, SEM aplicar a majoracao de 10% no percentual de presuncao — a majoracao e uma regra trimestral, verificada apenas no fechamento do trimestre. A diferenca e ajustada na guia residual do 3o mes, conforme art. 5o da Lei no 9.430/1996.`,
                cor: C.blueL, corBarra: C.blue,
            });
        }
        // Renderiza notas em 2 colunas
        const notaW = (PW - 10) / 2;
        for (let i = 0; i < notas.length; i += 2) {
            const notaEsq = notas[i];
            const notaDir = notas[i + 1];
            const hEsq = calcNotaH(doc, notaW, notaEsq.titulo, notaEsq.texto);
            const hDir = notaDir ? calcNotaH(doc, notaW, notaDir.titulo, notaDir.texto) : 0;
            const rowH = Math.max(hEsq, hDir);
            paginaSeNecessario(doc, rowH + 10);
            const rowY = doc.y;
            renderNota(doc, L, rowY, notaW, rowH, notaEsq);
            if (notaDir)
                renderNota(doc, L + notaW + 10, rowY, notaW, rowH, notaDir);
            doc.y = rowY + rowH + 6;
        }
        // ── Assinatura do documento ───────────────────────────────────────────────
        doc.moveDown(0.4);
        paginaSeNecessario(doc, 36);
        const sy = doc.y;
        doc.rect(L, sy, PW, 28).fill(C.grayL);
        doc.rect(L, sy, PW, 28).strokeColor(C.border).lineWidth(0.5).stroke();
        doc.fillColor(C.muted).fontSize(7).font('Helvetica')
            .text(`Documento gerado pelo Sistema de Conferencia de Majoracao - Aserco Contabilidade   |   Calculado em ${criadoEmStr} por ${safe(calculo.usuarioCriacao.nome)}   |   Exportado em ${exportEmStr}`, L + 8, sy + 5, { width: PW - 16, align: 'center' });
        doc.fillColor(C.muted).fontSize(6.5)
            .text('Este documento tem carater informativo. Os valores apurados devem ser conferidos pelo responsavel tributario antes do recolhimento.', L + 8, sy + 16, { width: PW - 16, align: 'center' });
        // ── Rodapé institucional em todas as páginas ──────────────────────────────
        const range = doc.bufferedPageRange();
        for (let i = 0; i < range.count; i++) {
            doc.switchToPage(range.start + i);
            // Rodape
            doc.rect(0, FOOTER_Y, PAGE_W, FOOTER_H).fill(C.navy);
            doc.fillColor('rgba(255,255,255,0.55)').fontSize(7).font('Helvetica')
                .text(`Sistema de Conferencia de Majoracao - Aserco Contabilidade   |   Lucro Presumido - ${TRIMESTRES_LABEL[calculo.trimestre]} ${calculo.ano}   |   Documento gerado automaticamente   |   Pagina ${i + 1} de ${range.count}`, L, FOOTER_Y + 10, { width: PW, align: 'center' });
            // Cabecalho repetido nas paginas 2+ (faixa fina de identificacao)
            if (i > 0) {
                doc.rect(0, 0, PAGE_W, 22).fill(C.navy);
                // Esquerda: nome do sistema
                doc.fillColor('rgba(255,255,255,0.60)').fontSize(7.5).font('Helvetica')
                    .text('Sistema de Conferencia de Majoracao - Aserco Contabilidade', L, 7, { width: PAGE_W / 2 - L });
                // Direita: empresa + periodo
                const infoDir = calculo.empresa
                    ? `${safe(calculo.empresa.razaoSocial)}   |   ${periodoLabel}`
                    : periodoLabel;
                doc.fillColor('rgba(255,255,255,0.70)').fontSize(7.5).font('Helvetica-Bold')
                    .text(infoDir, PAGE_W / 2, 7, { width: PAGE_W / 2 - L, align: 'right', ellipsis: true });
            }
        }
        doc.end();
    });
}
// ── Helpers ──────────────────────────────────────────────────────────────────
/** Adiciona nova pagina se o espaco restante for menor que minH.
 *  Apos addPage(), reseta doc.y para a margem superior correta.
 *  Paginas 2+ tem faixa de cabecalho de 22pt, entao y inicial = 28. */
function paginaSeNecessario(doc, minH) {
    if (doc.y + minH > FOOTER_Y - 10) {
        doc.addPage();
        doc.y = 28; // abaixo da faixa de cabecalho repetido (22pt) + 6pt de margem
    }
}
function calcNotaH(doc, w, titulo, texto) {
    const PAD = 7;
    const tituloH = doc.font('Helvetica-Bold').fontSize(7.5).heightOfString(titulo, { width: w - 14 });
    const textoH = doc.font('Helvetica').fontSize(7).heightOfString(texto, { width: w - 14 });
    return PAD + tituloH + 4 + textoH + PAD;
}
function renderNota(doc, x, y, w, h, nota) {
    const PAD = 7;
    doc.rect(x, y, w, h).fill(nota.cor);
    doc.rect(x, y, 3, h).fill(nota.corBarra);
    doc.fillColor(nota.corBarra).fontSize(7.5).font('Helvetica-Bold')
        .text(nota.titulo, x + 8, y + PAD, { width: w - 14 });
    const tH = doc.font('Helvetica-Bold').fontSize(7.5).heightOfString(nota.titulo, { width: w - 14 });
    doc.fillColor(C.text).fontSize(7).font('Helvetica')
        .text(nota.texto, x + 8, y + PAD + tH + 4, { width: w - 14 });
}
function renderSecaoLabel(doc, x, w, label) {
    const y = doc.y;
    doc.rect(x, y, w, 18).fill(C.navy);
    doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
        .text(label, x + 6, y + 5, { width: w - 12 });
    doc.y = y + 22;
}
/** Resumo executivo em grid de 4 colunas */
function renderResumoExecutivo(doc, x, w, itens) {
    const cols = 4;
    const itemW = (w - (cols - 1) * 6) / cols;
    const itemH = 36;
    const y = doc.y;
    itens.forEach((item, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const ix = x + col * (itemW + 6);
        const iy = y + row * (itemH + 4);
        doc.rect(ix, iy, itemW, itemH).fill(item.destaque ? C.redL : C.grayL);
        if (item.destaque)
            doc.rect(ix, iy, 3, itemH).fill(C.red);
        doc.fillColor(item.destaque ? C.red : C.muted).fontSize(7).font('Helvetica')
            .text(item.label, ix + 6, iy + 5, { width: itemW - 10 });
        doc.fillColor(item.destaque ? C.red : C.blue).fontSize(9).font('Helvetica-Bold')
            .text(item.value, ix + 6, iy + 18, { width: itemW - 10 });
    });
    const rows = Math.ceil(itens.length / cols);
    doc.y = y + rows * (itemH + 4) + 4;
}
/** Tabela comparativa do exercicio */
function renderTabelaComparativo(doc, x, w, dados, trimestreAtual) {
    const cols = [
        { label: 'Periodo', cw: 100, align: 'left' },
        { label: 'Receita Total', cw: 130, align: 'right' },
        { label: 'IRPJ a Recolher', cw: 120, align: 'right' },
        { label: 'CSLL a Recolher', cw: 120, align: 'right' },
        { label: 'Total IRPJ+CSLL', cw: 120, align: 'right' },
        { label: 'Var. IRPJ vs ant.', cw: 100, align: 'right' },
        { label: 'Var. %', cw: 80, align: 'right' },
    ];
    const totalFixo = cols.reduce((s, c) => s + c.cw, 0);
    cols[cols.length - 1].cw += w - totalFixo;
    const ROW_H = 15;
    const HEAD_H = 18;
    let cy = doc.y;
    let cx = x;
    // Cabecalho
    doc.rect(x, cy, w, HEAD_H).fill(C.navy);
    cols.forEach(col => {
        doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
            .text(col.label, cx + 2, cy + 5, { width: col.cw - 4, align: col.align });
        cx += col.cw;
    });
    cy += HEAD_H;
    // Linhas — com verificacao de quebra de pagina
    dados.forEach((d, idx) => {
        if (cy + ROW_H > FOOTER_Y - 10) {
            doc.addPage();
            cy = 28;
            // Redesenha cabecalho na nova pagina
            cx = x;
            doc.rect(x, cy, w, HEAD_H).fill(C.navy);
            cols.forEach(col => {
                doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
                    .text(col.label, cx + 2, cy + 5, { width: col.cw - 4, align: col.align });
                cx += col.cw;
            });
            cy += HEAD_H;
        }
        const ant = idx > 0 ? dados[idx - 1] : null;
        const varIrpj = ant ? d.irpjARecolher - ant.irpjARecolher : null;
        const varPct = ant && ant.irpjARecolher > 0 ? (varIrpj / ant.irpjARecolher) * 100 : null;
        const isAtual = d.trimestre === trimestreAtual;
        const bg = isAtual ? C.blueL : (idx % 2 === 0 ? C.white : C.rowAlt);
        doc.rect(x, cy, w, ROW_H).fill(bg);
        if (isAtual)
            doc.rect(x, cy, 3, ROW_H).fill(C.blue);
        const cells = [
            { v: `${d.trimestre}T`, color: isAtual ? C.blue : C.text, bold: isAtual },
            { v: brl(d.receitaTotal), color: C.text, bold: false },
            { v: brl(d.irpjARecolher), color: C.blue, bold: isAtual },
            { v: brl(d.csllARecolher), color: C.blue, bold: isAtual },
            { v: brl(d.irpjARecolher + d.csllARecolher), color: C.text, bold: isAtual },
            { v: varIrpj !== null ? brl(varIrpj) : '—', color: varIrpj !== null ? (varIrpj >= 0 ? C.red : C.green) : C.muted, bold: false },
            { v: varPct !== null ? `${varPct >= 0 ? '+' : ''}${varPct.toFixed(1)}%` : '—', color: varPct !== null ? (varPct >= 0 ? C.red : C.green) : C.muted, bold: false },
        ];
        cx = x;
        cells.forEach((cell, i) => {
            doc.fillColor(cell.color).fontSize(7).font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(cell.v, cx + 2, cy + 4, { width: cols[i].cw - 4, align: cols[i].align });
            cx += cols[i].cw;
        });
        doc.moveTo(x, cy + ROW_H).lineTo(x + w, cy + ROW_H).strokeColor(C.border).lineWidth(0.3).stroke();
        cy += ROW_H;
    });
    doc.y = cy + 6;
}
function renderTabelaReceitas(doc, x, w, linhas, opts) {
    const cols = [
        { label: 'Discriminacao das Receitas', w: 220, align: 'left' },
        { label: 'Valor (R$)', w: 90, align: 'right' },
        { label: 'Proporcao', w: 52, align: 'right' },
        { label: 'Parc. s/ Acrescimo', w: 90, align: 'right' },
        { label: '% Aplic.', w: 48, align: 'right' },
        { label: 'Parc. c/ Acrescimo', w: 90, align: 'right' },
        { label: '% c/ Acresc.', w: 48, align: 'right' },
        { label: 'Base de Calculo', w: 132, align: 'right' },
    ];
    const totalFixo = cols.reduce((s, c) => s + c.w, 0);
    cols[cols.length - 1].w += w - totalFixo;
    const ROW_H = 15;
    const HEAD_H = 19;
    // Funcao interna: desenha cabecalho da tabela na posicao cy atual
    function desenharCabecalho(cy) {
        let cx = x;
        doc.rect(x, cy, w, HEAD_H).fill(C.navy);
        cols.forEach(col => {
            doc.fillColor(C.white).fontSize(7).font('Helvetica-Bold')
                .text(col.label, cx + 2, cy + 6, { width: col.w - 4, align: col.align });
            cx += col.w;
        });
        return cy + HEAD_H;
    }
    let cy = desenharCabecalho(doc.y);
    // Linhas de dados — com quebra de pagina linha a linha
    linhas.forEach((l, idx) => {
        // Verificar se precisa de nova pagina antes de desenhar a linha
        if (cy + ROW_H > FOOTER_Y - 10) {
            doc.addPage();
            cy = 28;
            cy = desenharCabecalho(cy); // redesenha cabecalho na nova pagina
        }
        const bg = idx % 2 === 0 ? C.white : C.rowAlt;
        doc.rect(x, cy, w, ROW_H).fill(bg);
        const temExcedente = opts.houveExcedente && l.parcelaComAcrescimo > 0;
        const cells = [
            { v: safe(l.descricao), color: C.text, bold: false },
            { v: brl(l.valor), color: C.text, bold: false },
            { v: pct(l.proporcao), color: C.muted, bold: false },
            { v: brl(l.parcelaSemAcrescimo), color: C.text, bold: false },
            { v: pct(l.aliquota), color: C.muted, bold: false },
            { v: brl(l.parcelaComAcrescimo), color: temExcedente ? C.red : C.muted, bold: temExcedente },
            { v: pct(l.aliquotaAcrescimo), color: temExcedente ? C.red : C.muted, bold: temExcedente },
            { v: brl(l.baseCalculo), color: C.blue, bold: true },
        ];
        let cx = x;
        cells.forEach((cell, i) => {
            doc.fillColor(cell.color).fontSize(7)
                .font(cell.bold ? 'Helvetica-Bold' : 'Helvetica')
                .text(cell.v, cx + 2, cy + 4, { width: cols[i].w - 4, align: cols[i].align });
            cx += cols[i].w;
        });
        doc.moveTo(x, cy + ROW_H).lineTo(x + w, cy + ROW_H).strokeColor(C.border).lineWidth(0.3).stroke();
        cy += ROW_H;
    });
    // Linha de total — verificar quebra de pagina
    if (cy + ROW_H + 2 > FOOTER_Y - 10) {
        doc.addPage();
        cy = 28;
    }
    doc.rect(x, cy, w, ROW_H + 2).fill(C.totalBg);
    doc.rect(x, cy, w, ROW_H + 2).strokeColor(C.border).lineWidth(0.5).stroke();
    const totalCells = [
        'Total da Receita Bruta',
        brl(opts.receitaTotal),
        '100%',
        brl(opts.houveExcedente ? LIMITE_MAJORACAO : opts.receitaTotal),
        '',
        opts.houveExcedente ? brl(opts.excedente) : '-',
        '',
        brl(opts.baseTotal),
    ];
    let cx2 = x;
    totalCells.forEach((v, i) => {
        const isExc = i === 5 && opts.houveExcedente;
        const isBase = i === 7;
        doc.fillColor(isExc ? C.red : isBase ? C.blue : C.text)
            .fontSize(7).font('Helvetica-Bold')
            .text(v, cx2 + 2, cy + 4, { width: cols[i].w - 4, align: cols[i].align });
        cx2 += cols[i].w;
    });
    doc.y = cy + ROW_H + 8;
}
function renderCardResultado(doc, x, y, w, linhas, titulo) {
    const PAD = 10;
    const LINE_H = 16;
    const h = PAD + 14 + linhas.length * LINE_H + PAD;
    doc.rect(x, y, w, h).fill(C.navy);
    doc.rect(x, y, w, 14).fill(C.blue);
    doc.fillColor(C.white).fontSize(8).font('Helvetica-Bold')
        .text(titulo.toUpperCase(), x + PAD, y + 3, { width: w - PAD * 2 });
    let ly = y + 14 + PAD / 2;
    linhas.forEach(l => {
        const isTotal = l.total;
        const isMuted = l.muted;
        const isBold = l.bold || isTotal;
        if (isTotal)
            doc.rect(x, ly - 2, w, LINE_H + 2).fill('#112240');
        const labelColor = isMuted ? 'rgba(255,255,255,0.4)' : isTotal ? C.white : 'rgba(255,255,255,0.7)';
        const valueColor = isMuted ? 'rgba(255,255,255,0.4)' : isTotal ? '#7DD3FC' : l.highlight ? '#FCD34D' : C.white;
        doc.fillColor(labelColor).fontSize(8).font(isBold ? 'Helvetica-Bold' : 'Helvetica')
            .text(l.label, x + PAD, ly, { width: w - PAD * 2 - 90 });
        doc.fillColor(valueColor).fontSize(isBold ? 8.5 : 8).font('Helvetica-Bold')
            .text(l.value, x + PAD, ly, { width: w - PAD * 2, align: 'right' });
        ly += LINE_H;
    });
    return h; // retorna altura real para o chamador atualizar doc.y
}
function renderCardResidual(doc, x, y, w, h, linhas, titulo, bgColor, headerColor, totalBg) {
    doc.rect(x, y, w, h).fill(bgColor);
    doc.rect(x, y, w, 14).fill(headerColor);
    doc.fillColor(C.white).fontSize(7.5).font('Helvetica-Bold')
        .text(titulo, x + 6, y + 3, { width: w - 12 });
    let ly = y + 18;
    linhas.forEach((l, i) => {
        if (i === linhas.length - 1)
            doc.rect(x, ly - 2, w, 18).fill(totalBg);
        doc.fillColor(i === linhas.length - 1 ? C.white : 'rgba(255,255,255,0.65)')
            .fontSize(7.5).font(l.bold ? 'Helvetica-Bold' : 'Helvetica')
            .text(l.label, x + 6, ly, { width: w - 80 });
        doc.fillColor(l.color).fontSize(l.bold ? 8.5 : 7.5).font('Helvetica-Bold')
            .text(l.value, x + 6, ly, { width: w - 10, align: 'right' });
        ly += 16;
    });
}
