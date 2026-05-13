# Engenharia de Prompt — Sistema de Apuração e Conferência Tributária
## Escritório Contábil — Lucro Presumido, Lucro Real, Majoração, PIS/COFINS

---

## PARTE 1 — BASE LEGAL PESQUISADA E CONSOLIDADA

### 1.1 Majoração IRPJ/CSLL — Embasamento Legal

#### Origem Normativa (BEPS Pilar 2 / Imposto Mínimo Global)

| Norma | Descrição |
|---|---|
| **Lei nº 14.789/2023** | Institui o regime de tributação de lucros no exterior de pessoas jurídicas domiciliadas no Brasil (base do BEPS Pilar 2 no Brasil) |
| **Medida Provisória nº 1.262/2024** | Institui o QDMTT (Qualified Domestic Minimum Top-up Tax) — Adicional da CSLL para grupos multinacionais; conversão aguardada em lei |
| **IN RFB nº 2.228/2024** | Regulamenta a MP 1.262/2024 — define base de cálculo, alíquotas, forma de apuração do QDMTT/CSLL majorada |
| **Decreto-Lei nº 1.598/1977** (art. 6º) | Base histórica da CSLL e IRPJ |
| **Lei nº 9.430/1996** | Regula estimativa mensal IRPJ/CSLL — Lucro Real Anual |
| **Lei nº 9.718/1998** | Regula apuração Lucro Presumido e Lucro Real Trimestral |
| **RIR/2018 — Decreto nº 9.580/2018** | Regulamento do Imposto de Renda consolidado |

#### Quem está sujeito à majoração (QDMTT/Adicional CSLL)?

- **Grupos multinacionais** com receita consolidada anual **superior a EUR 750 milhões** em pelo menos 2 dos últimos 4 exercícios
- Entidades constituintes domiciliadas no Brasil pertencentes a esses grupos
- **Não se aplica a empresas nacionais** de menor porte (Lucro Presumido padrão, Simples Nacional, etc.)
- Porém, empresas do **Lucro Presumido de grande porte** com estrutura internacional podem ser alcançadas

> ⚠️ **Atenção:** Para escritórios contábeis que atendem empresas nacionais de porte médio em Lucro Presumido, a majoração relevante no contexto deste sistema é o **adicional de IRPJ de 10%** (sobre base acima de R$ 20.000/mês ou R$ 60.000/trimestre) que já existe na legislação ordinária — e não a majoração BEPS. Confirme com o cliente qual regime se aplica.

#### Cronograma de vigência da MP 1.262/2024

| Período | IRPJ (Adicional) | CSLL (QDMTT) |
|---|---|---|
| **1º trimestre/2026 (jan-mar/2026)** | ✅ Sujeito | ❌ **Não sujeito** |
| **2º trimestre/2026 em diante** | ✅ Sujeito | ✅ Sujeito |

> **Base legal para a regra do 1T2026:** A MP 1.262/2024 previu implementação faseada. O adicional de CSLL (QDMTT) passa a ser exigido somente a partir do 2º trimestre de 2026 para os grupos que já vinham apurando IRPJ majorado. Isso exige que o sistema **bloqueie o campo CSLL majorada quando selecionado Ano=2026 e Trimestre=1**.

---

### 1.2 Lucro Presumido — Alíquotas e Apuração

#### Percentuais de Presunção do IRPJ (Art. 15, Lei 9.249/1995)

| Atividade | % Presunção IRPJ |
|---|---|
| Comércio e indústria (revenda de mercadorias) | **8%** |
| Prestação de serviços de transporte de cargas | **8%** |
| Atividades imobiliárias (venda de imóveis) | **8%** |
| Transporte de passageiros | **16%** |
| Prestação de serviços em geral | **32%** |
| Intermediação de negócios, administração, factoring | **32%** |
| Serviços hospitalares (com estrutura mínima) | **8%** |
| Serviços hospitalares (sem estrutura mínima) | **32%** |
| Bancos, financeiras, seguradoras | **16%** |
| Receitas financeiras e de aluguel | **100%** (base integral) |

#### Percentuais de Presunção da CSLL (Art. 20, Lei 9.249/1995)

| Atividade | % Presunção CSLL |
|---|---|
| Comércio, indústria, transporte de cargas | **12%** |
| Serviços em geral, intermediação | **32%** |
| Serviços hospitalares (com estrutura) | **12%** |

#### Alíquotas Nominais

| Tributo | Alíquota Base | Adicional | Base do Adicional |
|---|---|---|---|
| **IRPJ** | **15%** | **+ 10%** | Lucro presumido > R$ 20.000/mês = R$ 60.000/trimestre |
| **CSLL** | **9%** | — | Não há adicional na CSLL para LP padrão |

#### Fórmula de Cálculo IRPJ Lucro Presumido

```
Receita Bruta × % Presunção = Base de Cálculo IRPJ

IRPJ = Base de Cálculo × 15%

Adicional IRPJ:
  Se Base > R$ 60.000 no trimestre:
    Adicional = (Base - R$ 60.000) × 10%

IRPJ Total = IRPJ + Adicional IRPJ
```

#### Fórmula de Cálculo CSLL Lucro Presumido

```
Receita Bruta × % Presunção CSLL = Base de Cálculo CSLL
CSLL = Base de Cálculo CSLL × 9%
```

#### Períodos de Apuração Trimestral (base: art. 1º, Lei 9.430/1996)

| Trimestre | Período | Vencimento |
|---|---|---|
| 1º Trimestre | Jan – Mar | Último dia útil de abril |
| 2º Trimestre | Abr – Jun | Último dia útil de julho |
| 3º Trimestre | Jul – Set | Último dia útil de outubro |
| 4º Trimestre | Out – Dez | Último dia útil de janeiro |

