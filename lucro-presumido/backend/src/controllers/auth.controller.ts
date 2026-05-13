import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function login(req: Request, res: Response) {
  const { email, senha } = req.body;
  if (!email || !senha) {
    return res.status(400).json({ erro: 'E-mail e senha são obrigatórios.' });
  }

  const usuario = await prisma.usuario.findUnique({ where: { email } });
  if (!usuario || !usuario.ativo) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const senhaValida = await bcrypt.compare(senha, usuario.senhaHash);
  if (!senhaValida) {
    return res.status(401).json({ erro: 'Credenciais inválidas.' });
  }

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  return res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });
}

export async function perfil(req: Request, res: Response) {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.usuario!.id },
    select: { id: true, nome: true, email: true, perfil: true, criadoEm: true },
  });
  return res.json(usuario);
}

export async function registrar(req: Request, res: Response) {
  const { nome, email, senha } = req.body;
  if (!nome || !email || !senha) {
    return res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios.' });
  }
  if (senha.length < 6) {
    return res.status(400).json({ erro: 'A senha deve ter pelo menos 6 caracteres.' });
  }

  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) return res.status(409).json({ erro: 'E-mail já cadastrado.' });

  const senhaHash = await bcrypt.hash(senha, 10);
  const usuario = await prisma.usuario.create({
    data: { nome, email, senhaHash, perfil: 'USUARIO' },
  });

  const token = jwt.sign(
    { id: usuario.id, email: usuario.email, perfil: usuario.perfil },
    process.env.JWT_SECRET!,
    { expiresIn: '8h' }
  );

  return res.status(201).json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
  });
}

export async function alterarSenha(req: Request, res: Response) {
  const { senhaAtual, novaSenha } = req.body;
  const usuario = await prisma.usuario.findUnique({ where: { id: req.usuario!.id } });
  if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });

  const valida = await bcrypt.compare(senhaAtual, usuario.senhaHash);
  if (!valida) return res.status(400).json({ erro: 'Senha atual incorreta.' });

  const senhaHash = await bcrypt.hash(novaSenha, 10);
  await prisma.usuario.update({ where: { id: usuario.id }, data: { senhaHash } });
  return res.json({ mensagem: 'Senha alterada com sucesso.' });
}
