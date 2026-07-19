/**
 * Pendência: registrada quando uma Tarefa é marcada como "Pendente".
 * Mantém o motivo e o status de resolução, permitindo histórico
 * de pendências por tarefa.
 */
export interface Pendencia {
  id: string;
  tarefaId: string;
  motivo: string;
  detalhes?: string;
  resolvida: boolean;
  criadoEm: string;
  resolvidoEm?: string;
}

export type CriarPendenciaInput = Pick<Pendencia, 'tarefaId' | 'motivo'> &
  Partial<Pick<Pendencia, 'detalhes'>>;
