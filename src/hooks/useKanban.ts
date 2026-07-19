import { useContext } from 'react';
import { KanbanContext, type KanbanContextValue } from '@/context/KanbanContext';

/**
 * Hook de acesso ao estado e às ações do Kanban.
 * Lança erro explícito caso usado fora de `<KanbanProvider>`,
 * facilitando a depuração durante o desenvolvimento.
 */
export function useKanban(): KanbanContextValue {
  const contexto = useContext(KanbanContext);
  if (!contexto) {
    throw new Error('useKanban deve ser usado dentro de um <KanbanProvider>.');
  }
  return contexto;
}
