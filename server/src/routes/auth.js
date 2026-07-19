import { Router } from 'express';
import crypto from 'node:crypto';
import { conectar } from '../db.js';

/**
 * Senha mestre de acesso à tela "Acesso de senhas" (lista/exclusão de
 * usuários com a senha em texto puro). Mantida apenas no backend —
 * nunca é exposta ao frontend, que só recebe sucesso/falha.
 *
 * Aviso de segurança: este sistema de login é deliberadamente simples
 * (sem hashing de senha, sem tokens de sessão) a pedido do projeto,
 * que exige poder exibir as senhas em texto puro na tela de
 * administração. Não é adequado para dados sensíveis reais.
 */
export const SENHA_MESTRE_ACESSO = '1335T@l2076';

const COLECAO = 'usuarios';

function gerarId() {
  return crypto.randomUUID();
}

function paraUsuarioPublico(doc) {
  return { id: doc.id, nome: doc.nome };
}

const router = Router();

/** POST /api/auth/registrar { nome, senha, confirmarSenha } */
router.post('/registrar', async (req, res, next) => {
  try {
    const nome = String(req.body?.nome ?? '').trim();
    const senha = String(req.body?.senha ?? '');
    const confirmarSenha = String(req.body?.confirmarSenha ?? '');

    if (!nome || !senha || !confirmarSenha) {
      return res.status(400).json({ erro: 'Preencha nome, senha e confirmação de senha.' });
    }
    if (senha !== confirmarSenha) {
      return res.status(400).json({ erro: 'As senhas não coincidem.' });
    }

    const db = await conectar();
    const existente = await db.collection(COLECAO).findOne({ nome });
    if (existente) {
      return res.status(409).json({ erro: 'Já existe um usuário cadastrado com esse nome.' });
    }

    const usuario = {
      id: gerarId(),
      nome,
      senha,
      criadoEm: new Date().toISOString(),
    };

    await db.collection(COLECAO).insertOne(usuario);
    res.status(201).json(paraUsuarioPublico(usuario));
  } catch (erro) {
    next(erro);
  }
});

/** POST /api/auth/login { nome, senha } */
router.post('/login', async (req, res, next) => {
  try {
    const nome = String(req.body?.nome ?? '').trim();
    const senha = String(req.body?.senha ?? '');

    if (!nome || !senha) {
      return res.status(400).json({ erro: 'Informe usuário e senha.' });
    }

    const db = await conectar();
    const usuario = await db.collection(COLECAO).findOne({ nome, senha });
    if (!usuario) {
      return res.status(401).json({ erro: 'Usuário ou senha inválidos.' });
    }

    res.json(paraUsuarioPublico(usuario));
  } catch (erro) {
    next(erro);
  }
});

/**
 * POST /api/auth/acesso-senhas { senha }
 * Apenas verifica a senha mestre (usada como "porta de entrada" da
 * tela "Acesso de senhas", antes de buscar a lista completa em
 * `GET /api/usuarios`).
 */
router.post('/acesso-senhas', (req, res) => {
  if (req.body?.senha !== SENHA_MESTRE_ACESSO) {
    return res.status(401).json({ erro: 'Senha mestre inválida.' });
  }
  res.json({ ok: true });
});

export default router;
