/**
 * Identificadores das 10 colunas fixas do Kanban logístico.
 */
export type ColumnId =
  | 'prospeccao-motorista'
  | 'cadastramento'
  | 'agendamento'
  | 'carregamento-documentacao'
  | 'guia'
  | 'adiantamento'
  | 'viagem'
  | 'descarga'
  | 'saldo'
  | 'historico-finalizacao';

/** Toda coluna possui obrigatoriamente as subcolunas "A Fazer" e "Fazendo". */
export type SubColumnId = 'a-fazer' | 'fazendo';

/**
 * Registro de retificação: criado quando uma tarefa é devolvida para
 * uma etapa anterior por não ter sido aprovada (ex.: Guia de ICMS
 * retificada). Mantém o motivo informado e some automaticamente
 * quando a etapa de origem é reenviada.
 */
export interface Retificacao {
  motivo: string;
  colunaOrigem: ColumnId;
  criadoEm: string;
}

/**
 * Tarefa: cartão do Kanban. Representa o trabalho de um Pedido
 * dentro de uma coluna/etapa específica do fluxo logístico.
 *
 * `dadosEtapa` é indexado por coluna (`ColumnId`) para que os dados
 * preenchidos em cada formulário de etapa sejam preservados mesmo
 * depois que a tarefa avança para as colunas seguintes — o modal
 * "Ver Informações" exibe o histórico completo de todas as etapas já
 * preenchidas, não apenas a etapa atual.
 */
export interface Tarefa {
  id: string;
  pedidoId: string;
  columnId: ColumnId;
  subColumnId: SubColumnId;
  titulo: string;
  descricao?: string;
  responsavel?: string;
  prazo?: string;
  pendente: boolean;
  pendenciaAtualId?: string;
  checklistId?: string;
  /** Nome do usuário que criou o Pedido/Tarefa (via "Criar Pedido"). Fixo até a finalização. */
  criadoPor?: string;
  /**
   * Nome do usuário que está "Fazendo" esta tarefa no momento — definido
   * ao arrastar de "A Fazer" para "Fazendo" (ou ao finalizar uma
   * pendência) e limpo assim que a tarefa avança para a próxima coluna,
   * liberando-a para o próximo responsável.
   */
  fazendoPor?: string;
  /**
   * Coluna em que a tarefa estava imediatamente antes da coluna atual
   * (`columnId`), atualizada a cada avanço de etapa ou retificação.
   * Usada pelo botão "Retificar" (disponível em qualquer "A Fazer")
   * para devolver a tarefa exatamente à coluna correta — em vez de
   * assumir a coluna anterior na ordem fixa do Kanban, o que erraria
   * para tarefas de Frota, que pulam "Guia", "Adiantamento" e "Saldo".
   */
  colunaAnterior?: ColumnId;
  /** Dados preenchidos em cada etapa, indexados pela coluna correspondente. */
  dadosEtapa?: Partial<Record<ColumnId, Record<string, unknown>>>;
  /** Presente quando a tarefa foi devolvida para retificação (ver etapa "Guia"). */
  retificacao?: Retificacao;
  /**
   * Data/hora (ISO) em que a tarefa entrou na subcoluna atual
   * (`subColumnId`). Reiniciado sempre que a tarefa muda de subcoluna
   * — seja por arraste (A Fazer → Fazendo), avanço de etapa, retorno
   * de pendência ou retificação — usado para calcular há quanto tempo
   * a tarefa está parada ali (exibido no cartão e usado para o
   * destaque de atraso e para a ordenação das listas).
   */
  subColunaDesde: string;
  /**
   * Marca a tarefa como urgente. Só pode ser alternado enquanto a
   * tarefa está em "A Fazer" (`subColumnId === 'a-fazer'`); dá
   * destaque visual laranja e prioridade máxima na ordenação da
   * subcoluna.
   */
  urgente?: boolean;
  criadoEm: string;
  atualizadoEm: string;
}

/** Dados necessários para criar uma Tarefa. */
export type CriarTarefaInput = Pick<
  Tarefa,
  'pedidoId' | 'columnId' | 'subColumnId' | 'titulo'
> &
  Partial<Pick<Tarefa, 'descricao' | 'responsavel' | 'prazo' | 'dadosEtapa'>>;
