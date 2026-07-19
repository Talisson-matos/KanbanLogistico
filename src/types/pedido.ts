/**
 * Pedido: unidade de negócio que percorre todo o fluxo do Kanban
 * (da prospecção do motorista até a finalização/histórico).
 * Cada Pedido gera Tarefas em cada uma das 10 colunas do quadro.
 */
export type PedidoStatus = 'ativo' | 'finalizado' | 'cancelado';

export interface Pedido {
  id: string;
  /** Número/identificador do pedido, informado na criação. */
  numero: string;
  /** Origem da rota do frete. */
  origem: string;
  /** Destino da rota do frete. */
  destino: string;
  /** Valor combinado do frete. */
  valorFrete?: number;
  /** Campo livre para informações complementares do pedido. */
  outrasInformacoes?: string;
  /** Observações gerais do pedido. */
  observacoesGerais?: string;
  /**
   * Campos reservados para serem preenchidos pelas próximas etapas do
   * fluxo (ex.: Cadastramento define motorista/placa/veículo). Não
   * fazem parte do formulário de criação do pedido.
   */
  cliente?: string;
  motorista?: string;
  placa?: string;
  veiculo?: string;
  status: PedidoStatus;
  criadoEm: string;
  atualizadoEm: string;
}

/**
 * Dados necessários para criar um Pedido a partir do botão "Criar Pedido"
 * (id/timestamps/status são gerados pelo sistema).
 *
 * Campos do formulário: Número do Pedido, Rota (Origem e Destino),
 * Valor do Frete, Outras Informações e Observações.
 */
export type CriarPedidoInput = Pick<Pedido, 'numero' | 'origem' | 'destino'> &
  Partial<Pick<Pedido, 'valorFrete' | 'outrasInformacoes' | 'observacoesGerais'>>;
