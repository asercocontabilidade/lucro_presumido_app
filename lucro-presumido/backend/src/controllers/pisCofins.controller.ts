import { Request, Response } from 'express';
import * as pisCofinsService from '../services/pisCofins.service';

export async function calcularPreview(req: Request, res: Response) {
  try {
    const entrada = req.body as pisCofinsService.EntradaPisCofins;
    if (!entrada.ano || !entrada.mes || !entrada.regimePisCofins) {
      return res.status(400).json({ error: 'ano, mes e regimePisCofins são obrigatórios' });
    }
    const resultado = pisCofinsService.calcularPisCofins(entrada);
    res.json(resultado);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular PIS/COFINS' });
  }
}

export async function salvar(req: Request, res: Response) {
  try {
    const entrada = req.body as pisCofinsService.EntradaPisCofins;
    const resultado = pisCofinsService.calcularPisCofins(entrada);
    const registro = await pisCofinsService.salvarCalculo(entrada, resultado);
    res.status(201).json({ ...registro, resultado });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao salvar cálculo PIS/COFINS' });
  }
}

export async function listar(req: Request, res: Response) {
  try {
    const { empresaId, ano } = req.query;
    const calculos = await pisCofinsService.listarCalculos(
      empresaId as string,
      ano ? Number(ano) : undefined
    );
    res.json(calculos);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao listar cálculos PIS/COFINS' });
  }
}

export async function buscarPorId(req: Request, res: Response) {
  try {
    const calculo = await pisCofinsService.buscarCalculoPorId(req.params.id);
    if (!calculo) return res.status(404).json({ error: 'Cálculo não encontrado' });
    res.json(calculo);
  } catch (err) {
    res.status(500).json({ error: 'Erro ao buscar cálculo' });
  }
}

export async function calcularVencimento(req: Request, res: Response) {
  try {
    const { ano, mes } = req.query;
    if (!ano || !mes) return res.status(400).json({ error: 'ano e mes são obrigatórios' });
    const data = pisCofinsService.calcularVencimento(Number(ano), Number(mes));
    res.json({ dataVencimento: data });
  } catch (err) {
    res.status(500).json({ error: 'Erro ao calcular vencimento' });
  }
}
