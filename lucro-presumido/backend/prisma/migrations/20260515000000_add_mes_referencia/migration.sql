-- AlterTable: adiciona coluna mesReferencia para distinguir antecipações mensais do fechamento trimestral
-- 1 = antecipação mês 1, 2 = antecipação mês 2, 3 = fechamento trimestral (padrão)
ALTER TABLE `calculos_trimestrais` ADD COLUMN `mesReferencia` INTEGER NOT NULL DEFAULT 3;

-- DropIndex: remove constraint única anterior (ano, trimestre, empresaId)
ALTER TABLE `calculos_trimestrais` DROP INDEX `calculos_trimestrais_ano_trimestre_empresaId_key`;

-- CreateIndex: nova constraint inclui mesReferencia para permitir até 3 registros por trimestre/empresa
CREATE UNIQUE INDEX `calculos_trimestrais_ano_trimestre_mesReferencia_empresaId_key` ON `calculos_trimestrais`(`ano`, `trimestre`, `mesReferencia`, `empresaId`);
