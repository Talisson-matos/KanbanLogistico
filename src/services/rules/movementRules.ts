import type { Tarefa, ColumnId, SubColumnId } from '@/types';

/**
 * Motor de regras de movimentação do Kanban.
 *
 * O arraste (drag and drop) só é permitido em um único sentido, dentro
 * da mesma coluna: de "A Fazer" para "Fazendo". O retorno manual de
 * "Fazendo" para "A Fazer" é proibido — a única forma de uma tarefa
 * "voltar" é sendo marcada como Pendente (o que a remove do quadro e a
 * envia para a caixa "Pendentes" da própria coluna) e, posteriormente,
 * tendo sua pendência finalizada, o que a devolve sempre para a
 * subcoluna "Fazendo" da coluna de origem (nunca para "A Fazer").
 *
 * A movimentação entre colunas diferentes (avanço de etapa do fluxo
 * logístico) permanece fora do escopo do drag and drop nesta parte do
 * projeto e dependerá de regras de negócio específicas a serem
 * definidas nas próximas partes.
 *
 * Toda a lógica de "o que é permitido arrastar para onde" fica
 * centralizada aqui, para que o restante da aplicação (Board, Column,
 * TaskCard) nunca precise conhecer as regras diretamente.
 */
export interface DestinoMovimentacao {
  columnId: ColumnId;
  subColumnId: SubColumnId;
}

export interface ResultadoRegra {
  permitido: boolean;
  motivo?: string;
}

export function podeMoverTarefa(
  tarefa: Tarefa,
  destino: DestinoMovimentacao,
): ResultadoRegra {
  // Tarefas pendentes não fazem parte do quadro visível e não podem
  // ser movidas por arraste; só retornam via "Pendência Finalizada".
  if (tarefa.pendente) {
    return {
      permitido: false,
      motivo: 'Esta tarefa está pendente. Finalize a pendência para retomá-la.',
    };
  }

  // Nenhuma mudança real de posição.
  if (tarefa.columnId === destino.columnId && tarefa.subColumnId === destino.subColumnId) {
    return { permitido: false };
  }

  // Movimentação entre colunas diferentes: fora do escopo do drag
  // nesta etapa do projeto.
  if (tarefa.columnId !== destino.columnId) {
    return {
      permitido: false,
      motivo:
        'Conclua a etapa atual em "Abrir Tarefa" antes de movimentar para outra coluna.',
    };
  }

  // Dentro da mesma coluna: só é permitido avançar de "A Fazer" para "Fazendo".
  if (tarefa.subColumnId === 'a-fazer' && destino.subColumnId === 'fazendo') {
    return { permitido: true };
  }

  // Qualquer outro sentido (em especial "Fazendo" -> "A Fazer") é bloqueado.
  return {
    permitido: false,
    motivo:
      'Não é permitido retornar manualmente para "A Fazer". Utilize a caixa Pendentes para isso.',
  };
}
