import type { EntidadeTipo } from './entidade';

/**
 * Histórico: trilha de auditoria genérica, aplicável a qualquer
 * entidade do sistema (Pedido, Tarefa, Pendência, Checklist, Sessão).
 */
export type AcaoHistorico =
  | 'criacao'
  | 'edicao'
  | 'movimentacao'
  | 'pendencia-criada'
  | 'pendencia-resolvida'
  | 'checklist-atualizado'
  | 'observacao-adicionada'
  | 'finalizacao'
  | 'exclusao';

export interface HistoricoEntry {
  id: string;
  entidadeId: string;
  entidadeTipo: EntidadeTipo;
  acao: AcaoHistorico;
  descricao: string;
  usuario: string;
  data: string;
  metadados?: Record<string, unknown>;
}