> Pode optar por parcelar em até 3 quotas iguais (mínimo R$ 1.000 cada), acrescidas de juros SELIC.

#### Códigos DARF — Lucro Presumido

| Tributo | Código DARF |
|---|---|
| IRPJ — Lucro Presumido | **2089** |
| CSLL — Lucro Presumido | **2372** |

---

### 1.3 PIS e COFINS — Regime Cumulativo (Lucro Presumido)

#### Base Legal

| Norma | Descrição |
|---|---|
| **Lei nº 9.718/1998** | Institui PIS/COFINS cumulativo para Lucro Presumido e Lucro Real com receita bruta até o limite |
| **Lei nº 10.637/2002** | PIS não-cumulativo (Lucro Real) |
| **Lei nº 10.833/2003** | COFINS não-cumulativa (Lucro Real) |
| **IN SRF nº 247/2002** | Regulamenta PIS cumulativo |

#### Alíquotas — Regime Cumulativo (Lucro Presumido)

| Contribuição | Alíquota | Periodicidade |
|---|---|---|
| **PIS** | **0,65%** | Mensal |
| **COFINS** | **3,00%** | Mensal |

#### Base de Cálculo

```
Base PIS/COFINS = Receita Bruta do mês
  (−) Devoluções e vendas canceladas
  (−) Descontos incondicionais concedidos
  (−) IPI destacado
  (−) ICMS-ST cobrado do comprador
  (=) Base de Cálculo

PIS = Base × 0,65%
COFINS = Base × 3,00%
```

#### Exclusões da Base (art. 3º, Lei 9.718/98)

- Receitas isentas ou não tributáveis
- Receitas de exportação (imunes)
- Receitas financeiras (em alguns casos — verificar Lei 12.973/2014)
- Receitas de transferências de créditos

#### Vencimentos PIS/COFINS

| Condição | Vencimento |
|---|---|
| Regra geral | Dia 25 do mês seguinte ao fato gerador |
| Se dia 25 não for útil | Primeiro dia útil anterior |

#### Códigos DARF

| Tributo | Código |
|---|---|
| PIS — Cumulativo | **8109** |
| COFINS — Cumulativa | **2172** |

---

### 1.4 PIS e COFINS — Regime Não-Cumulativo (Lucro Real)

| Contribuição | Alíquota | Créditos |
|---|---|---|
| **PIS** | **1,65%** | Créditos sobre insumos, aluguéis, depreciação |
| **COFINS** | **7,60%** | Créditos sobre insumos, aluguéis, depreciação |

```
PIS/COFINS a Pagar = (Receita Bruta × Alíquota) − Créditos Apurados
```

---

### 1.5 Lucro Real — Alíquotas e Apuração

#### Alíquotas IRPJ e CSLL

| Tributo | Alíquota | Adicional |
|---|---|---|
| **IRPJ** | **15%** | **+ 10%** sobre lucro > R$ 20k/mês ou R$ 60k/trimestre |
| **CSLL — Geral** | **9%** | — |
| **CSLL — Financeiras/Seguradoras** | **15% ou 20%** | — |

#### Modalidades de Apuração (base: Lei 9.430/1996)

| Modalidade | Descrição | Quando usar |
|---|---|---|
| **Lucro Real Trimestral** | Apuração definitiva a cada trimestre | Lucro estável, previsível |
| **Lucro Real Anual (estimativa mensal)** | Recolhimento mensal por estimativa; ajuste anual em dez/jan | Lucro variável, prejuízo esperado |

#### Estimativa Mensal — Bases de Cálculo

```
Receita Bruta × % Estimativa (igual ao Lucro Presumido por atividade)
  + Ganhos de capital, demais receitas
  = Base Estimada

IRPJ estimado = Base × 15% (+ 10% se exceder R$ 20.000)
CSLL estimada = Base CSLL × 9%
```

---

### 1.6 Tabela Resumo — Conferência por Regime

| Regime | IRPJ | CSLL | PIS | COFINS | Apuração |
|---|---|---|---|---|---|
| Lucro Presumido | 15% + 10% adicional | 9% | 0,65% | 3,00% | IRPJ/CSLL trimestral; PIS/COFINS mensal |
| Lucro Real Trimestral | 15% + 10% adicional | 9% | 1,65% | 7,60% | Tudo trimestral (PIS/COFINS mensal) |
| Lucro Real Anual | 15% + 10% adicional | 9% | 1,65% | 7,60% | Estimativa mensal; ajuste anual |
| Majoração BEPS (MP 1.262/2024) | IRPJ adicional 9% (top-up) | QDMTT adicional (a partir 2T2026) | — | — | Trimestral ou anual |

---

## PARTE 2 — ANÁLISE DE BANCO DE DADOS: TABELAS NECESSÁRIAS

### 2.1 Tabelas Existentes (inferidas do sistema atual)

Com base no contexto do projeto `lucro-presumido-majoração`, as tabelas presumidamente existentes são:

```
empresas              → cadastro básico
calculos_majoracao    → apuração de majoração IRPJ
parametros_calculo    → alíquotas e percentuais
```

### 2.2 Novas Tabelas / Adaptações Necessárias

