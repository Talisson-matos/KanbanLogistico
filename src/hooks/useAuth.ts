import { useContext } from 'react';
import { AuthContext, type AuthContextValue } from '@/context/AuthContext';

/**
 * Hook de acesso à sessão do usuário logado. Lança erro explícito se
 * usado fora de `<AuthProvider>`, facilitando a depuração.
 */
export function useAuth(): AuthContextValue {
  const contexto = useContext(AuthContext);
  if (!contexto) {
    throw new Error('useAuth deve ser usado dentro de um <AuthProvider>.');
  }
  return contexto;
}
