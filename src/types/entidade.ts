/**
 * Tipos compartilhados relacionados a "entidades" do domínio.
 * Usados por Histórico e Observações para referenciar qualquer
 * registro do sistema (Pedido, Tarefa, Pendência, Checklist...).
 */
export type EntidadeTipo =
  | 'pedido'
  | 'tarefa'
  | 'pendencia'
  | 'checklist'
  | 'sessao';