```sql
-- =====================================================
-- TABELA: empresas (EXPANDIR)
-- =====================================================
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS regime_tributario VARCHAR(20) 
  DEFAULT 'lucro_presumido' 
  CHECK (regime_tributario IN ('lucro_presumido','lucro_real_trimestral','lucro_real_anual','simples'));
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS cnpj VARCHAR(18);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS atividade_principal VARCHAR(100);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS percentual_presuncao_irpj DECIMAL(5,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS percentual_presuncao_csll DECIMAL(5,2);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS sujeito_majoracao BOOLEAN DEFAULT FALSE;
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS modalidade_recolhimento VARCHAR(20) 
  CHECK (modalidade_recolhimento IN ('mensal','trimestral'));
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS logo_path VARCHAR(255);
ALTER TABLE empresas ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE;

-- =====================================================
-- TABELA: periodos_apuracao (NOVA)
-- =====================================================
CREATE TABLE IF NOT EXISTS periodos_apuracao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  ano INTEGER NOT NULL,
  trimestre INTEGER CHECK (trimestre IN (1,2,3,4)),
  mes INTEGER CHECK (mes BETWEEN 1 AND 12), -- para apuração mensal PIS/COFINS
  tipo_periodo VARCHAR(20) CHECK (tipo_periodo IN ('trimestral','mensal')),
  status VARCHAR(20) DEFAULT 'aberto' CHECK (status IN ('aberto','calculado','conferido','exportado')),
  criado_em TIMESTAMP DEFAULT NOW(),
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- =====================================================
-- TABELA: calculos_irpj_csll (NOVA — histórico completo)
-- =====================================================
CREATE TABLE IF NOT EXISTS calculos_irpj_csll (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  periodo_id UUID REFERENCES periodos_apuracao(id),
  ano INTEGER NOT NULL,
  trimestre INTEGER NOT NULL,
  regime VARCHAR(20) NOT NULL,
  receita_bruta_total DECIMAL(18,2),
  -- IRPJ
  perc_presuncao_irpj DECIMAL(5,2),
  base_calculo_irpj DECIMAL(18,2),
  irpj_aliquota_15 DECIMAL(18,2),
  irpj_adicional_10 DECIMAL(18,2),
  irpj_total DECIMAL(18,2),
  -- CSLL
  perc_presuncao_csll DECIMAL(5,2),
  base_calculo_csll DECIMAL(18,2),
  csll_total DECIMAL(18,2),
  -- Majoração
  tem_majoracao BOOLEAN DEFAULT FALSE,
  irpj_majorado DECIMAL(18,2),
  csll_majorada DECIMAL(18,2),
  -- Metadados
  usuario_calculo VARCHAR(100),
  data_calculo TIMESTAMP DEFAULT NOW(),
  observacoes TEXT,
  hash_calculo VARCHAR(64)
);

-- =====================================================
-- TABELA: calculos_pis_cofins (NOVA)
-- =====================================================
CREATE TABLE IF NOT EXISTS calculos_pis_cofins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  ano INTEGER NOT NULL,
  mes INTEGER NOT NULL,
  regime_pis_cofins VARCHAR(20) CHECK (regime_pis_cofins IN ('cumulativo','nao_cumulativo')),
  receita_bruta DECIMAL(18,2),
  exclusoes_base DECIMAL(18,2) DEFAULT 0,
  base_calculo DECIMAL(18,2),
  -- PIS
  aliquota_pis DECIMAL(5,4),
  pis_bruto DECIMAL(18,2),
  creditos_pis DECIMAL(18,2) DEFAULT 0,
  pis_a_recolher DECIMAL(18,2),
  -- COFINS
  aliquota_cofins DECIMAL(5,4),
  cofins_bruta DECIMAL(18,2),
  creditos_cofins DECIMAL(18,2) DEFAULT 0,
  cofins_a_recolher DECIMAL(18,2),
  -- Meta
  data_calculo TIMESTAMP DEFAULT NOW(),
  usuario_calculo VARCHAR(100),
  conferido BOOLEAN DEFAULT FALSE
);

-- =====================================================
-- TABELA: parametros_sistema (NOVA — alíquotas configuráveis)
-- =====================================================
CREATE TABLE IF NOT EXISTS parametros_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chave VARCHAR(100) UNIQUE NOT NULL,
  valor TEXT NOT NULL,
  descricao TEXT,
  vigencia_inicio DATE,
  vigencia_fim DATE,
  atualizado_em TIMESTAMP DEFAULT NOW()
);

-- Inserir parâmetros base
INSERT INTO parametros_sistema (chave, valor, descricao) VALUES
  ('irpj_aliquota_base', '15', 'Alíquota base IRPJ (%)'),
  ('irpj_adicional', '10', 'Adicional IRPJ sobre base acima do limite (%)'),
  ('irpj_limite_adicional_mensal', '20000', 'Limite mensal para adicional IRPJ (R$)'),
  ('csll_aliquota_geral', '9', 'Alíquota CSLL geral (%)'),
  ('pis_cumulativo', '0.65', 'PIS regime cumulativo (%)'),
  ('cofins_cumulativa', '3.00', 'COFINS regime cumulativo (%)'),
  ('pis_nao_cumulativo', '1.65', 'PIS regime não-cumulativo (%)'),
  ('cofins_nao_cumulativa', '7.60', 'COFINS regime não-cumulativo (%)'),
  ('majoracao_csll_vigencia_inicio', '2026-04-01', '1T2026 sem CSLL majorada; inicia 2T2026'),
  ('majoracao_irpj_vigencia_inicio', '2026-01-01', 'Majoração IRPJ desde 1T2026')
ON CONFLICT (chave) DO NOTHING;

-- =====================================================
-- TABELA: historico_exportacoes (NOVA)
-- =====================================================
CREATE TABLE IF NOT EXISTS historico_exportacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  tipo_relatorio VARCHAR(50),
  filtros_aplicados JSONB,
  exportado_em TIMESTAMP DEFAULT NOW(),
  usuario VARCHAR(100),
  arquivo_nome VARCHAR(255)
);

-- =====================================================
-- TABELA: percentuais_presuncao (NOVA — tabela de referência)
-- =====================================================
CREATE TABLE IF NOT EXISTS percentuais_presuncao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo_atividade VARCHAR(20),
  descricao_atividade TEXT NOT NULL,
  perc_irpj DECIMAL(5,2) NOT NULL,
  perc_csll DECIMAL(5,2) NOT NULL,
  base_legal TEXT,
  ativo BOOLEAN DEFAULT TRUE
);

INSERT INTO percentuais_presuncao (codigo_atividade, descricao_atividade, perc_irpj, perc_csll, base_legal) VALUES
  ('COM', 'Comércio e indústria / Revenda de mercadorias', 8.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('TRC', 'Transporte de cargas', 8.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('TRP', 'Transporte de passageiros', 16.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('SRV', 'Prestação de serviços em geral', 32.00, 32.00, 'Art. 15 Lei 9.249/1995'),
  ('IMO', 'Atividades imobiliárias', 8.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('HSP', 'Serviços hospitalares (com estrutura mínima)', 8.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('MED', 'Serviços de saúde sem estrutura hospitalar', 32.00, 32.00, 'Art. 15 Lei 9.249/1995'),
  ('FIN', 'Intermediação financeira, banco, seguradora', 16.00, 12.00, 'Art. 15 Lei 9.249/1995'),
  ('INT', 'Intermediação de negócios, representação comercial', 32.00, 32.00, 'Art. 15 Lei 9.249/1995')
ON CONFLICT DO NOTHING;
```

