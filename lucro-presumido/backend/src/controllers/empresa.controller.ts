import { Request, Response } from 'express';
import * as empresaService from '../services/empresa.service';

export async function listar(req: Request, res: Response) {
  try {
    const { busca, regimeTributario, page, limit } = req.query;
    const resultado = await empresaService.listarEmpresas({
      busca: busca as string,
      regimeTributario: regimeTributario as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 50,
    });
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar empresas' });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  try {
    const empresa = await empresaService.buscarEmpresaPorId(req.params.id);
    if (!empresa) return res.status(404).json({ error: 'Empresa não encontrada' });
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar empresa' });
  }
}

export async function criar(req: Request, res: Response) {
  try {
    const empresa = await empresaService.criarEmpresa(req.body);
    res.status(201).json(empresa);
  } catch (err: any) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'CNPJ já cadastrado' });
    }
    res.status(500).json({ error: 'Erro ao criar empresa' });
  }
}

export async function atualizar(req: Request, res: Response) {
  try {
    const empresa = await empresaService.atualizarEmpresa(req.params.id, req.body);
    res.json(empresa);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao atualizar empresa' });
  }
}

export async function desativar(req: Request, res: Response) {
  try {
    await empresaService.desativarEmpresa(req.params.id);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao desativar empresa' });
  }
}

export async function listarPercentuais(req: Request, res: Response) {
  try {
    const percentuais = await empresaService.listarPercentuaisPresuncao();
    res.json(percentuais);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar percentuais' });
  }
}
