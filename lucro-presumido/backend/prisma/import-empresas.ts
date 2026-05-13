import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

function mapRegime(regime: string): string {
  const r = regime.toLowerCase().trim();
  if (r.includes('presumido'))            return 'lucro_presumido';
  if (r.includes('simples'))              return 'simples';
  if (r.includes('real') && r.includes('trim')) return 'lucro_real_trimestral';
  if (r.includes('real') && r.includes('anu'))  return 'lucro_real_anual';
  if (r.includes('real'))                 return 'lucro_real_trimestral';
  if (r.includes('imune') || r.includes('isento')) return 'imune_isento';
  return regime.trim() || 'outros';
}

async function main() {
  const csvPath = path.resolve(
    'G:/GUSTAVO/Lucro presumido majoração/lucro-presumido/Exportacao de Empresas Simples.csv'
  );

  const buffer = fs.readFileSync(csvPath);
  // Arquivo em Windows-1252 — decodifica via latin1 (superset de ISO-8859-1)
  const content = buffer.toString('latin1');
  const lines = content.split(/\r?\n/).filter(l => l.trim());

  const dataLines = lines.slice(1); // pula cabeçalho

  let created = 0;
  let skipped = 0;
  let errors  = 0;

  for (const line of dataLines) {
    const cols = line.split(',');

    const codigoInterno    = cols[0]?.trim() || undefined;
    const codigoErp        = cols[1]?.trim() || undefined;
    const dtInicioServicos = cols[2]?.trim() || undefined;
    const cnpjRaw          = cols[3]?.trim() || '';
    const inscricaoEstadual = cols[4]?.trim() || undefined;
    const razaoSocial      = cols[5]?.trim();
    const nomeFantasia     = cols[6]?.trim() || undefined;
    const regimeTributario = mapRegime(cols[7] ?? '');

    // CNAE primário pode ter vírgula na descrição — une todas as colunas restantes
    const cnaeJoined = cols.slice(8).join(',').replace(/,+$/, '').trim();
    const cnaeMatch  = cnaeJoined.match(/^(\d{2}\.\d{2}-\d-\d{2})\s*-\s*(.+)/);
    const cnaePrimario       = cnaeMatch ? cnaeMatch[1].trim() : (cnaeJoined || undefined);
    const atividadePrincipal = cnaeMatch ? cnaeMatch[2].replace(/,.*$/, '').trim() : undefined;

    if (!razaoSocial) continue;

    // CNPJ/CPF: ignora placeholders vazios
    const cnpj = cnpjRaw && cnpjRaw !== '000.000.000/0000' ? cnpjRaw : undefined;

    try {
      if (cnpj) {
        await prisma.empresa.upsert({
          where:  { cnpj },
          update: {
            codigoInterno, codigoErp, razaoSocial, nomeFantasia,
            regimeTributario, cnaePrimario, atividadePrincipal,
            dtInicioServicos, inscricaoEstadual,
          },
          create: {
            codigoInterno, codigoErp, cnpj, razaoSocial, nomeFantasia,
            regimeTributario, cnaePrimario, atividadePrincipal,
            dtInicioServicos, inscricaoEstadual,
          },
        });
      } else {
        // Sem CNPJ/CPF — cria direto (sem chave única disponível)
        await prisma.empresa.create({
          data: {
            codigoInterno, codigoErp, razaoSocial, nomeFantasia,
            regimeTributario, cnaePrimario, atividadePrincipal,
            dtInicioServicos, inscricaoEstadual,
          },
        });
      }
      created++;
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message.split('\n')[0] : String(e);
      if (errors < 5) console.error(`  Erro: ${razaoSocial} — ${msg}`);
      errors++;
    }

    if (created % 200 === 0) process.stdout.write(`\r  ${created} importadas...`);
  }

  console.log(`\nConcluído: ${created} empresas importadas | ${errors} erros | ${skipped} ignoradas`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