---

## PARTE 3 — DESIGN SYSTEM DO SISTEMA

### 3.1 Paleta de Cores (Identidade do Escritório)

```css
:root {
  /* Primárias — base da marca */
  --color-brand-primary: #1A3A6B;      /* Azul corporativo escuro */
  --color-brand-secondary: #2E6DA4;    /* Azul médio */
  --color-brand-accent: #F5A623;       /* Âmbar — destaque tributário */

  /* Semânticas — status de conferência */
  --color-status-ok: #27AE60;          /* Verde — conferido/correto */
  --color-status-warning: #E67E22;     /* Laranja — divergência */
  --color-status-error: #E74C3C;       /* Vermelho — erro/pendente */
  --color-status-info: #2980B9;        /* Azul — informativo */
  --color-status-neutral: #7F8C8D;     /* Cinza — sem movimento */

  /* Superfícies */
  --surface-sidebar: #1A2B4A;          /* Sidebar escura */
  --surface-sidebar-active: #2E6DA4;   /* Item ativo sidebar */
  --surface-card: #FFFFFF;
  --surface-page: #F4F6F9;
  --surface-table-header: #EBF0F7;

  /* Tipografia */
  --font-primary: 'Inter', 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Courier New', monospace;
  --font-size-xs: 11px;
  --font-size-sm: 13px;
  --font-size-base: 14px;
  --font-size-md: 16px;
  --font-size-lg: 20px;
  --font-size-xl: 24px;

  /* Espaçamento */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* Bordas */
  --border-radius-sm: 4px;
  --border-radius-md: 8px;
  --border-radius-lg: 12px;
  --border-color: #DDE3EC;
  --border-color-strong: #B8C5D6;
}
```

### 3.2 Layout Geral

```
┌──────────────────────────────────────────────────────────────────┐
│  SIDEBAR (240px, escura)    │  ÁREA DE CONTEÚDO (flex: 1)        │
│  ┌──────────────────────┐   │  ┌────────────────────────────────┐│
│  │  [LOGO ESCRITÓRIO]   │   │  │  TOPBAR: Título + Filtros + 🔔 ││
│  │  (LOGO.png topo)     │   │  ├────────────────────────────────┤│
│  ├──────────────────────┤   │  │                                ││
│  │  🏢 Empresas         │   │  │       CONTEÚDO DA PÁGINA       ││
│  │  📊 Apuração         │   │  │  (cards de métricas, tabelas,  ││
│  │   ├─ IRPJ/CSLL       │   │  │   formulários, gráficos)       ││
│  │   ├─ PIS/COFINS      │   │  │                                ││
│  │   └─ Majoração       │   │  └────────────────────────────────┘│
│  │  📋 Histórico        │   │                                     │
│  │  📄 Relatórios PDF   │   │                                     │
│  │  ⚙️  Configurações   │   │                                     │
│  │                      │   │                                     │
│  └──────────────────────┘   │                                     │
└──────────────────────────────────────────────────────────────────┘
```

### 3.3 Componentes UI/UX Prioritários

```
BADGE DE REGIME:
  LP  = pill verde     (Lucro Presumido)
  LRT = pill azul      (Lucro Real Trimestral)
  LRA = pill roxo      (Lucro Real Anual)
  MAJ = pill âmbar     (Sujeito a Majoração)

BADGE DE STATUS CONFERÊNCIA:
  ✓ Conferido     = verde
  ⚠ Divergência   = laranja + tooltip com valor esperado vs encontrado
  ✗ Erro          = vermelho + link para detalhe
  ○ Pendente      = cinza

FILTROS AVANÇADOS (painel superior):
  [Empresa ▾]  [Ano ▾]  [Trimestre ▾]  [Regime ▾]  [Status ▾]  [Exportar PDF]

CARD DE RESULTADO:
  ┌─────────────────────────────────────┐
  │  EMPRESA XYZ LTDA          1T/2026  │
  │  Lucro Presumido — Serviços         │
  ├─────────────────────────────────────┤
  │  Receita Bruta    R$ 350.000,00     │
  │  Base IRPJ (32%)  R$ 112.000,00     │
  │  IRPJ (15%)       R$  16.800,00     │
  │  Adicional (10%)  R$   5.200,00     │
  │  CSLL (9%)        R$   9.072,00     │
  │  PIS (0,65%)      R$   2.275,00     │
  │  COFINS (3%)      R$  10.500,00     │
  ├─────────────────────────────────────┤
  │  TOTAL TRIBUTOS   R$  43.847,00     │
  │  [📄 Exportar PDF]  [✓ Marcar OK]  │
  └─────────────────────────────────────┘
```

