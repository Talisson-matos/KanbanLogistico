import { Router } from 'express';
import { conectar } from '../db.js';
import { SENHA_MESTRE_ACESSO } from './auth.js';

/**
 * Middleware que exige a senha mestre da tela "Acesso de senhas" em
 * toda requisição (query `senhaAdmin` ou corpo `{ senhaAdmin }`).
 * Protege a listagem/exclusão de usuários de ser chamada sem passar
 * pela tela de acesso.
 */
function exigirSenhaMestre(req, res, next) {
  const senha = req.query.senhaAdmin ?? req.body?.senhaAdmin;
  if (senha !== SENHA_MESTRE_ACESSO) {
    return res.status(401).json({ erro: 'Acesso negado.' });
  }
  next();
}

const router = Router();

/**
 * GET /api/usuarios?senhaAdmin=...
 * Lista todos os usuários com nome e senha em texto puro — usado
 * exclusivamente pela tela "Acesso de senhas".
 */
router.get('/', exigirSenhaMestre, async (req, res, next) => {
  try {
    const db = await conectar();
    const usuarios = await db
      .collection('usuarios')
      .find({})
      .project({ _id: 0 })
      .sort({ criadoEm: 1 })
      .toArray();
    res.json(usuarios);
  } catch (erro) {
    next(erro);
  }
});

/**
 * DELETE /api/usuarios/:id
 * Body: { senhaAdmin }
 * Exclui um usuário/login. Usado pela tela "Acesso de senhas" para
 * remover o acesso de qualquer login cadastrado.
 */
router.delete('/:id', exigirSenhaMestre, async (req, res, next) => {
  try {
    const db = await conectar();
    await db.collection('usuarios').deleteOne({ id: req.params.id });
    res.status(204).end();
  } catch (erro) {
    next(erro);
  }
});

export default router;
