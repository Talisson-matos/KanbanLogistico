import { MongoClient } from 'mongodb';

const uri = process.env.MONGODB_URI;
const nomeBanco = process.env.MONGODB_DB_NAME || 'kanban_logistico';

if (!uri) {
  throw new Error(
    'Variável de ambiente MONGODB_URI não definida. Copie server/.env.example para server/.env e preencha a connection string.',
  );
}

const client = new MongoClient(uri);

/** Promessa de conexão única (evita reconectar a cada chamada). */
let promessaConexao = null;

/**
 * Conecta ao MongoDB (uma única vez) e retorna a instância do banco
 * de dados usado pela aplicação.
 */
export async function conectar() {
  if (!promessaConexao) {
    promessaConexao = client.connect().then(() => client.db(nomeBanco));
  }
  return promessaConexao;
}

export function getClient() {
  return client;
}

export async function fecharConexao() {
  await client.close();
  promessaConexao = null;
}
