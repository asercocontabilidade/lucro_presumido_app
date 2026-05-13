import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function listar(req: Request, res: Response) {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, perfil: true, ativo: true, criadoEm: true },
    orderBy: { nome: 'asc' },
  });
  return res.json(usuarios);
}

export async function criar(req: Request, res: Response) {
  const { nome, email, senha, perfil } = req.body;
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado.' });

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, perfil: perfil ?? 'USUARIO' },
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true },
  });
  return res.status(201).json(usuario);
}

export async function atualizar(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { nome, email, perfil, ativo } = req.body;
  const usuario = await prisma.usuario.update({
    where: { id },
    data: { nome, email, perfil, ativo },
    select: { id: true, nome: true, email: true, perfil: true, ativo: true },
  });
  return res.json(usuario);
}

export async function resetarSenha(req: Request, res: Response) {
  const id = Number(req.params.id);
  const { novaSenha } = req.body;
  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({ where: { id }, data: { senhaHash } });
  return res.json({ mensagem: 'Senha redefinida com sucesso.' });
}
