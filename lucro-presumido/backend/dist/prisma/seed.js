"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const senhaHash = await bcryptjs_1.default.hash('admin123', 10);
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
