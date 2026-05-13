# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Visão Geral

Sistema web full-stack para escritórios de contabilidade calcularem **Lucro Presumido** com majoração de alíquota conforme a **MP 1.262/2024** (BEPS Pilar 2 / QDMTT). Gerencia IRPJ, CSLL e PIS/COFINS com exportação para PDF e Excel.

## Comandos de Desenvolvimento

### Backend (`/backend`)
```bash
npm run dev          # Servidor dev com tsx watch (porta 3001)
npm run build        # Compilar TypeScript para dist/
npm run start        # Executar build compilado
npm run db:migrate   # Rodar migrações Prisma
npm run db:generate  # Gerar Prisma client
npm run db:seed      # Popular banco com dados iniciais
```

### Frontend (`/frontend`)
```bash
npm run dev          # Servidor Vite (porta 5173, proxy para backend /api)
npm run build        # Build de produção
npm run preview      # Pré-visualizar build de produção
```

### Docker (produção)
```bash
docker-compose up -d    # Sobe PostgreSQL 15, backend e frontend (Nginx)
```

Scripts Windows: `iniciar.bat` (instala, migra e sobe tudo) e `parar.bat` (mata portas 3001 e 5173).

## Arquitetura

### Backend — Node.js + Express + TypeScript + Prisma
- **Entrada:** `backend/src/index.ts` — Express com Morgan, CORS, rotas montadas em `/api`
- **Camadas:** `controllers/` → `services/` (lógica de negócio e cálculos fiscais)
- **ORM:** Prisma 5 com SQLite (dev) / PostgreSQL 15 (produção via Docker)
- **Auth:** JWT Bearer (8h de expiração), middleware em `src/middleware/auth.middleware.ts`
- **Exportação:** PDFKit (`services/pdf.service.ts` ~50KB) e ExcelJS (`services/excel.service.ts` ~37KB)

### Frontend — React 18 + Vite + Tailwind CSS
- **Roteamento:** React Router v6, rotas em `frontend/src/App.tsx`
- **Auth global:** `contexts/AuthContext.tsx` — token injetado automaticamente via `utils/api.ts` (instância Axios)
- **Formulários:** react-hook-form + react-number-format
- **Gráficos:** Recharts
- **Proxy Vite:** `/api` → `http://localhost:3001` (apenas em dev)

### Modelo de Dados (principais entidades)
| Modelo | Propósito |
|---|---|
| `Empresa` | Cadastro de empresas (CNPJ, atividade, regime) |
| `CalculoIrpjCsll` | Cálculo detalhado IRPJ + CSLL por trimestre |
| `CalculoPisCofins` | Apuração mensal PIS/COFINS |
| `PeriodoApuracao` | Períodos trimestrais/mensais |
| `PercentualPresuncao` | Percentuais por atividade econômica |
| `ParametroSistema` | Parâmetros globais (limites, alíquotas) |
| `LogAuditoria` | Trilha de auditoria |
| `CalculoTrimestral` | Modelo legado (simples) — possivelmente em migração |

> **Nota:** Existem dois modelos de cálculo (`CalculoTrimestral` e `CalculoIrpjCsll`). O modelo ativo e detalhado é `CalculoIrpjCsll`.

## Regras de Negócio Críticas

Toda lógica fiscal está documentada em `ENGENHARIA_PROMPT_SISTEMA_TRIBUTARIO.md`. Pontos-chave:

- **IRPJ — Adicional de 10%:** incide sobre base > R$ 60.000/trimestre
- **Majoração IRPJ (MP 1.262/2024):** alíquota × 1,10; limite sem majoração = R$ 1.250.000
- **Majoração CSLL:** bloqueada no 1T2026; ativa a partir do 2T2026
- **Majoração IRPJ (adicional):** bloqueada no 1T2026; ativa a partir do 2T2026
- Essas restrições de trimestre estão implementadas em `backend/src/services/calculo.service.ts` e no hook `frontend/src/hooks/usePeriodoRules.ts`

## Variáveis de Ambiente

```env
DATABASE_URL=postgresql://lucro:lucro123@localhost:5432/lucro_presumido
JWT_SECRET=<gerar com: openssl rand -base64 32>
PORT=3001
```

## Credenciais de Desenvolvimento

- Email: `admin@empresa.com.br`
- Senha: `admin123`
