import { Router } from 'express';
import { login, perfil, alterarSenha, registrar } from '../controllers/auth.controller';
import * as calculo from '../controllers/calculo.controller';
import * as usuario from '../controllers/usuario.controller';
import * as empresa from '../controllers/empresa.controller';
import * as pisCofins from '../controllers/pisCofins.controller';
import * as feedback from '../controllers/feedback.controller';
import { autenticar, apenasAdmin } from '../middleware/auth.middleware';
import { consolidarAnual } from '../services/relatorioAnual.service';

const router = Router();

// ─── Auth ────────────────────────────────────────────────────────────────────
router.post('/auth/login', login);
router.post('/auth/registrar', registrar);
router.get('/auth/perfil', autenticar, perfil);
router.put('/auth/senha', autenticar, alterarSenha);

// ─── Relatório Anual ──────────────────────────────────────────────────────────
router.get('/relatorio-anual', autenticar, async (req, res, next) => {
  try {
    const { empresaId, ano } = req.query;
    if (!ano) return res.status(400).json({ erro: 'Parâmetro "ano" é obrigatório.' });
    const anoNum = Number(ano);
    if (isNaN(anoNum) || anoNum < 2000 || anoNum > 2100) {
      return res.status(400).json({ erro: 'Ano inválido.' });
    }
    const resultado = await consolidarAnual(
      empresaId ? String(empresaId) : null,
      anoNum
    );
    return res.json(resultado);
  } catch (err) { return next(err); }
});

// ─── Cálculos Majoração (fluxo original) ─────────────────────────────────────
router.get('/calculos', autenticar, calculo.listar);
router.get('/calculos/dashboard', autenticar, calculo.dashboard);
router.get('/calculos/:id', autenticar, calculo.buscarPorId);
router.post('/calculos/preview', autenticar, calculo.calcularPreview);
router.post('/calculos', autenticar, calculo.criar);
router.put('/calculos/:id', autenticar, calculo.atualizar);
router.delete('/calculos/:id', autenticar, calculo.excluir);
router.post('/calculos/:id/duplicar', autenticar, calculo.duplicar);
router.get('/calculos/:id/pdf', autenticar, calculo.exportarPdf);
router.get('/calculos/:id/excel', autenticar, calculo.exportarExcel);

// ─── Empresas ─────────────────────────────────────────────────────────────────
router.get('/empresas', autenticar, empresa.listar);
router.get('/empresas/percentuais', autenticar, empresa.listarPercentuais);
router.get('/empresas/:id', autenticar, empresa.buscarPorId);
router.post('/empresas', autenticar, empresa.criar);
router.put('/empresas/:id', autenticar, empresa.atualizar);
router.delete('/empresas/:id', autenticar, empresa.desativar);

// ─── PIS / COFINS ─────────────────────────────────────────────────────────────
router.get('/pis-cofins', autenticar, pisCofins.listar);
router.get('/pis-cofins/vencimento', autenticar, pisCofins.calcularVencimento);
router.get('/pis-cofins/:id', autenticar, pisCofins.buscarPorId);
router.post('/pis-cofins/preview', autenticar, pisCofins.calcularPreview);
router.post('/pis-cofins', autenticar, pisCofins.salvar);

// ─── Feedback / Sugestões ─────────────────────────────────────────────────────
router.get('/feedbacks',     autenticar, feedback.listar);
router.post('/feedbacks',    autenticar, feedback.criar);
router.put('/feedbacks/:id', autenticar, feedback.atualizar);
router.delete('/feedbacks/:id', autenticar, feedback.excluir);

// ─── Usuários (admin) ─────────────────────────────────────────────────────────
router.get('/usuarios', autenticar, apenasAdmin, usuario.listar);
router.post('/usuarios', autenticar, apenasAdmin, usuario.criar);
router.put('/usuarios/:id', autenticar, apenasAdmin, usuario.atualizar);
router.put('/usuarios/:id/senha', autenticar, apenasAdmin, usuario.resetarSenha);

export default router;