---

## PARTE 4 — ENGENHARIA DE PROMPT PRINCIPAL

> **Instruções de uso:** Copie cada bloco de prompt abaixo e use em sessões separadas de desenvolvimento, na ordem indicada. Cada bloco é auto-suficiente e referencia os anteriores.

---

### PROMPT 1 — Estrutura do Banco de Dados e Migração

```markdown
Você é um desenvolvedor full-stack especializado em sistemas contábeis e tributários brasileiros.

## Contexto do projeto
Estamos expandindo um sistema web de apuração tributária chamado "Sistema de Conferência Tributária" 
para um escritório de contabilidade. O projeto usa:
- **Frontend:** React + TypeScript + Tailwind CSS
- **Backend:** Node.js / Next.js (API Routes)
- **Banco de dados:** PostgreSQL (Supabase)
- **Localização:** Brasil — todas as regras são da legislação tributária brasileira

O projeto já possui estrutura básica de apuração de majoração IRPJ para Lucro Presumido.

## Tarefa: Migração completa do banco de dados

Crie um arquivo `migrations/001_schema_completo.sql` com:

### Tabelas a criar/expandir:

1. **empresas** — Expandir com:
   - `regime_tributario` ENUM ('lucro_presumido', 'lucro_real_trimestral', 'lucro_real_anual')
   - `cnpj` VARCHAR(18)
   - `atividade_principal` VARCHAR(100)
   - `percentual_presuncao_irpj` DECIMAL(5,2) — padrão por atividade
   - `percentual_presuncao_csll` DECIMAL(5,2) — padrão por atividade
   - `sujeito_majoracao` BOOLEAN DEFAULT FALSE — grupos multinacionais com receita > EUR 750mi
   - `modalidade_recolhimento` ('mensal', 'trimestral')
   - `ativo` BOOLEAN DEFAULT TRUE

2. **periodos_apuracao** (nova) — representa cada período de cálculo:
   - empresa_id, ano, trimestre (1-4), mes (1-12), tipo_periodo, status

3. **calculos_irpj_csll** (nova) — histórico completo de apuração:
   - Todos os campos de receita, base de cálculo, valores IRPJ (alíquota 15%, adicional 10%), CSLL
   - Campos de majoração separados (irpj_majorado, csll_majorada) com flag tem_majoracao
   - hash_calculo para auditoria

4. **calculos_pis_cofins** (nova) — apuração mensal:
   - regime_pis_cofins ('cumulativo', 'nao_cumulativo')
   - Campos para PIS e COFINS separados (bruto, créditos, a recolher)
   - Alíquotas: cumulativo PIS=0.65%, COFINS=3%; não-cumulativo PIS=1.65%, COFINS=7.6%

5. **parametros_sistema** (nova) — alíquotas configuráveis:
   - Inserir todos os parâmetros base (alíquotas, limites, datas de vigência)
   - REGRA CRÍTICA: inserir parâmetro 'majoracao_csll_vigencia_inicio' = '2026-04-01'
     (CSLL majorada só a partir do 2º trimestre de 2026 — MP 1.262/2024)

6. **percentuais_presuncao** (nova) — tabela de referência por atividade:
   - Inserir todas as atividades com perc_irpj e perc_csll conforme art. 15 da Lei 9.249/1995

7. **historico_exportacoes** (nova) — log de relatórios gerados

### Também crie:
- `migrations/002_import_empresas.js` — script Node.js para importar o CSV em 
  `G:\GUSTAVO\Lucro presumido majoração\lucro-presumido\Exportacao de Empresas Simples.csv`
  Mapeie os campos do CSV para a tabela `empresas`. Imprima os primeiros 5 registros para validação.

Use PostgreSQL 15+. Inclua índices nas colunas mais consultadas (empresa_id, ano, trimestre).
```

---

### PROMPT 2 — Regra do 1º Trimestre 2026 (CSLL Majorada)

```markdown
## Contexto
Sistema tributário React/TypeScript/Supabase. O banco já tem a tabela `parametros_sistema` 
com o parâmetro `majoracao_csll_vigencia_inicio = '2026-04-01'`.

## Tarefa: Implementar regra de bloqueio do 1T/2026

### Lógica de negócio a implementar:

**Regra:** No 1º trimestre de 2026 (jan-mar/2026), NÃO há majoração de CSLL — 
apenas IRPJ pode ter majoração (conforme MP 1.262/2024, implementação faseada).

### 1. Hook `usePeriodoRules(ano: number, trimestre: number)`
Retorne:
```typescript
{
  permiteIrpjMajorado: boolean;     // true sempre que empresa for sujeita
  permiteCsllMajorada: boolean;     // FALSE se ano=2026 e trimestre=1
  mensagemBloqueio: string | null;  // "CSLL majorada não vigente no 1T/2026 (MP 1.262/2024)"
  periodoLabel: string;             // "1º Trimestre / 2026"
}
```

### 2. Componente `SeletorPeriodo`
- Selects de **Ano** (2024, 2025, 2026, 2027...) e **Trimestre** (1º, 2º, 3º, 4º)
- Quando Ano=2026 e Trimestre=1 selecionados:
  - Campo "CSLL Majorada" fica desabilitado (disabled + cinza)
  - Exibe badge âmbar: "⚠ CSLL não sujeita neste período — MP 1.262/2024"
  - Campo "IRPJ Majorado" permanece habilitado normalmente

### 3. Validação no backend (API Route `/api/calculos/validar`)
- Se req.body.ano === 2026 && req.body.trimestre === 1 && req.body.csll_majorada > 0:
  - Retornar erro 400: `{ error: "CSLL majorada inválida para 1T/2026", code: "CSLL_VIGENCIA_1T2026" }`

Implemente com TypeScript tipado. Adicione testes unitários para o hook.
```

