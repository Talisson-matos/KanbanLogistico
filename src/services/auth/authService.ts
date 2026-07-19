import { API_BASE_URL } from '@/config/api';
import type { UsuarioComSenha, UsuarioPublico } from '@/types';

const ENDPOINT_AUTH = `${API_BASE_URL}/auth`;
const ENDPOINT_USUARIOS = `${API_BASE_URL}/usuarios`;

async function tratarResposta<T>(resposta: Response): Promise<T> {
  const corpo = await resposta.json().catch(() => null);
  if (!resposta.ok) {
    const mensagem = corpo && typeof corpo === 'object' && 'erro' in corpo ? String(corpo.erro) : null;
    throw new Error(mensagem ?? `Erro inesperado (HTTP ${resposta.status}).`);
  }
  return corpo as T;
}

/**
 * Serviço de autenticação: fala com as rotas `server/src/routes/auth.js`
 * (login, registro, verificação da senha mestre) e
 * `server/src/routes/usuarios.js` (listagem/exclusão administrativa,
 * usada pela tela "Acesso de senhas").
 */
export const authService = {
  async login(nome: string, senha: string): Promise<UsuarioPublico> {
    const resposta = await fetch(`${ENDPOINT_AUTH}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha }),
    });
    return tratarResposta<UsuarioPublico>(resposta);
  },

  async registrar(nome: string, senha: string, confirmarSenha: string): Promise<UsuarioPublico> {
    const resposta = await fetch(`${ENDPOINT_AUTH}/registrar`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, senha, confirmarSenha }),
    });
    return tratarResposta<UsuarioPublico>(resposta);
  },

  /** Verifica a senha mestre da tela "Acesso de senhas". */
  async verificarSenhaAcesso(senha: string): Promise<boolean> {
    const resposta = await fetch(`${ENDPOINT_AUTH}/acesso-senhas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senha }),
    });
    return resposta.ok;
  },

  /** Lista todos os usuários com a senha em texto puro (tela administrativa). */
  async listarUsuarios(senhaAdmin: string): Promise<UsuarioComSenha[]> {
    const resposta = await fetch(
      `${ENDPOINT_USUARIOS}?senhaAdmin=${encodeURIComponent(senhaAdmin)}`,
    );
    return tratarResposta<UsuarioComSenha[]>(resposta);
  },

  /** Exclui um usuário/login (tela administrativa). */
  async excluirUsuario(id: string, senhaAdmin: string): Promise<void> {
    const resposta = await fetch(`${ENDPOINT_USUARIOS}/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ senhaAdmin }),
    });
    if (!resposta.ok && resposta.status !== 404) {
      await tratarResposta(resposta);
    }
  },
};
