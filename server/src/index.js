import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { conectar } from './db.js';
import { criarRotaGenerica, COLECOES_PERMITIDAS } from './genericCrudRouter.js';
import arquivosRouter from './routes/arquivos.js';
import authRouter from './routes/auth.js';
import usuariosRouter from './routes/usuarios.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (req, res) => {
  res.json({ ok: true, servico: 'logistics-kanban-server' });
});

for (const nomeColecao of COLECOES_PERMITIDAS) {
  app.use(`/api/${nomeColecao}`, criarRotaGenerica(nomeColecao));
}

app.use('/api/arquivos', arquivosRouter);
app.use('/api/auth', authRouter);
app.use('/api/usuarios', usuariosRouter);

// Handler de erro genérico — mantém a API respondendo JSON mesmo em falhas.
// eslint-disable-next-line no-unused-vars
app.use((erro, req, res, next) => {
  console.error('[API] Erro não tratado:', erro);
  res.status(500).json({ erro: 'Erro interno do servidor.' });
});

const PORTA = process.env.PORT || 4000;

conectar()
  .then(() => {
    app.listen(PORTA, () => {
      console.log(`✔ Conectado ao MongoDB.`);
      console.log(`✔ API do Kanban Logístico rodando em http://localhost:${PORTA}/api`);
    });
  })
  .catch((erro) => {
    console.error('✗ Falha ao conectar ao MongoDB:', erro.message);
    process.exit(1);
  });