---

### PROMPT 3 — Conferência IRPJ/CSLL Lucro Presumido (Mensal e Trimestral)

```markdown
## Contexto
Sistema tributário React/TypeScript. Já existe apuração básica de majoração. 
Precisamos de conferência completa para Lucro Presumido com dois modos de recolhimento.

## Tarefa: Componente de Conferência IRPJ/CSLL

### Regras tributárias a implementar:

**IRPJ Lucro Presumido:**
- Base = Receita Bruta × % Presunção (8%, 16% ou 32% conforme atividade)
- IRPJ = Base × 15%
- Adicional = (Base − R$ 60.000 no trimestre) × 10% [se positivo]
- Referência: Art. 15 Lei 9.249/1995 + Art. 3º Lei 9.430/1996

**CSLL Lucro Presumido:**
- Base = Receita Bruta × % Presunção CSLL (12% ou 32%)
- CSLL = Base × 9%
- Referência: Art. 20 Lei 9.249/1995

### Dois modos de recolhimento:

**Modo Trimestral** (padrão do LP):
- Input: Receita do trimestre completo
- Calcular em cima da receita total do período

**Modo com Parcelas Mensais** (empresa que calcula mês a mês e recolhe ao final):
- Input: Receita de cada mês (Jan, Fev, Mar para 1T; etc.)
- Sistema soma os 3 meses e calcula o trimestre
- Exibe comparativo: "Soma dos meses vs Cálculo trimestral" — devem bater

### Componente `ConferenciaIRPJCSLL`:

```tsx
interface Props {
  empresa: Empresa;
  ano: number;
  trimestre: 1 | 2 | 3 | 4;
  onSalvar: (resultado: CalculoIRPJCSLL) => void;
}
```

- Seletor de percentual de presunção (dropdown com todas as atividades da tabela `percentuais_presuncao`)
- Toggle: "Recolhimento Mensal / Recolhimento Trimestral"
- Se mensal: 3 campos de receita (Mês 1, Mês 2, Mês 3) + exibição do total
- Cards de resultado: Base IRPJ | IRPJ 15% | Adicional 10% | CSLL | Total do Período
- Badge de status: verde se confere com DARFs informados, vermelho se diverge
- Botão "Salvar no histórico" → INSERT em `calculos_irpj_csll`

Use Tailwind CSS. Suporte a dark mode. Exibir valores em `Intl.NumberFormat('pt-BR', {style:'currency', currency:'BRL'})`.
```

---

### PROMPT 4 — Módulo PIS/COFINS

```markdown
## Contexto
Sistema tributário React/TypeScript/Supabase. Já temos módulos IRPJ/CSLL.

## Tarefa: Módulo completo de Conferência PIS/COFINS

### Regras tributárias:

**Regime Cumulativo (Lucro Presumido):**
- PIS = Receita Bruta × 0,65%
- COFINS = Receita Bruta × 3,00%
- Base legal: Lei 9.718/1998
- Exclusões da base: devoluções, cancelamentos, descontos incondicionais, IPI, ICMS-ST
- Apuração: MENSAL
- Código DARF PIS: 8109 | COFINS: 2172
- Vencimento: dia 25 do mês seguinte

**Regime Não-Cumulativo (Lucro Real):**
- PIS = (Receita × 1,65%) − Créditos PIS
- COFINS = (Receita × 7,60%) − Créditos COFINS
- Base legal: Leis 10.637/2002 e 10.833/2003
- Créditos: insumos, aluguéis de PJ, depreciação de máquinas
- Apuração: MENSAL

### Componente `ConferenciaPISCOFINS`:

- Seletor de mês/ano (não trimestre — PIS/COFINS é sempre mensal)
- Toggle automático do regime baseado no `regime_tributario` da empresa
- Campos: Receita Bruta | Exclusões (expansível com detalhamento) | Base de Cálculo
- Para não-cumulativo: seção adicional de créditos com tipo e valor
- Resultado: PIS a pagar | COFINS a pagar | Total | Data de vencimento calculada
- Histórico mensal: gráfico de barras com os últimos 12 meses (usar Recharts)
- Alerta se vencimento < 5 dias: banner âmbar
- Botão exportar DARF (código + valor + data)

### Serviço `pisCofinService.ts`:
- `calcularCumulativo(receitaBruta, exclusoes): { pis, cofins, base }`
- `calcularNaoCumulativo(receitaBruta, creditos): { pis, cofins, base }`
- `calcularVencimento(ano, mes): Date`
- `salvarCalculo(empresaId, calculo): Promise<void>`

Salve os resultados na tabela `calculos_pis_cofins`.
```

---

### PROMPT 5 — Histórico de Cálculos e Exportação PDF

