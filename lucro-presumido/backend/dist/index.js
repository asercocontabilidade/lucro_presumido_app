"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const morgan_1 = __importDefault(require("morgan"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const PORT = process.env.PORT ?? 3001;
app.use((0, cors_1.default)({ origin: '*' }));
app.use(express_1.default.json());
app.use((0, morgan_1.default)('dev'));
app.use('/api', routes_1.default);
app.get('/health', (_req, res) => res.json({ status: 'ok' }));
// Handler global de erros — captura qualquer exceção não tratada nos controllers
app.use((err, _req, res, _next) => {
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
