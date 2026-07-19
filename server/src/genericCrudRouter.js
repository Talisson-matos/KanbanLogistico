import { Router } from 'express';
import { conectar } from './db.js';

/**
 * Coleções simples (documento identificado por um campo `id` string,
 * gerado no frontend) que usam exatamente o mesmo formato de CRUD.
 * Mantido como lista explícita por segurança — nenhuma outra coleção
 * pode ser acessada através desta rota genérica.
 */
export const COLECOES_PERMITIDAS = new Set([
  'pedidos',
  'tarefas',
  'pendencias',
  'checklists',
  'sessoes',
  'historico',
  'observacoes',
]);

/**
 * Cria um router Express com o CRUD completo (get all, get by id,
 * create, update parcial, delete, replace all) para uma coleção do
 * MongoDB. Espelha exatamente os métodos de `IStorageService<T>` do
 * frontend, para que `ApiStorageService` seja uma simples camada de
 * chamadas HTTP sem lógica de negócio própria.
 */
export function criarRotaGenerica(nomeColecao) {
  if (!COLECOES_PERMITIDAS.has(nomeColecao)) {
    throw new Error(`Coleção não permitida na rota genérica: ${nomeColecao}`);
  }

  const router = Router();

  router.get('/', async (req, res, next) => {
    try {
      const db = await conectar();
      const itens = await db.collection(nomeColecao).find({}).project({ _id: 0 }).toArray();
      res.json(itens);
    } catch (erro) {
      next(erro);
    }
  });

  router.get('/:id', async (req, res, next) => {
    try {
      const db = await conectar();
      const item = await db
        .collection(nomeColecao)
        .findOne({ id: req.params.id }, { projection: { _id: 0 } });
      if (!item) return res.status(404).json({ erro: 'Registro não encontrado.' });
      res.json(item);
    } catch (erro) {
      next(erro);
    }
  });

  router.post('/', async (req, res, next) => {
    try {
      const db = await conectar();
      const item = req.body;
      if (!item || typeof item.id !== 'string') {
        return res.status(400).json({ erro: 'O corpo da requisição precisa conter um campo "id".' });
      }
      await db.collection(nomeColecao).insertOne({ ...item });
      res.status(201).json(item);
    } catch (erro) {
      next(erro);
    }
  });

  router.patch('/:id', async (req, res, next) => {
    try {
      const db = await conectar();
      const alteracoes = { ...req.body };
      delete alteracoes.id;
      delete alteracoes._id;

      // O frontend converte campos que deveriam ser "apagados" (valor
      // `undefined`, ex.: `retificacao: undefined` ao concluir uma
      // retificação) em `null` antes de enviar — porque `JSON.stringify`
      // simplesmente descartaria essas chaves, e o campo antigo nunca
      // seria de fato removido no banco. Aqui, tratamos `null` como
      // pedido de remoção real do campo (`$unset`); os demais valores
      // seguem como atualização normal (`$set`).
      const paraDefinir = {};
      const paraRemover = {};
      for (const [chave, valor] of Object.entries(alteracoes)) {
        if (valor === null) {
          paraRemover[chave] = '';
        } else {
          paraDefinir[chave] = valor;
        }
      }

      const operacao = {};
      if (Object.keys(paraDefinir).length > 0) operacao.$set = paraDefinir;
      if (Object.keys(paraRemover).length > 0) operacao.$unset = paraRemover;

      if (Object.keys(operacao).length === 0) {
        // Nada para alterar de fato — apenas retorna o documento atual.
        const atual = await db
          .collection(nomeColecao)
          .findOne({ id: req.params.id }, { projection: { _id: 0 } });
        if (!atual) return res.status(404).json({ erro: 'Registro não encontrado.' });
        return res.json(atual);
      }

      const resultadoBruto = await db
        .collection(nomeColecao)
        .findOneAndUpdate({ id: req.params.id }, operacao, {
          returnDocument: 'after',
          projection: { _id: 0 },
        });

      // Dependendo da versão do driver, o documento pode vir direto
      // ou dentro de `{ value: documento }` — tratamos os dois casos.
      const resultado =
        resultadoBruto && typeof resultadoBruto === 'object' && 'value' in resultadoBruto
          ? resultadoBruto.value
          : resultadoBruto;

      if (!resultado) return res.status(404).json({ erro: 'Registro não encontrado.' });
      res.json(resultado);
    } catch (erro) {
      next(erro);
    }
  });

  router.delete('/:id', async (req, res, next) => {
    try {
      const db = await conectar();
      await db.collection(nomeColecao).deleteOne({ id: req.params.id });
      res.status(204).end();
    } catch (erro) {
      next(erro);
    }
  });

  // Substitui toda a coleção — usado por `replaceAll` (sincronizações/migrações).
  router.put('/', async (req, res, next) => {
    try {
      const db = await conectar();
      const itens = Array.isArray(req.body) ? req.body : [];
      await db.collection(nomeColecao).deleteMany({});
      if (itens.length > 0) {
        await db.collection(nomeColecao).insertMany(itens.map((item) => ({ ...item })));
      }
      res.status(204).end();
    } catch (erro) {
      next(erro);
    }
  });

  return router;
}