```markdown
## Contexto
Sistema tributário React/TypeScript/Supabase com módulos IRPJ/CSLL e PIS/COFINS implementados.

## Tarefa: Histórico de cálculos + Exportação PDF com filtros avançados

### 1. Página `HistoricoCalculos`

**Filtros avançados (painel superior colapsável):**
- Empresa (multi-select com busca)
- Ano (checkbox múltiplo)
- Trimestre (1º ao 4º)
- Mês (jan a dez)
- Tipo de tributo (IRPJ/CSLL | PIS/COFINS | Todos)
- Status (conferido | pendente | com divergência)
- Regime tributário

**Tabela de resultados:**
- Empresa | CNPJ | Período | Regime | IRPJ | CSLL | PIS | COFINS | Total | Status | Ações
- Paginação (25, 50, 100 por página)
- Ordenação por coluna
- Linha com divergência destacada em fundo âmbar claro
- Ação: [👁 Ver detalhes] [📄 Exportar PDF] [✏️ Editar]

**Cards de resumo no topo:**
- Total calculado no período filtrado | Qtd empresas | Qtd com divergência

### 2. Exportação PDF

Use a biblioteca `@react-pdf/renderer` ou `jspdf + html2canvas`.

**Layout do PDF:**
```
┌─────────────────────────────────────────────────────┐
│  [LOGO ESCRITÓRIO — carregar de /assets/LOGO.png]   │
│  RELATÓRIO DE APURAÇÃO TRIBUTÁRIA                   │
│  Período: [filtros aplicados]    Gerado em: xx/xx   │
├─────────────────────────────────────────────────────┤
│  EMPRESA: Nome | CNPJ | Regime                      │
├─────────────────────────────────────────────────────┤
│  PERÍODO: Trimestre/Ano                             │
│                                                     │
│  IRPJ E CSLL                                        │
│  Receita Bruta:          R$ xxx.xxx,xx              │
│  % Presunção IRPJ:       32%                        │
│  Base de Cálculo IRPJ:   R$ xxx.xxx,xx              │
│  IRPJ (15%):             R$  xx.xxx,xx              │
│  Adicional IRPJ (10%):   R$   x.xxx,xx              │
│  CSLL (9%):              R$   x.xxx,xx              │
│                                                     │
│  PIS/COFINS (meses do trimestre)                    │
│  [tabela mensal]                                    │
│                                                     │
│  TOTAL DE TRIBUTOS DO PERÍODO: R$ xxx.xxx,xx        │
├─────────────────────────────────────────────────────┤
│  Base legal: Lei 9.249/1995 | Lei 9.430/1996       │
└─────────────────────────────────────────────────────┘
```

Parâmetros da função:
```typescript
exportarPDF(filtros: FiltrosPeriodo, empresas: string[]): Promise<Blob>
```

Registre cada exportação na tabela `historico_exportacoes`.

### 3. Lógica de armazenamento Supabase
- `useHistorico(filtros)` — hook com React Query para buscar histórico paginado
- Armazenar resultado também em `window.storage` para cache local (artifact storage)
```

---

### PROMPT 6 — Design System: Sidebar com Logo e Navegação

```markdown
## Contexto
Sistema tributário React/TypeScript/Tailwind CSS.

## Tarefa: Implementar Sidebar com Design System completo

### Layout da Sidebar (240px, fundo escuro #1A2B4A):

**Topo:**
- Logo do escritório: carregar de `/assets/LOGO.png` (copiar de G:\GUSTAVO\...\LOGO.png)
- Fallback: iniciais do escritório em círculo âmbar se imagem não carregar
- Nome do escritório abaixo da logo (13px, branco 70%)

**Navegação principal:**
```
🏢  Empresas
📊  Apuração
    ├── IRPJ / CSLL
    ├── PIS / COFINS
    └── Majoração (BEPS)
📋  Histórico
📄  Relatórios
⚙️  Configurações
    ├── Parâmetros
    └── Usuários
```

**Tokens de design da sidebar:**
- Background item hover: `rgba(255,255,255,0.07)`
- Background item ativo: `#2E6DA4` (azul médio)
- Texto normal: `rgba(255,255,255,0.75)`
- Texto ativo: `#FFFFFF`
- Ícones: 16px, cor herdada do texto
- Sub-itens: indent 16px, fonte 13px

**Componente `Sidebar`:**
```tsx
interface SidebarProps {
  logoPath: string;
  nomeEscritorio: string;
  collapsed?: boolean;
}
```

- Suporte a modo colapsado (apenas ícones, 64px)
- Toggle collapse via botão no rodapé da sidebar
- Em mobile: drawer lateral com overlay

**Topbar (fixo, 56px):**
- Breadcrumb da página atual
- Botão "Nova apuração" (ação primária âmbar)
- Filtros de contexto (empresa atual selecionada globalmente)
- Notificações (vencimentos próximos)

**Design tokens adicionais:**
```css
--sidebar-width: 240px;
--sidebar-collapsed-width: 64px;
--topbar-height: 56px;
--transition-speed: 200ms;
```

Implemente com Tailwind CSS + CSS variables. Animações suaves via `transition-all`.
Inclua `ThemeProvider` com suporte a dark/light mode persistido em localStorage.
```

---

### PROMPT 7 — Importação do CSV de Empresas

```markdown
## Contexto
Sistema tributário Node.js/TypeScript/Supabase. 
CSV disponível em: `G:\GUSTAVO\Lucro presumido majoração\lucro-presumido\Exportacao de Empresas Simples.csv`

## Tarefa: Script de importação de empresas

Crie `scripts/importar-empresas.ts` que:

