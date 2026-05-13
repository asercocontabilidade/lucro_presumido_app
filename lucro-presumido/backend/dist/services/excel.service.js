"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gerarExcel = gerarExcel;
const exceljs_1 = __importDefault(require("exceljs"));
const TRIMESTRES = ['', '1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre'];
const LIMITE_MAJORACAO = 1250000;
const LIMITE_ADICIONAL = 60000;
const LIMITE_ADICIONAL_MENSAL_XL = 20000;
const MESES_TRI_XL_CONST = {
    1: ['Janeiro', 'Fevereiro', 'Marco'],
    2: ['Abril', 'Maio', 'Junho'],
    3: ['Julho', 'Agosto', 'Setembro'],
    4: ['Outubro', 'Novembro', 'Dezembro'],
};
function n(v) { return Number(v ?? 0); }
// ── Estilos reutilizáveis ────────────────────────────────────────────────────
const NAVY = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1628' } };
const BLUE = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D47A1' } };
const BLUEL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8EFF8' } };
const TOTAL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEEF2F8' } };
const ALT = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF7F9FC' } };
const REDL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
const AMBL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFF3CD' } };
const DARK2 = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF112240' } };
const WHITE_FONT = { color: { argb: 'FFFFFFFF' } };
const NAVY_FONT = { color: { argb: 'FF0A1628' } };
const BLUE_FONT = { color: { argb: 'FF0D47A1' } };
const RED_FONT = { color: { argb: 'FFB91C1C' } };
const MUTED_FONT = { color: { argb: 'FF8A93A6' } };
const LIGHT_FONT = { color: { argb: 'FFB0C4DE' } };
const BRL = 'R$ #,##0.00';
const PCT = '0.00%';
const CENTER = { horizontal: 'center', vertical: 'middle' };
const RIGHT = { horizontal: 'right', vertical: 'middle' };
const LEFT = { horizontal: 'left', vertical: 'middle' };
function border(style = 'thin', color = 'FFD8DDE8') {
    const s = { style, color: { argb: color } };
    return { top: s, bottom: s, left: s, right: s };
}
async function gerarExcel(calculo) {
    const wb = new exceljs_1.default.Workbook();
    wb.creator = 'Sistema Lucro Presumido';
    wb.created = new Date();
    const detalhe = calculo.detalheCalculo;
    const linhasIrpj = detalhe?.linhasIrpj ?? [];
    const linhasCsll = detalhe?.linhasCsll ?? [];
    const houveExcedente = n(calculo.excedenteMajorado) > 0;
    const csllBloqueada = !!(detalhe?.csllMajoracaBloqueada);
    const irpjMesesAnt = n(detalhe?.irpjMesesAnteriores ?? 0);
    const csllMesesAnt = n(detalhe?.csllMesesAnteriores ?? 0);
    const temPagMensais = irpjMesesAnt > 0 || csllMesesAnt > 0;
    const irpjResidual = Math.max(0, n(calculo.irpjARecolher) - irpjMesesAnt);
    const csllResidual = Math.max(0, n(calculo.csllARecolher) - csllMesesAnt);
    // Saldo pago a maior (retrocompatível: detalheCalculo antigo não terá esses campos)
    const irpjSaldoPagoMaior = n(detalhe?.irpjSaldoPagoMaior ?? Math.max(0, irpjMesesAnt - n(calculo.irpjARecolher)));
    const csllSaldoPagoMaior = n(detalhe?.csllSaldoPagoMaior ?? Math.max(0, csllMesesAnt - n(calculo.csllARecolher)));
    const modalidade = String(detalhe?.modalidadeRecolhimento ?? 'trimestral');
    const modalidadeLabel = modalidade === 'mensal' ? 'Estimativa mensal / antecipações mensais' : 'Trimestral';
    // Antecipações por mês (empresa mensal — retrocompatível)
    const irpjAntMes1 = detalhe?.irpjAntecipacaoMes1 !== undefined ? n(detalhe.irpjAntecipacaoMes1) : undefined;
    const irpjAntMes2 = detalhe?.irpjAntecipacaoMes2 !== undefined ? n(detalhe.irpjAntecipacaoMes2) : undefined;
    const csllAntMes1 = detalhe?.csllAntecipacaoMes1 !== undefined ? n(detalhe.csllAntecipacaoMes1) : undefined;
    const csllAntMes2 = detalhe?.csllAntecipacaoMes2 !== undefined ? n(detalhe.csllAntecipacaoMes2) : undefined;
    const temDetalhamentoMensal = irpjAntMes1 !== undefined && irpjAntMes2 !== undefined;
    const MESES_TRI_XL = {
        1: ['Janeiro', 'Fevereiro', 'Março'],
        2: ['Abril', 'Maio', 'Junho'],
        3: ['Julho', 'Agosto', 'Setembro'],
        4: ['Outubro', 'Novembro', 'Dezembro'],
    };
    const mesesTri = MESES_TRI_XL[calculo.trimestre] ?? ['Mês 1', 'Mês 2', 'Mês 3'];
    // ── Aba 1: Relatório Completo ─────────────────────────────────────────────
    const ws = wb.addWorksheet('Apuração', { pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 } });
    ws.views = [{ showGridLines: false }];
    // Larguras das colunas
    ws.getColumn(1).width = 42;
    ws.getColumn(2).width = 18;
    ws.getColumn(3).width = 12;
    ws.getColumn(4).width = 18;
    ws.getColumn(5).width = 12;
    ws.getColumn(6).width = 18;
    ws.getColumn(7).width = 12;
    ws.getColumn(8).width = 18;
    ws.getColumn(9).width = 2; // espaçador
    ws.getColumn(10).width = 30;
    ws.getColumn(11).width = 18;
    let r = 1;
    // ── Cabeçalho ──────────────────────────────────────────────────────────────
    // Linha 1: título
    ws.mergeCells(r, 1, r, 8);
    const tituloCell = ws.getCell(r, 1);
    tituloCell.value = 'APURAÇÃO DO LUCRO PRESUMIDO — IRPJ / CSLL';
    tituloCell.fill = NAVY;
    tituloCell.font = { ...WHITE_FONT, bold: true, size: 14 };
    tituloCell.alignment = CENTER;
    ws.getRow(r).height = 28;
    r++;
    // Linha 2: período
    ws.mergeCells(r, 1, r, 8);
    const periodoCell = ws.getCell(r, 1);
    periodoCell.value = `${TRIMESTRES[calculo.trimestre]} — ${calculo.ano}`;
    periodoCell.fill = BLUE;
    periodoCell.font = { ...WHITE_FONT, bold: true, size: 11 };
    periodoCell.alignment = CENTER;
    ws.getRow(r).height = 20;
    r++;
    // Linha 3: empresa
    if (calculo.empresa) {
        ws.mergeCells(r, 1, r, 8);
        const empCell = ws.getCell(r, 1);
        const nome = calculo.empresa.nomeFantasia || calculo.empresa.razaoSocial;
        const cnpj = calculo.empresa.cnpj ? `   ·   CNPJ: ${calculo.empresa.cnpj}` : '';
        empCell.value = `${nome}${cnpj}`;
        empCell.fill = BLUEL;
        empCell.font = { ...NAVY_FONT, bold: true, size: 10 };
        empCell.alignment = CENTER;
        ws.getRow(r).height = 18;
        r++;
    }
    // Linha meta
    ws.mergeCells(r, 1, r, 4);
    ws.getCell(r, 1).value = `Cálculo realizado em: ${new Date(calculo.criadoEm).toLocaleString('pt-BR')}`;
    ws.getCell(r, 1).font = { ...MUTED_FONT, size: 9 };
    ws.getCell(r, 1).alignment = LEFT;
    ws.mergeCells(r, 5, r, 8);
    ws.getCell(r, 5).value = `Por: ${calculo.usuarioCriacao.nome}${calculo.descricao ? '   ·   ' + calculo.descricao : ''}   ·   Recolhimento: ${modalidadeLabel}   ·   Exportado em: ${new Date().toLocaleString('pt-BR')}`;
    ws.getCell(r, 5).font = { ...MUTED_FONT, size: 9 };
    ws.getCell(r, 5).alignment = RIGHT;
    ws.getRow(r).height = 16;
    r++;
    // Alerta majoração
    if (houveExcedente) {
        r++;
        ws.mergeCells(r, 1, r, 8);
        const alertCell = ws.getCell(r, 1);
        alertCell.value = `⚠  MAJORAÇÃO APLICADA — Receita de ${n(calculo.receitaTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ultrapassou ${LIMITE_MAJORACAO.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Excedente: ${n(calculo.excedenteMajorado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`;
        alertCell.fill = REDL;
        alertCell.font = { color: { argb: 'FFB91C1C' }, bold: true, size: 9 };
        alertCell.alignment = LEFT;
        ws.getRow(r).height = 16;
        r++;
    }
    if (csllBloqueada) {
        r++;
        ws.mergeCells(r, 1, r, 8);
        const infoCell = ws.getCell(r, 1);
        infoCell.value = 'ℹ  CSLL SEM MAJORAÇÃO (1T/2026) — MP 1.262/2024 · IN RFB 2.228/2024. Alíquota de acréscimo inaplicável neste período.';
        infoCell.fill = BLUEL;
        infoCell.font = { ...BLUE_FONT, bold: true, size: 9 };
        infoCell.alignment = LEFT;
        ws.getRow(r).height = 16;
        r++;
    }
    r++;
    // ── Tabela IRPJ ────────────────────────────────────────────────────────────
    r = renderSecaoLabel(ws, r, 8, 'CÁLCULO DO LUCRO PRESUMIDO — IRPJ');
    r = renderTabelaReceitas(ws, r, linhasIrpj, {
        receitaTotal: n(calculo.receitaTotal),
        excedente: n(calculo.excedenteMajorado),
        baseTotal: n(calculo.basePresumidaIrpj),
        houveExcedente,
        csllBloqueada: false,
    });
    r++;
    // ── Resumo lado a lado (cols 1-4 IRPJ, cols 6-9 CSLL) ────────────────────
    r = renderSecaoLabel(ws, r, 8, 'RESULTADO DO PERÍODO');
    // Cabeçalhos dos cards
    ws.mergeCells(r, 1, r, 4);
    const hIrpj = ws.getCell(r, 1);
    hIrpj.value = 'IRPJ — DARF 2089';
    hIrpj.fill = BLUE;
    hIrpj.font = { ...WHITE_FONT, bold: true, size: 10 };
    hIrpj.alignment = CENTER;
    ws.getRow(r).height = 18;
    ws.mergeCells(r, 5, r, 8);
    const hCsll = ws.getCell(r, 5);
    hCsll.value = csllBloqueada ? 'CSLL — DARF 2372  ·  Sem majoração (1T/2026)' : 'CSLL — DARF 2372';
    hCsll.fill = NAVY;
    hCsll.font = { ...WHITE_FONT, bold: true, size: 10 };
    hCsll.alignment = CENTER;
    r++;
    const irpjRows = [
        { label: 'Base de Cálculo', value: n(calculo.basePresumidaIrpj) },
        { label: 'IRPJ (15%)', value: n(calculo.irpj15) },
        { label: `Adicional IR (10%) — excedente a R$ 20.000/mês (R$ 60.000 no trimestre)`,
            value: n(calculo.adicionalIr10), highlight: n(calculo.adicionalIr10) > 0 },
        { label: 'IRPJ + Adicional', value: n(calculo.irpjTotal), bold: true },
        { label: '(−) IRRF', value: n(calculo.irrf), muted: true },
        { label: 'IRPJ a Recolher', value: n(calculo.irpjARecolher), total: true },
    ];
    const csllRows = [
        { label: 'Base de Cálculo', value: n(calculo.basePresumidaCsll) },
        { label: 'CSLL (9%)', value: n(calculo.csll9) },
        { label: '(−) CSLL Retida na Fonte', value: n(calculo.csllRetida), muted: true },
        { label: 'CSLL a Recolher', value: n(calculo.csllARecolher), total: true },
    ];
    const maxRows = Math.max(irpjRows.length, csllRows.length);
    for (let i = 0; i < maxRows; i++) {
        const il = irpjRows[i];
        const cl = csllRows[i];
        ws.getRow(r).height = 16;
        if (il) {
            ws.mergeCells(r, 1, r, 3);
            const lc = ws.getCell(r, 1);
            lc.value = il.label;
            lc.fill = il.total ? DARK2 : NAVY;
            lc.font = { ...(il.muted ? LIGHT_FONT : WHITE_FONT), bold: il.bold || il.total, size: 9 };
            lc.alignment = LEFT;
            lc.border = border('hair', 'FF1E3A5F');
            const vc = ws.getCell(r, 4);
            vc.value = il.value;
            vc.numFmt = BRL;
            vc.fill = il.total ? DARK2 : NAVY;
            vc.font = { color: { argb: il.total ? 'FF7DD3FC' : il.highlight ? 'FFFCD34D' : il.muted ? 'FF6B7A9A' : 'FFFFFFFF' }, bold: il.bold || il.total, size: 9 };
            vc.alignment = RIGHT;
            vc.border = border('hair', 'FF1E3A5F');
        }
        if (cl) {
            ws.mergeCells(r, 5, r, 7);
            const lc2 = ws.getCell(r, 5);
            lc2.value = cl.label;
            lc2.fill = cl.total ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1E3A' } } : DARK2;
            lc2.font = { ...(cl.muted ? LIGHT_FONT : WHITE_FONT), bold: cl.bold || cl.total, size: 9 };
            lc2.alignment = LEFT;
            lc2.border = border('hair', 'FF1E3A5F');
            const vc2 = ws.getCell(r, 8);
            vc2.value = cl.value;
            vc2.numFmt = BRL;
            vc2.fill = cl.total ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1E3A' } } : DARK2;
            vc2.font = { color: { argb: cl.total ? 'FF7DD3FC' : cl.muted ? 'FF6B7A9A' : 'FFFFFFFF' }, bold: cl.bold || cl.total, size: 9 };
            vc2.alignment = RIGHT;
            vc2.border = border('hair', 'FF1E3A5F');
        }
        r++;
    }
    r++;
    // ── Tabela CSLL ────────────────────────────────────────────────────────────
    r = renderSecaoLabel(ws, r, 8, 'CÁLCULO DO RESULTADO PRESUMIDO — CSLL');
    r = renderTabelaReceitas(ws, r, linhasCsll, {
        receitaTotal: n(calculo.receitaTotal),
        excedente: csllBloqueada ? 0 : n(calculo.excedenteMajorado),
        baseTotal: n(calculo.basePresumidaCsll),
        houveExcedente: houveExcedente && !csllBloqueada,
        csllBloqueada,
    });
    r += 2;
    // ── Residual da guia (apuração mensal) ────────────────────────────────────
    if (temPagMensais) {
        r = renderSecaoLabel(ws, r, 8, 'APURAÇÃO MENSAL — ANTECIPAÇÕES E GUIA RESIDUAL DO 3º MÊS');
        // Explicação
        ws.mergeCells(r, 1, r, 8);
        const expCell = ws.getCell(r, 1);
        expCell.value = 'A base de cálculo e a majoração são apuradas sobre o trimestre completo. Os pagamentos/antecipações dos meses anteriores são deduzidos para apurar o valor da guia do 3º mês.';
        expCell.fill = BLUEL;
        expCell.font = { ...MUTED_FONT, size: 9, italic: true };
        expCell.alignment = { ...LEFT, wrapText: true };
        ws.getRow(r).height = 20;
        r++;
        r++;
        // Cabeçalhos dos cards
        ws.mergeCells(r, 1, r, 4);
        const hIrpjR = ws.getCell(r, 1);
        hIrpjR.value = 'IRPJ — DARF 2089';
        hIrpjR.fill = NAVY;
        hIrpjR.font = { ...WHITE_FONT, bold: true, size: 10 };
        hIrpjR.alignment = CENTER;
        ws.mergeCells(r, 5, r, 8);
        const hCsllR = ws.getCell(r, 5);
        hCsllR.value = 'CSLL — DARF 2372';
        hCsllR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF112240' } };
        hCsllR.font = { ...WHITE_FONT, bold: true, size: 10 };
        hCsllR.alignment = CENTER;
        ws.getRow(r).height = 18;
        r++;
        const residualIrpj = [
            { label: 'IRPJ apurado no trimestre', value: n(calculo.irpjARecolher) },
        ];
        if (temDetalhamentoMensal) {
            residualIrpj.push({ label: `(−) Antecipação ${mesesTri[0]}`, value: irpjAntMes1, deducao: true });
            residualIrpj.push({ label: `(−) Antecipação ${mesesTri[1]}`, value: irpjAntMes2, deducao: true });
            residualIrpj.push({ label: 'Total antecipado', value: irpjMesesAnt, deducao: true });
        }
        else {
            residualIrpj.push({ label: '(−) Pagamentos/antecipações ant.', value: irpjMesesAnt, deducao: true });
        }
        residualIrpj.push({ label: `Guia ${mesesTri[2]}`, value: irpjResidual, total: true });
        if (irpjSaldoPagoMaior > 0) {
            residualIrpj.push({ label: 'Saldo pago a maior / crédito', value: irpjSaldoPagoMaior, credito: true });
        }
        const residualCsll = [
            { label: 'CSLL apurada no trimestre', value: n(calculo.csllARecolher) },
        ];
        if (temDetalhamentoMensal) {
            residualCsll.push({ label: `(−) Antecipação ${mesesTri[0]}`, value: csllAntMes1, deducao: true });
            residualCsll.push({ label: `(−) Antecipação ${mesesTri[1]}`, value: csllAntMes2, deducao: true });
            residualCsll.push({ label: 'Total antecipado', value: csllMesesAnt, deducao: true });
        }
        else {
            residualCsll.push({ label: '(−) Pagamentos/antecipações ant.', value: csllMesesAnt, deducao: true });
        }
        residualCsll.push({ label: `Guia ${mesesTri[2]}`, value: csllResidual, total: true });
        if (csllSaldoPagoMaior > 0) {
            residualCsll.push({ label: 'Saldo pago a maior / crédito', value: csllSaldoPagoMaior, credito: true });
        }
        const maxResidualRows = Math.max(residualIrpj.length, residualCsll.length);
        for (let i = 0; i < maxResidualRows; i++) {
            const il = residualIrpj[i];
            const cl = residualCsll[i];
            ws.getRow(r).height = (il?.total || cl?.total) ? 20 : 16;
            if (il) {
                ws.mergeCells(r, 1, r, 3);
                const lc = ws.getCell(r, 1);
                lc.value = il.label;
                lc.fill = il.total ? DARK2 : il.credito ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4ED' } } : NAVY;
                lc.font = { ...(il.deducao ? { color: { argb: 'FFFCA5A5' } } : il.credito ? { color: { argb: 'FF1B7A4E' }, bold: true } : WHITE_FONT), bold: il.total, size: 9 };
                lc.alignment = LEFT;
                lc.border = border('hair', 'FF1E3A5F');
                const vc = ws.getCell(r, 4);
                vc.value = il.value;
                vc.numFmt = BRL;
                vc.fill = il.total ? DARK2 : il.credito ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4ED' } } : NAVY;
                vc.font = { color: { argb: il.total ? 'FF7DD3FC' : il.deducao ? 'FFFCA5A5' : il.credito ? 'FF1B7A4E' : 'FFFFFFFF' }, bold: il.total || il.credito, size: il.total ? 10 : 9 };
                vc.alignment = RIGHT;
                vc.border = border('hair', 'FF1E3A5F');
            }
            if (cl) {
                ws.mergeCells(r, 5, r, 7);
                const lc2 = ws.getCell(r, 5);
                lc2.value = cl.label;
                lc2.fill = cl.total ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1E3A' } } : cl.credito ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4ED' } } : DARK2;
                lc2.font = { ...(cl.deducao ? { color: { argb: 'FFFCA5A5' } } : cl.credito ? { color: { argb: 'FF1B7A4E' }, bold: true } : WHITE_FONT), bold: cl.total, size: 9 };
                lc2.alignment = LEFT;
                lc2.border = border('hair', 'FF1E3A5F');
                const vc2 = ws.getCell(r, 8);
                vc2.value = cl.value;
                vc2.numFmt = BRL;
                vc2.fill = cl.total ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1E3A' } } : cl.credito ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F4ED' } } : DARK2;
                vc2.font = { color: { argb: cl.total ? 'FF7DD3FC' : cl.deducao ? 'FFFCA5A5' : cl.credito ? 'FF1B7A4E' : 'FFFFFFFF' }, bold: cl.total || cl.credito, size: cl.total ? 10 : 9 };
                vc2.alignment = RIGHT;
                vc2.border = border('hair', 'FF1E3A5F');
            }
            r++;
        }
        // Nota legal
        r++;
        ws.mergeCells(r, 1, r, 8);
        const notaR = ws.getCell(r, 1);
        notaR.value = 'Base legal: art. 5º da Lei nº 9.430/1996 — as antecipações dos meses 1 e 2 são calculadas sobre a receita do mês isolado, SEM majoração. A majoração é regra trimestral, apurada no fechamento do 3º mês. A guia residual ajusta a diferença.';
        notaR.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F8' } };
        notaR.font = { ...MUTED_FONT, italic: true, size: 8 };
        notaR.alignment = LEFT;
        ws.getRow(r).height = 14;
        r += 2;
    }
    // ── Enquadramento Legal ────────────────────────────────────────────────────
    r = renderSecaoLabel(ws, r, 8, 'ENQUADRAMENTO LEGAL E NOTAS TÉCNICAS');
    const notas = [];
    notas.push({
        titulo: 'Regime Tributário — Lucro Presumido',
        texto: 'Apuração trimestral do IRPJ e da CSLL com base no Lucro Presumido, conforme arts. 516 a 528 do RIR/2018 (Decreto nº 9.580/2018) e Lei nº 9.430/1996. A base de cálculo é determinada pela aplicação dos percentuais de presunção sobre a receita bruta de cada atividade.',
        fillArgb: 'FFE8EFF8', fontArgb: 'FF0D47A1',
    });
    if (n(calculo.adicionalIr10) > 0) {
        notas.push({
            titulo: 'Adicional do IRPJ (10%)',
            texto: `Incide sobre a parcela da base de cálculo que exceder R$ 20.000,00/mês (R$ 60.000,00 no trimestre), conforme art. 3º, § 1º da Lei nº 9.249/1995 e art. 543 do RIR/2018. Adicional apurado: ${n(calculo.adicionalIr10).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`,
            fillArgb: 'FFFFF3CD', fontArgb: 'FFB45309',
        });
    }
    if (houveExcedente) {
        notas.push({
            titulo: 'Majoração Aplicada — IRPJ (Excedente a R$ 1.250.000,00)',
            texto: `Receita trimestral de ${n(calculo.receitaTotal).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} ultrapassou o limite de ${LIMITE_MAJORACAO.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}. Excedente de ${n(calculo.excedenteMajorado).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} submetido ao percentual de presunção acrescido de 10 p.p., conforme art. 2º da Lei nº 9.430/1996 e IN RFB nº 1.700/2017.`,
            fillArgb: 'FFFEE2E2', fontArgb: 'FFB91C1C',
        });
    }
    if (csllBloqueada) {
        notas.push({
            titulo: 'CSLL — Majoração Não Exigível no 1º Trimestre/2026 (QDMTT/BEPS)',
            texto: 'A alíquota de acréscimo de 10% na CSLL é inaplicável no 1º trimestre de 2026 (jan–mar/2026). A CSLL majorada (QDMTT — Qualified Domestic Minimum Top-up Tax) foi instituída pela MP nº 1.262/2024 e regulamentada pela IN RFB nº 2.228/2024, com vigência a partir do 2º trimestre de 2026 (abr/2026 em diante), em implementação faseada do Pilar 2 da OCDE. A CSLL foi apurada integralmente sobre a presunção de 12%/32% sem excedente.',
            fillArgb: 'FFEFF6FF', fontArgb: 'FF0D47A1',
        });
    }
    else if (houveExcedente) {
        notas.push({
            titulo: 'CSLL — Majoração Aplicada',
            texto: `O mesmo excedente apurado para o IRPJ foi aplicado à base de cálculo da CSLL, com acréscimo de 10 p.p. sobre o percentual de presunção, conforme art. 2º da Lei nº 9.430/1996.`,
            fillArgb: 'FFFEE2E2', fontArgb: 'FFB91C1C',
        });
    }
    if (n(calculo.irrf) > 0) {
        notas.push({
            titulo: 'IRRF Deduzido',
            texto: `IRRF de ${n(calculo.irrf).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deduzido do IRPJ apurado, conforme art. 76 da Lei nº 8.981/1995 e art. 76 da Lei nº 9.430/1996.`,
            fillArgb: 'FFF2F4F8', fontArgb: 'FF4A5468',
        });
    }
    if (n(calculo.csllRetida) > 0) {
        notas.push({
            titulo: 'CSLL Retida na Fonte Deduzida',
            texto: `CSLL Retida de ${n(calculo.csllRetida).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} deduzida da CSLL apurada, conforme art. 30 da Lei nº 10.833/2003.`,
            fillArgb: 'FFF2F4F8', fontArgb: 'FF4A5468',
        });
    }
    notas.forEach((nota, idx) => {
        // Linha título
        ws.mergeCells(r, 1, r, 8);
        const tCell = ws.getCell(r, 1);
        tCell.value = `${idx + 1}.  ${nota.titulo}`;
        tCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: nota.fillArgb } };
        tCell.font = { color: { argb: nota.fontArgb }, bold: true, size: 9 };
        tCell.alignment = { ...LEFT, wrapText: false };
        tCell.border = { left: { style: 'medium', color: { argb: nota.fontArgb } } };
        ws.getRow(r).height = 16;
        r++;
        // Linha texto
        ws.mergeCells(r, 1, r, 8);
        const txCell = ws.getCell(r, 1);
        txCell.value = nota.texto;
        txCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: nota.fillArgb } };
        txCell.font = { color: { argb: 'FF4A5468' }, size: 8 };
        txCell.alignment = { ...LEFT, wrapText: true };
        txCell.border = { left: { style: 'medium', color: { argb: nota.fontArgb } } };
        ws.getRow(r).height = 30;
        r++;
    });
    r++;
    // Assinatura
    ws.mergeCells(r, 1, r, 8);
    const assinCell = ws.getCell(r, 1);
    assinCell.value = `Documento gerado pelo Sistema de Apuração do Lucro Presumido   ·   Cálculo realizado em ${new Date(calculo.criadoEm).toLocaleString('pt-BR')} por ${calculo.usuarioCriacao.nome}   ·   Exportado em ${new Date().toLocaleString('pt-BR')}`;
    assinCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F8' } };
    assinCell.font = { ...MUTED_FONT, italic: true, size: 8 };
    assinCell.alignment = CENTER;
    ws.getRow(r).height = 16;
    r++;
    ws.mergeCells(r, 1, r, 8);
    const aviso = ws.getCell(r, 1);
    aviso.value = 'Este documento tem caráter informativo. Os valores apurados devem ser conferidos pelo responsável tributário antes do recolhimento.';
    aviso.font = { ...MUTED_FONT, italic: true, size: 7.5 };
    aviso.alignment = CENTER;
    ws.getRow(r).height = 14;
    r++;
    // ── Rodapé ─────────────────────────────────────────────────────────────────
    ws.mergeCells(r, 1, r, 8);
    const rodape = ws.getCell(r, 1);
    rodape.value = `Lucro Presumido — ${TRIMESTRES[calculo.trimestre]} ${calculo.ano}   ·   Cálculo: ${new Date(calculo.criadoEm).toLocaleString('pt-BR')}   ·   Exportação: ${new Date().toLocaleString('pt-BR')}`;
    rodape.fill = NAVY;
    rodape.font = { ...WHITE_FONT, size: 8 };
    rodape.alignment = CENTER;
    ws.getRow(r).height = 18;
    // ── Aba 2: Linha do Tempo (apenas modalidade mensal com receitasMensais) ──
    const modalidadeXl = String(detalhe?.modalidadeRecolhimento ?? 'trimestral');
    if (modalidadeXl === 'mensal' && calculo.receitasMensais && calculo.receitasMensais.length >= 3) {
        const rm = calculo.receitasMensais;
        const mesesNomesXl = MESES_TRI_XL_CONST[calculo.trimestre] ?? ['Mes 1', 'Mes 2', 'Mes 3'];
        const irpjResidualXl = Math.max(0, n(calculo.irpjARecolher) - n(detalhe?.irpjMesesAnteriores ?? 0));
        const csllResidualXl = Math.max(0, n(calculo.csllARecolher) - n(detalhe?.csllMesesAnteriores ?? 0));
        const wlt = wb.addWorksheet('Linha do Tempo', {
            pageSetup: { paperSize: 9, orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
        });
        wlt.views = [{ showGridLines: false }];
        // Larguras das colunas
        wlt.getColumn(1).width = 28;
        for (let ci = 2; ci <= 8; ci++)
            wlt.getColumn(ci).width = 16;
        let lr = 1;
        // Linha 1: título
        wlt.mergeCells(lr, 1, lr, 8);
        const ltTitulo = wlt.getCell(lr, 1);
        ltTitulo.value = 'LINHA DO TEMPO — APURACAO MENSAL DO TRIMESTRE';
        ltTitulo.fill = NAVY;
        ltTitulo.font = { ...WHITE_FONT, bold: true, size: 13 };
        ltTitulo.alignment = CENTER;
        wlt.getRow(lr).height = 26;
        lr++;
        // Linha 2: empresa + período
        wlt.mergeCells(lr, 1, lr, 8);
        const ltPeriodo = wlt.getCell(lr, 1);
        const empNomeXl = calculo.empresa ? (calculo.empresa.nomeFantasia || calculo.empresa.razaoSocial) : '';
        const cnpjXl = calculo.empresa?.cnpj ? `   ·   CNPJ: ${calculo.empresa.cnpj}` : '';
        ltPeriodo.value = `${empNomeXl}${cnpjXl}   ·   ${TRIMESTRES[calculo.trimestre]} ${calculo.ano}`;
        ltPeriodo.fill = BLUE;
        ltPeriodo.font = { ...WHITE_FONT, bold: true, size: 10 };
        ltPeriodo.alignment = CENTER;
        wlt.getRow(lr).height = 18;
        lr++;
        // Linha 3: cabeçalho da tabela
        const ltHdrs = ['Mes', 'Receita Bruta', 'Base IRPJ', 'IRPJ 15%', 'Adicional 10%', 'IRPJ a Recolher', 'Base CSLL', 'CSLL a Recolher'];
        ltHdrs.forEach((h, i) => {
            const cell = wlt.getCell(lr, i + 1);
            cell.value = h;
            cell.fill = NAVY;
            cell.font = { ...WHITE_FONT, bold: true, size: 8 };
            cell.alignment = i === 0 ? LEFT : RIGHT;
            cell.border = border('thin', 'FF0A1628');
        });
        wlt.getRow(lr).height = 18;
        lr++;
        function calcMesAntXl(m, nomeMes) {
            const receitaBruta = m.receita32 + m.receita8 + m.receita16 + m.receita16p + m.outrasReceitas;
            const baseIrpj = m.receita32 * 0.32 + m.receita8 * 0.08 + m.receita16 * 0.016 + m.receita16p * 0.16 + m.outrasReceitas;
            const irpj15v = baseIrpj * 0.15;
            const adicional = Math.max(0, baseIrpj - LIMITE_ADICIONAL_MENSAL_XL) * 0.10;
            const irpjRecolher = Math.max(0, irpj15v + adicional - m.irrf);
            const baseCsll = m.receita32 * 0.32 + (m.receita16 + m.receita8 + m.receita16p) * 0.12 + m.outrasReceitas;
            const csllRecolher = Math.max(0, baseCsll * 0.09 - m.csllRetida);
            return { nome: nomeMes, receitaBruta, baseIrpj, irpj15: irpj15v, adicional, irpjRecolher, baseCsll, csllRecolher, fechamento: false };
        }
        const ltMes1 = calcMesAntXl(rm[0], `${mesesNomesXl[0]} (antecipacao)`);
        const ltMes2 = calcMesAntXl(rm[1], `${mesesNomesXl[1]} (antecipacao)`);
        const receitaBrutaMes3Xl = rm[2].receita32 + rm[2].receita8 + rm[2].receita16 + rm[2].receita16p + rm[2].outrasReceitas;
        const ltMes3 = {
            nome: `${mesesNomesXl[2]} (fechamento trimestral)`,
            receitaBruta: receitaBrutaMes3Xl,
            baseIrpj: n(calculo.basePresumidaIrpj),
            irpj15: n(calculo.irpj15),
            adicional: n(calculo.adicionalIr10),
            irpjRecolher: irpjResidualXl,
            baseCsll: n(calculo.basePresumidaCsll),
            csllRecolher: csllResidualXl,
            fechamento: true,
        };
        const ltMeses = [ltMes1, ltMes2, ltMes3];
        // Linhas 4-6: dados dos meses
        ltMeses.forEach((m, idx) => {
            const bg = m.fechamento ? BLUEL : (idx % 2 === 0 ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } } : ALT);
            const fontBase = m.fechamento
                ? { ...BLUE_FONT, bold: true, size: 9 }
                : { ...NAVY_FONT, size: 9 };
            wlt.getCell(lr, 1).value = m.nome;
            wlt.getCell(lr, 1).fill = bg;
            wlt.getCell(lr, 1).font = fontBase;
            wlt.getCell(lr, 1).alignment = LEFT;
            wlt.getCell(lr, 1).border = border('hair');
            const vals = [m.receitaBruta, m.baseIrpj, m.irpj15, m.adicional, m.irpjRecolher, m.baseCsll, m.csllRecolher];
            vals.forEach((v, i) => {
                const cell = wlt.getCell(lr, i + 2);
                cell.value = v;
                cell.numFmt = BRL;
                cell.fill = bg;
                cell.font = fontBase;
                cell.alignment = RIGHT;
                cell.border = border('hair');
            });
            wlt.getRow(lr).height = 16;
            lr++;
        });
        // Linha 7: totais
        const totalRecBruta = ltMes1.receitaBruta + ltMes2.receitaBruta + ltMes3.receitaBruta;
        const ltTotalVals = [
            totalRecBruta,
            ltMes1.baseIrpj + ltMes2.baseIrpj + ltMes3.baseIrpj,
            ltMes1.irpj15 + ltMes2.irpj15 + ltMes3.irpj15,
            ltMes1.adicional + ltMes2.adicional + ltMes3.adicional,
            n(calculo.irpjARecolher),
            ltMes1.baseCsll + ltMes2.baseCsll + ltMes3.baseCsll,
            n(calculo.csllARecolher),
        ];
        wlt.getCell(lr, 1).value = 'TOTAL DO TRIMESTRE';
        wlt.getCell(lr, 1).fill = TOTAL;
        wlt.getCell(lr, 1).font = { ...NAVY_FONT, bold: true, size: 9 };
        wlt.getCell(lr, 1).alignment = LEFT;
        wlt.getCell(lr, 1).border = border('thin', 'FFB0BDD0');
        ltTotalVals.forEach((v, i) => {
            const cell = wlt.getCell(lr, i + 2);
            cell.value = v;
            cell.numFmt = BRL;
            cell.fill = TOTAL;
            cell.font = { ...NAVY_FONT, bold: true, size: 9 };
            cell.alignment = RIGHT;
            cell.border = border('thin', 'FFB0BDD0');
        });
        wlt.getRow(lr).height = 18;
        lr++;
        // Linha 8: nota legal
        wlt.mergeCells(lr, 1, lr, 8);
        const ltNota = wlt.getCell(lr, 1);
        ltNota.value = 'Meses 1 e 2: antecipacoes calculadas sobre a receita do mes isolado, sem majoracao (art. 5o Lei 9.430/1996). Mes 3: fechamento trimestral com apuracao completa. Guia residual = imposto apurado no trimestre menos antecipacoes pagas.';
        ltNota.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F4F8' } };
        ltNota.font = { ...MUTED_FONT, italic: true, size: 8 };
        ltNota.alignment = { ...LEFT, wrapText: true };
        wlt.getRow(lr).height = 24;
        lr++;
    }
    const buf = await wb.xlsx.writeBuffer();
    return Buffer.from(buf);
}
// ── Helpers ──────────────────────────────────────────────────────────────────
function renderSecaoLabel(ws, r, cols, label) {
    ws.mergeCells(r, 1, r, cols);
    const cell = ws.getCell(r, 1);
    cell.value = label;
    cell.fill = NAVY;
    cell.font = { ...WHITE_FONT, bold: true, size: 9 };
    cell.alignment = LEFT;
    ws.getRow(r).height = 16;
    return r + 1;
}
function renderTabelaReceitas(ws, r, linhas, opts) {
    const HEADERS = [
        'Discriminação das Receitas',
        'Valor (R$)', 'Proporção',
        'Parc. s/ Acréscimo', '% Aplicável',
        'Parc. c/ Acréscimo', '% c/ Acréscimo',
        'Base de Cálculo',
    ];
    // Cabeçalho
    const hRow = ws.getRow(r);
    hRow.height = 18;
    HEADERS.forEach((h, i) => {
        const cell = ws.getCell(r, i + 1);
        cell.value = h;
        cell.fill = BLUE;
        cell.font = { ...WHITE_FONT, bold: true, size: 8 };
        cell.alignment = i === 0 ? LEFT : CENTER;
        cell.border = border('thin', 'FF0D47A1');
    });
    r++;
    // Linhas de dados
    linhas.forEach((l, idx) => {
        const bg = idx % 2 === 0 ? { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFFFFF' } }
            : ALT;
        const temExcedente = opts.houveExcedente && l.parcelaComAcrescimo > 0;
        ws.getRow(r).height = 15;
        const cells = [
            { value: l.descricao, align: LEFT },
            { value: n(l.valor), numFmt: BRL },
            { value: n(l.proporcao), numFmt: PCT, font: MUTED_FONT },
            { value: n(l.parcelaSemAcrescimo), numFmt: BRL },
            { value: n(l.aliquota), numFmt: PCT, font: MUTED_FONT },
            { value: n(l.parcelaComAcrescimo), numFmt: BRL, font: temExcedente ? RED_FONT : MUTED_FONT },
            { value: n(l.aliquotaAcrescimo), numFmt: PCT, font: temExcedente ? RED_FONT : MUTED_FONT },
            { value: n(l.baseCalculo), numFmt: BRL, font: { ...BLUE_FONT, bold: true } },
        ];
        cells.forEach((c, i) => {
            const cell = ws.getCell(r, i + 1);
            cell.value = c.value;
            if (c.numFmt)
                cell.numFmt = c.numFmt;
            cell.fill = bg;
            cell.font = { size: 9, ...(c.font ?? NAVY_FONT) };
            cell.alignment = c.align ?? RIGHT;
            cell.border = border('hair');
        });
        r++;
    });
    // Linha de total
    ws.getRow(r).height = 16;
    const totalVals = [
        'Total da Receita Bruta',
        opts.receitaTotal,
        1,
        opts.houveExcedente ? LIMITE_MAJORACAO : opts.receitaTotal,
        '',
        opts.houveExcedente ? opts.excedente : 0,
        '',
        opts.baseTotal,
    ];
    totalVals.forEach((v, i) => {
        const cell = ws.getCell(r, i + 1);
        cell.value = v;
        cell.fill = TOTAL;
        cell.font = {
            size: 9, bold: true,
            color: { argb: i === 5 && opts.houveExcedente ? 'FFB91C1C' : i === 7 ? 'FF0D47A1' : 'FF0A1628' },
        };
        cell.alignment = i === 0 ? LEFT : RIGHT;
        cell.border = border('thin', 'FFB0BDD0');
        if (i === 1 || i === 3 || i === 5 || i === 7)
            cell.numFmt = BRL;
        if (i === 2)
            cell.numFmt = PCT;
    });
    r++;
    return r;
}
