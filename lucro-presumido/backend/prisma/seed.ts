import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Admin padrão
  const senhaHash = await bcrypt.hash('admin123', 10);
  await prisma.usuario.upsert({
    where: { email: 'admin@empresa.com.br' },
    update: {},
    create: {
      nome: 'Administrador',
      email: 'admin@empresa.com.br',
      senhaHash,
      perfil: 'ADMIN',
    },
  });

  // Percentuais de presunção por atividade (Art. 15 Lei 9.249/1995)
  const percentuais = [
    { codigoAtividade: 'COM', descricaoAtividade: 'Comércio e indústria / Revenda de mercadorias', percIrpj: 8, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'TRC', descricaoAtividade: 'Transporte de cargas', percIrpj: 8, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'TRP', descricaoAtividade: 'Transporte de passageiros', percIrpj: 16, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'SRV', descricaoAtividade: 'Prestação de serviços em geral', percIrpj: 32, percCsll: 32, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'IMO', descricaoAtividade: 'Atividades imobiliárias', percIrpj: 8, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'HSP', descricaoAtividade: 'Serviços hospitalares (com estrutura mínima)', percIrpj: 8, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'MED', descricaoAtividade: 'Serviços de saúde sem estrutura hospitalar', percIrpj: 32, percCsll: 32, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'FIN', descricaoAtividade: 'Intermediação financeira, banco, seguradora', percIrpj: 16, percCsll: 12, baseLegal: 'Art. 15 Lei 9.249/1995' },
    { codigoAtividade: 'INT', descricaoAtividade: 'Intermediação de negócios, representação comercial', percIrpj: 32, percCsll: 32, baseLegal: 'Art. 15 Lei 9.249/1995' },
  ];

  for (const p of percentuais) {
    await prisma.percentualPresuncao.upsert({
      where: { codigoAtividade: p.codigoAtividade },
      update: p,
      create: p,
    });
  }

  // Parâmetros do sistema
  const parametros = [
    { chave: 'irpj_aliquota_base', valor: '15', descricao: 'Alíquota base IRPJ (%)' },
    { chave: 'irpj_adicional', valor: '10', descricao: 'Adicional IRPJ sobre base acima do limite (%)' },
    { chave: 'irpj_limite_adicional_mensal', valor: '20000', descricao: 'Limite mensal para adicional IRPJ (R$)' },
    { chave: 'csll_aliquota_geral', valor: '9', descricao: 'Alíquota CSLL geral (%)' },
    { chave: 'pis_cumulativo', valor: '0.65', descricao: 'PIS regime cumulativo (%)' },
    { chave: 'cofins_cumulativa', valor: '3.00', descricao: 'COFINS regime cumulativo (%)' },
    { chave: 'pis_nao_cumulativo', valor: '1.65', descricao: 'PIS regime não-cumulativo (%)' },
    { chave: 'cofins_nao_cumulativa', valor: '7.60', descricao: 'COFINS regime não-cumulativo (%)' },
    { chave: 'majoracao_csll_vigencia_inicio', valor: '2026-04-01', descricao: '1T/2026 sem CSLL majorada; inicia 2T/2026 (MP 1.262/2024)' },
    { chave: 'majoracao_irpj_vigencia_inicio', valor: '2026-01-01', descricao: 'Majoração IRPJ desde 1T/2026' },
  ];

  for (const p of parametros) {
    await prisma.parametroSistema.upsert({
      where: { chave: p.chave },
      update: { valor: p.valor, descricao: p.descricao },
      create: p,
    });
  }

  console.log('Seed concluído.');
  console.log('Login: admin@empresa.com.br / admin123');
  console.log(`${percentuais.length} percentuais de presunção inseridos.`);
  console.log(`${parametros.length} parâmetros do sistema inseridos.`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
