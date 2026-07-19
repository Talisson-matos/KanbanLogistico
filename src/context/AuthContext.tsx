import React, { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { UsuarioPublico } from '@/types';
import { authService } from '@/services/auth/authService';

/**
 * Chave de persistência do usuário logado. Isto é apenas estado de
 * *sessão do navegador* (quem está usando esta aba agora), não dado
 * de domínio do Kanban — por isso continua em `localStorage` mesmo
 * com a migração dos dados do quadro para o MongoDB.
 */
const CHAVE_USUARIO_ATUAL = 'kanban-logistico:usuario-atual';

export interface AuthContextValue {
  usuarioAtual: UsuarioPublico | null;
  carregando: boolean;
  erro: string | null;
  login: (nome: string, senha: string) => Promise<boolean>;
  registrar: (nome: string, senha: string, confirmarSenha: string) => Promise<boolean>;
  logout: () => void;
  limparErro: () => void;
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [usuarioAtual, setUsuarioAtual] = useState<UsuarioPublico | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Restaura a sessão salva (se houver) ao carregar a aplicação.
  useEffect(() => {
    try {
      const bruto = window.localStorage.getItem(CHAVE_USUARIO_ATUAL);
      if (bruto) setUsuarioAtual(JSON.parse(bruto));
    } catch (erroLeitura) {
      console.error('[AuthProvider] Falha ao restaurar sessão salva:', erroLeitura);
    } finally {
      setCarregando(false);
    }
  }, []);

  const persistirUsuario = useCallback((usuario: UsuarioPublico | null) => {
    setUsuarioAtual(usuario);
    try {
      if (usuario) {
        window.localStorage.setItem(CHAVE_USUARIO_ATUAL, JSON.stringify(usuario));
      } else {
        window.localStorage.removeItem(CHAVE_USUARIO_ATUAL);
      }
    } catch (erroEscrita) {
      console.error('[AuthProvider] Falha ao salvar sessão:', erroEscrita);
    }
  }, []);

  const login = useCallback(
    async (nome: string, senha: string): Promise<boolean> => {
      setErro(null);
      try {
        const usuario = await authService.login(nome, senha);
        persistirUsuario(usuario);
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível entrar.');
        return false;
      }
    },
    [persistirUsuario],
  );

  const registrar = useCallback(
    async (nome: string, senha: string, confirmarSenha: string): Promise<boolean> => {
      setErro(null);
      try {
        const usuario = await authService.registrar(nome, senha, confirmarSenha);
        persistirUsuario(usuario);
        return true;
      } catch (e) {
        setErro(e instanceof Error ? e.message : 'Não foi possível cadastrar.');
        return false;
      }
    },
    [persistirUsuario],
  );

  const logout = useCallback(() => {
    persistirUsuario(null);
  }, [persistirUsuario]);

  const limparErro = useCallback(() => setErro(null), []);

  const value = useMemo<AuthContextValue>(
    () => ({ usuarioAtual, carregando, erro, login, registrar, logout, limparErro }),
    [usuarioAtual, carregando, erro, login, registrar, logout, limparErro],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
