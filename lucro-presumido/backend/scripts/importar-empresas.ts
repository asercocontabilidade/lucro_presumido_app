/**
 * Script de importação de empresas a partir do CSV exportado do ERP.
 *
 * Uso:
 *   npx tsx scripts/importar-empresas.ts
 *   npx tsx scripts/importar-empresas.ts --dry-run
 *   npx tsx scripts/importar-empresas.ts --arquivo="outro/caminho.csv"
 */

import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import readline from 'readline';
import path from 'path';

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const arquivoArg = args.find(a => a.startsWith('--arquivo='));
const csvPath = arquivoArg
  ? arquivoArg.split('=')[1]
  : path.resolve(__dirname, '../../Exportacao de Empresas Simples.csv');

function normalizarCnpj(raw: string): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 14) {
    return `${digits.slice(0,2)}.${digits.slice(2,5)}.${digits.slice(5,8)}/${digits.slice(8,12)}-${digits.slice(12)}`;
  }
  if (digits.length === 11) {
    return `${digits.slice(0,3)}.${digits.slice(3,6)}.${digits.slice(6,9)}-${digits.slice(9)}`;
  }
  return raw.trim() || null;
}

function mapearRegime(regime: string): string {
  const r = (regime || '').toLowerCase();
  if (r.includes('presumido')) return 'lucro_presumido';
  if (r.includes('real')) return 'lucro_real_trimestral';
  if (r.includes('simples')) return 'simples';
  return 'lucro_presumido';
}

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

interface Contadores {
  inseridas: number;
  atualizadas: number;
  erros: { linha: number; motivo: string }[];
  ignoradas: number;
}

async function importar() {
  if (!fs.existsSync(csvPath)) {
    console.error(`Arquivo não encontrado: ${csvPath}`);
    process.exit(1);
  }

  console.log(`Lendo: ${csvPath}`);
  if (dryRun) console.log('MODO DRY-RUN — nenhuma alteração será salva.\n');

  const rl = readline.createInterface({ input: fs.createReadStream(csvPath, 'latin1') });
  const linhas: string[] = [];
  for await (const linha of rl) linhas.push(linha);

  // Detectar cabeçalho
  const header = parseCsvLine(linhas[0]);
  console.log('Colunas detectadas:', header.map((h, i) => `[${i}] ${h}`).join(' | '), '\n');

  // Mapear índices de colunas
  const idx = {
    id: header.findIndex(h => h.toLowerCase() === 'id'),
    codigoErp: header.findIndex(h => h.toLowerCase().includes('código erp') || h.toLowerCase().includes('codigo erp')),
    dtInicio: header.findIndex(h => h.toLowerCase().includes('dt.')),
    cnpj: header.findIndex(h => h.toLowerCase().includes('cpf/cnpj') || h.toLowerCase() === 'cnpj'),
    inscricao: header.findIndex(h => h.toLowerCase().includes('inscrição') || h.toLowerCase().includes('inscricao')),
    razaoSocial: header.findIndex(h => h.toLowerCase().includes('razão') || h.toLowerCase().includes('razao')),
    nomeFantasia: header.findIndex(h => h.toLowerCase().includes('fantasia')),
    regime: header.findIndex(h => h.toLowerCase().includes('regime')),
    cnae: header.findIndex(h => h.toLowerCase().includes('cnae primário') || h.toLowerCase().includes('cnae')),
  };

  const contadores: Contadores = { inseridas: 0, atualizadas: 0, erros: [], ignoradas: 0 };
  const logDir = path.resolve(__dirname, '../logs');
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
  const logFile = path.join(logDir, `importacao-${new Date().toISOString().slice(0, 10)}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  function log(msg: string) {
    console.log(msg);
    logStream.write(msg + '\n');
  }

  for (let i = 1; i < linhas.length; i++) {
    const linha = linhas[i];
    if (!linha.trim()) continue;

    const cols = parseCsvLine(linha);
    const razaoSocial = idx.razaoSocial >= 0 ? cols[idx.razaoSocial] : '';
    if (!razaoSocial) { contadores.ignoradas++; continue; }

    const cnpjRaw = idx.cnpj >= 0 ? cols[idx.cnpj] : '';
    const cnpj = normalizarCnpj(cnpjRaw);
    const regime = idx.regime >= 0 ? mapearRegime(cols[idx.regime]) : 'lucro_presumido';

    const dados: any = {
      razaoSocial: razaoSocial.trim(),
      nomeFantasia: idx.nomeFantasia >= 0 ? cols[idx.nomeFantasia]?.trim() || null : null,
      cnpj,
      codigoErp: idx.codigoErp >= 0 ? cols[idx.codigoErp]?.trim() || null : null,
      dtInicioServicos: idx.dtInicio >= 0 ? cols[idx.dtInicio]?.trim() || null : null,
      inscricaoEstadual: idx.inscricao >= 0 ? cols[idx.inscricao]?.trim() || null : null,
      cnaePrimario: idx.cnae >= 0 ? cols[idx.cnae]?.trim() || null : null,
      regimeTributario: regime,
      modalidadeRecolhimento: 'trimestral',
      sujeitoMajoracao: false,
      ativo: true,
    };

    try {
      if (dryRun) {
        log(`[DRY-RUN] Linha ${i + 1}: ${razaoSocial} | CNPJ: ${cnpj} | Regime: ${regime}`);
        contadores.inseridas++;
        continue;
      }

      if (cnpj) {
        const existente = await prisma.empresa.findUnique({ where: { cnpj } });
        if (existente) {
          await prisma.empresa.update({ where: { cnpj }, data: dados });
          contadores.atualizadas++;
          log(`[ATUALIZADO] ${razaoSocial}`);
        } else {
          await prisma.empresa.create({ data: dados });
          contadores.inseridas++;
          log(`[INSERIDO] ${razaoSocial}`);
        }
      } else {
        await prisma.empresa.create({ data: dados });
        contadores.inseridas++;
        log(`[INSERIDO sem CNPJ] ${razaoSocial}`);
      }
    } catch (err: any) {
      const motivo = err.message || String(err);
      contadores.erros.push({ linha: i + 1, motivo });
      log(`[ERRO] Linha ${i + 1} (${razaoSocial}): ${motivo}`);
    }
  }

  log('\n─── RESULTADO ───────────────────────────────────');
  log(`✓ ${contadores.inseridas} empresas inseridas`);
  log(`✓ ${contadores.atualizadas} empresas atualizadas`);
  log(`○ ${contadores.ignoradas} linhas ignoradas (sem razão social)`);
  log(`✗ ${contadores.erros.length} erros`);
  if (contadores.erros.length > 0) {
    contadores.erros.forEach(e => log(`  Linha ${e.linha}: ${e.motivo}`));
  }
  log(`\nLog salvo em: ${logFile}`);

  logStream.end();
}

importar()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