1. **Leia o CSV** com `csv-parse` ou `papaparse`
2. **Detecte automaticamente** as colunas disponíveis (imprima header para validação)
3. **Mapeie os campos** para a tabela `empresas`:
   - Nome/Razão Social → `razao_social`
   - CNPJ (se disponível) → `cnpj` (formatar como XX.XXX.XXX/XXXX-XX)
   - Código/Identificador → `codigo_interno`
   - Regime (se houver) → `regime_tributario`
   - Atividade → `atividade_principal`
4. **Defina defaults** para campos não presentes no CSV:
   - `regime_tributario` = 'lucro_presumido'
   - `modalidade_recolhimento` = 'trimestral'
   - `sujeito_majoracao` = false
   - `ativo` = true
5. **Upsert no Supabase** (insert ou update se CNPJ já existir)
6. **Relatório final:**
   ```
   ✓ 45 empresas importadas
   ✓  3 empresas atualizadas (já existiam)
   ✗  2 linhas com erro (imprimir detalhes)
   ```

Use transação para garantir atomicidade. Gere log em `logs/importacao-YYYY-MM-DD.log`.

Parâmetros de execução: `npx ts-node scripts/importar-empresas.ts --arquivo="caminho/arquivo.csv" --dry-run`
```

---

### PROMPT 8 — Dashboard Principal

```markdown
## Contexto
Sistema tributário React/TypeScript. Todos os módulos implementados.

## Tarefa: Dashboard Principal (página inicial)

### Cards de métricas (linha superior):
- Total de empresas ativas | Com apuração no trimestre atual | Com vencimento em até 7 dias | Com divergência

### Painel "Próximos Vencimentos" (centro-esquerda):
- Lista das empresas com tributos a vencer nos próximos 30 dias
- Colunas: Empresa | Tributo | Valor | Vencimento | Status
- Badge colorido por urgência: vermelho (<3 dias), âmbar (4-10 dias), verde (>10 dias)

### Gráfico "Carga Tributária por Empresa" (centro-direita):
- Barras agrupadas: IRPJ | CSLL | PIS | COFINS por empresa
- Filtro de período no topo do card
- Use Recharts BarChart

### Tabela "Últimas Apurações":
- 10 mais recentes | link "Ver histórico completo"

### Widget "Alerta de Majoração":
- Exibir apenas se existirem empresas com `sujeito_majoracao = true`
- Destaque especial para 1T/2026: "⚠ CSLL majorada não vigente no 1T/2026"

Implemente com React Query para fetching + loading skeletons para cada card.
Use o design system definido no Prompt 6 (cores, tipografia, espaçamento).
```

---

## PARTE 5 — CHECKLIST DE IMPLEMENTAÇÃO

### Ordem recomendada de execução:

```
[  ] 1. Executar Prompt 1 → Criar migração SQL completa
[  ] 2. Executar migração no Supabase
[  ] 3. Executar Prompt 7 → Importar CSV de empresas
[  ] 4. Executar Prompt 6 → Design system + sidebar com logo
[  ] 5. Executar Prompt 2 → Regra do 1T/2026 CSLL
[  ] 6. Executar Prompt 3 → Conferência IRPJ/CSLL (mensal e trimestral)
[  ] 7. Executar Prompt 4 → Módulo PIS/COFINS
[  ] 8. Executar Prompt 5 → Histórico + Exportação PDF
[  ] 9. Executar Prompt 8 → Dashboard principal
[  ] 10. Testes de integração + revisão UX
```

### Dependências npm a instalar:

```bash
# Core
npm install @supabase/supabase-js react-query

# PDF
npm install @react-pdf/renderer jspdf html2canvas

# Gráficos
npm install recharts

# CSV
npm install csv-parse papaparse @types/papaparse

# Datas
npm install date-fns

# Formulários
npm install react-hook-form zod @hookform/resolvers

# UI
npm install @radix-ui/react-select @radix-ui/react-dialog @radix-ui/react-toast
```

### Variáveis de ambiente necessárias:

```env
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_KEY=...
NEXT_PUBLIC_ESCRITORIO_NOME="Nome do Escritório"
NEXT_PUBLIC_LOGO_PATH=/assets/LOGO.png
```

---

## PARTE 6 — REFERÊNCIAS LEGAIS COMPLETAS

| Tributo | Base Legal | Artigos Principais |
|---|---|---|
| IRPJ Lucro Presumido | Lei 9.249/1995; Lei 9.430/1996; RIR/2018 (Dec. 9.580/2018) | Art. 15, 16 (LP); Art. 1º-9º (trimestral) |
| CSLL Lucro Presumido | Lei 9.249/1995; Lei 7.689/1988 | Art. 20 (presunção CSLL) |
| Adicional IRPJ 10% | Lei 9.249/1995 | Art. 3º, §1º |
| PIS Cumulativo | Lei 9.718/1998; Lei 10.637/2002 | Art. 2º, 3º |
| COFINS Cumulativa | Lei 9.718/1998; Lei 10.833/2003 | Art. 2º, 3º |
| PIS Não-Cumulativo | Lei 10.637/2002 | Integralmente |
| COFINS Não-Cumulativa | Lei 10.833/2003 | Integralmente |
| Majoração IRPJ/CSLL (BEPS) | MP 1.262/2024; IN RFB 2.228/2024 | Arts. 1º-15 da MP |
| Lucro Real | Lei 6.404/1976; RIR/2018 | Livro II, Títulos I-III |

---

*Documento gerado em: abril/2026 — Sistema Tributário Escritório Contábil*  
*Atualizado conforme: MP 1.262/2024 (QDMTT/BEPS Pilar 2) | IN RFB 2.228/2024*
