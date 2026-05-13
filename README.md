# Sistema de Lucro Presumido — IRPJ

Sistema web interno para cálculo do Lucro Presumido com majoração de IRPJ e CSLL.

## Stack

- **Frontend**: React 18 + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript
- **Banco de dados**: PostgreSQL + Prisma ORM
- **Exportação**: PDFKit + ExcelJS
- **Autenticação**: JWT (8h)

---

## Implantação com Docker (recomendado)

```bash
cd lucro-presumido
docker-compose up -d
```

Acesse: http://localhost:3000

Login padrão: `admin@empresa.com.br` / `admin123`

---

## Desenvolvimento local

### Backend

```bash
cd backend
cp .env.example .env
# Edite .env com sua string de conexão PostgreSQL
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Acesse: http://localhost:5173

---

## Estrutura do projeto

```
lucro-presumido/
├── backend/
│   └── src/
│       ├── controllers/     # Lógica HTTP
│       ├── services/        # Regras de negócio + PDF/Excel
│       ├── middleware/       # Auth JWT
│       ├── routes/          # Endpoints da API
│       └── prisma/          # Schema + seed
├── frontend/
│   └── src/
│       ├── pages/           # Telas principais
│       ├── components/      # Componentes reutilizáveis
│       ├── contexts/        # AuthContext
│       └── utils/           # Cálculo, formatação, API
└── docker-compose.yml
```

---

## Endpoints da API

| Método | Rota | Descrição |
|--------|------|-----------|
| POST | /api/auth/login | Login |
| GET | /api/auth/perfil | Perfil do usuário logado |
| PUT | /api/auth/senha | Alterar senha |
| GET | /api/calculos | Listar cálculos (paginado) |
| GET | /api/calculos/dashboard | Dados do dashboard |
| GET | /api/calculos/:id | Buscar cálculo |
| POST | /api/calculos | Criar cálculo |
| PUT | /api/calculos/:id | Editar cálculo |
| DELETE | /api/calculos/:id | Excluir cálculo |
| POST | /api/calculos/:id/duplicar | Duplicar cálculo |
| POST | /api/calculos/preview | Preview sem salvar |
| GET | /api/calculos/:id/pdf | Exportar PDF |
| GET | /api/calculos/:id/excel | Exportar Excel |
| GET | /api/usuarios | Listar usuários (admin) |
| POST | /api/usuarios | Criar usuário (admin) |
| PUT | /api/usuarios/:id | Editar usuário (admin) |
| PUT | /api/usuarios/:id/senha | Resetar senha (admin) |

---

## Regras de negócio

- Limite trimestral sem majoração: **R$ 1.250.000,00**
- Quando a receita bruta supera esse limite, o excedente é alocado na "Parcela com Acréscimo"
- O percentual com acréscimo = percentual da faixa × 1,10 (majoração de 10%)
- Adicional de IR (10%) incide sobre a base que exceder R$ 60.000,00/trimestre
- IRPJ = 15% sobre a base presumida total
- CSLL = 9% sobre a base presumida (presunção 12% ou 32%)

---

## Segurança para produção

1. Altere `JWT_SECRET` para um valor aleatório forte: `openssl rand -base64 32`
2. Altere a senha do banco de dados no `docker-compose.yml`
3. Configure HTTPS no nginx (certificado interno da intranet)
4. Restrinja o CORS no backend para o domínio interno
