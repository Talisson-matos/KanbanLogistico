/**
 * Checklist: lista de verificação associada a uma Tarefa.
 * Estrutura genérica e reutilizável; os itens específicos de cada
 * etapa serão definidos junto com os formulários das próximas partes.
 */
export interface ChecklistItem {
  id: string;
  descricao: string;
  concluido: boolean;
  concluidoEm?: string;
}

export interface Checklist {
  id: string;
  tarefaId: string;
  titulo: string;
  itens: ChecklistItem[];
  criadoEm: string;
  atualizadoEm: string;
}
