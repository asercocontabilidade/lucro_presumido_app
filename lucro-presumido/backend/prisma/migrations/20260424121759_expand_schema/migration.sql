-- CreateTable
CREATE TABLE "empresas" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoInterno" TEXT,
    "codigoErp" TEXT,
    "cnpj" TEXT,
    "razaoSocial" TEXT NOT NULL,
    "nomeFantasia" TEXT,
    "regimeTributario" TEXT NOT NULL DEFAULT 'lucro_presumido',
    "cnaePrimario" TEXT,
    "atividadePrincipal" TEXT,
    "percPresuncaoIrpj" REAL,
    "percPresuncaoCsll" REAL,
    "sujeitoMajoracao" BOOLEAN NOT NULL DEFAULT false,
    "modalidadeRecolhimento" TEXT NOT NULL DEFAULT 'trimestral',
    "dtInicioServicos" TEXT,
    "inscricaoEstadual" TEXT,
    "logoPath" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "percentuais_presuncao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "codigoAtividade" TEXT NOT NULL,
    "descricaoAtividade" TEXT NOT NULL,
    "percIrpj" REAL NOT NULL,
    "percCsll" REAL NOT NULL,
    "baseLegal" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true
);

-- CreateTable
CREATE TABLE "periodos_apuracao" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "trimestre" INTEGER,
    "mes" INTEGER,
    "tipoPeriodo" TEXT NOT NULL DEFAULT 'trimestral',
    "status" TEXT NOT NULL DEFAULT 'aberto',
    "criadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizadoEm" DATETIME NOT NULL,
    CONSTRAINT "periodos_apuracao_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calculos_irpj_csll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT,
    "periodoId" TEXT,
    "ano" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "regime" TEXT NOT NULL DEFAULT 'lucro_presumido',
    "receitaBrutaTotal" REAL NOT NULL DEFAULT 0,
    "percPresuncaoIrpj" REAL NOT NULL DEFAULT 0,
    "baseCalculoIrpj" REAL NOT NULL DEFAULT 0,
    "irpjAliquota15" REAL NOT NULL DEFAULT 0,
    "irpjAdicional10" REAL NOT NULL DEFAULT 0,
    "irpjTotal" REAL NOT NULL DEFAULT 0,
    "percPresuncaoCsll" REAL NOT NULL DEFAULT 0,
    "baseCalculoCsll" REAL NOT NULL DEFAULT 0,
    "csllTotal" REAL NOT NULL DEFAULT 0,
    "temMajoracao" BOOLEAN NOT NULL DEFAULT false,
    "irpjMajorado" REAL,
    "csllMajorada" REAL,
    "usuarioCalculo" TEXT,
    "dataCalculo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observacoes" TEXT,
    "hashCalculo" TEXT,
    CONSTRAINT "calculos_irpj_csll_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calculos_irpj_csll_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "periodos_apuracao" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "calculos_pis_cofins" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT,
    "ano" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "regimePisCofins" TEXT NOT NULL DEFAULT 'cumulativo',
    "receitaBruta" REAL NOT NULL DEFAULT 0,
    "exclusoesBase" REAL NOT NULL DEFAULT 0,
    "baseCalculo" REAL NOT NULL DEFAULT 0,
    "aliquotaPis" REAL NOT NULL DEFAULT 0.0065,
    "pisBruto" REAL NOT NULL DEFAULT 0,
    "creditosPis" REAL NOT NULL DEFAULT 0,
    "pisARecolher" REAL NOT NULL DEFAULT 0,
    "aliquotaCofins" REAL NOT NULL DEFAULT 0.03,
    "cofinsBruta" REAL NOT NULL DEFAULT 0,
    "creditosCofins" REAL NOT NULL DEFAULT 0,
    "cofinsARecolher" REAL NOT NULL DEFAULT 0,
    "dataCalculo" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuarioCalculo" TEXT,
    "conferido" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "calculos_pis_cofins_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "parametros_sistema" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "chave" TEXT NOT NULL,
    "valor" TEXT NOT NULL,
    "descricao" TEXT,
    "vigenciaInicio" TEXT,
    "vigenciaFim" TEXT,
    "atualizadoEm" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "historico_exportacoes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "empresaId" TEXT,
    "tipoRelatorio" TEXT,
    "filtrosAplicados" TEXT,
    "exportadoEm" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "usuario" TEXT,
    "arquivoNome" TEXT,
    CONSTRAINT "historico_exportacoes_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_calculos_trimestrais" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "ano" INTEGER NOT NULL,
    "trimestre" INTEGER NOT NULL,
    "descricao" TEXT,
    "empresaId" TEXT,
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
    CONSTRAINT "calculos_trimestrais_usuarioAtualizacaoId_fkey" FOREIGN KEY ("usuarioAtualizacaoId") REFERENCES "usuarios" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "calculos_trimestrais_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "empresas" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_calculos_trimestrais" ("adicionalIr10", "ano", "atualizadoEm", "basePresumidaCsll", "basePresumidaIrpj", "criadoEm", "csll9", "csllARecolher", "csllRetida", "descricao", "detalheCalculo", "excedenteMajorado", "id", "irpj15", "irpjARecolher", "irpjTotal", "irrf", "outrasReceitas", "receita16", "receita16p", "receita32", "receita8", "receitaTotal", "trimestre", "usuarioAtualizacaoId", "usuarioCriacaoId") SELECT "adicionalIr10", "ano", "atualizadoEm", "basePresumidaCsll", "basePresumidaIrpj", "criadoEm", "csll9", "csllARecolher", "csllRetida", "descricao", "detalheCalculo", "excedenteMajorado", "id", "irpj15", "irpjARecolher", "irpjTotal", "irrf", "outrasReceitas", "receita16", "receita16p", "receita32", "receita8", "receitaTotal", "trimestre", "usuarioAtualizacaoId", "usuarioCriacaoId" FROM "calculos_trimestrais";
DROP TABLE "calculos_trimestrais";
ALTER TABLE "new_calculos_trimestrais" RENAME TO "calculos_trimestrais";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "empresas_cnpj_key" ON "empresas"("cnpj");

-- CreateIndex
CREATE UNIQUE INDEX "percentuais_presuncao_codigoAtividade_key" ON "percentuais_presuncao"("codigoAtividade");

-- CreateIndex
CREATE UNIQUE INDEX "parametros_sistema_chave_key" ON "parametros_sistema"("chave");
