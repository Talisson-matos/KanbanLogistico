import type { EntidadeTipo } from './entidade';

/**
 * Observação: anotação textual livre vinculada a qualquer entidade
 * do sistema (geralmente Pedido ou Tarefa).
 */
export interface Observacao {
  id: string;
  entidadeId: string;
  entidadeTipo: EntidadeTipo;
  texto: string;
  autor: string;
  criadoEm: string;
}
