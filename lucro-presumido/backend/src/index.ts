import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import routes from './routes';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(morgan('dev'));

app.use('/api', routes);

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// Handler global de erros — captura qualquer exceção não tratada nos controllers
app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[ERRO]', err);
  const msg = err instanceof Error ? err.message : 'Erro interno do servidor';
  // Constraint de unicidade do Prisma (ano+trimestre já existe)
  if (msg.includes('Unique constraint') || msg.includes('unique constraint')) {
    return res.status(409).json({ erro: 'Já existe um cálculo para este trimestre/ano. Use a opção de editar.' });
  }
  return res.status(500).json({ erro: msg });
});

app.listen(PORT, () => {
  console.log(`Backend rodando em http://localhost:${PORT}`);
});
