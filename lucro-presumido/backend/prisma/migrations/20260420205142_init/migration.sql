-- CreateTable
CREATE TABLE "usuarios" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senhaHash" TEXT NOT NULL,
    "perfil" TEXT NOT NULL DEFAULT 'USUARIO',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "calculos_trimestrais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ano" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "descricao" TEXT,
    "receita16" REAL NOT NULL DEFAULT 0,
    "receita8" REAL NOT NULL DEFAULT 0,
    "receita16p" REAL NOT NULL DEFAULT 0,
    "receita32" REAL NOT NULL DEFAULT 0,
    "outrasReceitas" REAL NOT NULL DEFAULT 0,
    "receitaTotal" REAL NOT NULL DEFAULT 0,
    "excedenteMajorado" REAL NOT NULL DEFAULT 0,
    "basePresumidaIrpj" REAL NOT NULL DEFAULT 0,
    "irpj15" REAL NOT NULL DEFAULT 0,
    "adicionalIr10" REAL NOT NULL DEFAULT 0,
    "irpjTotal" REAL NOT NULL DEFAULT 0,
    "irrf" REAL NOT NULL DEFAULT 0,
    "irpjARecolher" REAL NOT NULL DEFAULT 0,
    "basePresumidaCsll" REAL NOT NULL DEFAULT 0,
    "csll9" REAL NOT NULL DEFAULT 0,
    "csllRetida" REAL NOT NULL DEFAULT 0,
    "csllARecolher" REAL NOT NULL DEFAULT 0,
    "detalheCalculo" TEXT,
    "usuarioCriacaoId" INTEGER NOT NULL,
    "usuarioAtualizacaoId" INTEGER,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "calculos_trimestrais_usuarioCriacaoId_fkey" FOREIGN KEY ("usuarioCriacaoId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "calculos_trimestrais_usuarioAtualizacaoId_fkey" FOREIGN KEY ("usuarioAtualizacaoId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "logs_auditoria" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "acao" TEXT NOT NULL,
    "entidade" TEXT NOT NULL,
    "entidadeId" INTEGER NOT NULL,
    "detalhes" TEXT,
    "usuarioId" INTEGER NOT NULL,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "logs_auditoria_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "usuarios" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "calculos_trimestrais_ano_trimestre_key" ON "calculos_trimestrais"("ano", "trimestre");
