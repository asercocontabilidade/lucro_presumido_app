import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
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
  console.log('Seed concluído. Usuário admin criado: admin@empresa.com.br / admin123');
}

main().catch(console.error).finally(() => prisma.$disconnect());
