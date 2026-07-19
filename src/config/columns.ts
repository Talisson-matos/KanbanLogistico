import type { ColumnId } from '@/types';

/**
 * Configuração estática das 10 colunas do Kanban logístico.
 * Centralizar aqui permite reordenar, renomear ou (futuramente)
 * habilitar/desabilitar colunas sem tocar nos componentes.
 */
export interface ColumnConfig {
  id: ColumnId;
  titulo: string;
  ordem: number;
  /** Curta descrição da etapa, usada em tooltips/Ver Informações. */
  descricao: string;
}

export const COLUNAS: ColumnConfig[] = [
  {
    id: 'prospeccao-motorista',
    titulo: 'Prospecção de Motorista',
    ordem: 1,
    descricao: 'Busca e seleção do motorista responsável pelo frete.',
  },
  {
    id: 'cadastramento',
    titulo: 'Cadastramento',
    ordem: 2,
    descricao: 'Cadastro de motorista, veículo e documentação na base.',
  },
  {
    id: 'agendamento',
    titulo: 'Agendamento',
    ordem: 3,
    descricao: 'Agendamento de carregamento/descarga junto ao cliente.',
  },
  {
    id: 'carregamento-documentacao',
    titulo: 'Carregamento/Documentação',
    ordem: 4,
    descricao: 'Execução do carregamento e emissão da documentação.',
  },
  {
    id: 'guia',
    titulo: 'Guia',
    ordem: 5,
    descricao: 'Emissão e conferência da guia de transporte.',
  },
  {
    id: 'adiantamento',
    titulo: 'Adiantamento',
    ordem: 6,
    descricao: 'Liberação do adiantamento financeiro ao motorista.',
  },
  {
    id: 'viagem',
    titulo: 'Viagem',
    ordem: 7,
    descricao: 'Acompanhamento da viagem em curso.',
  },
  {
    id: 'descarga',
    titulo: 'Descarga',
    ordem: 8,
    descricao: 'Confirmação da descarga no destino.',
  },
  {
    id: 'saldo',
    titulo: 'Saldo',
    ordem: 9,
    descricao: 'Apuração e pagamento do saldo do frete.',
  },
  {
    id: 'historico-finalizacao',
    titulo: 'Histórico/Finalização',
    ordem: 10,
    descricao: 'Encerramento e arquivamento do pedido.',
  },
];

export const PRIMEIRA_COLUNA: ColumnId = COLUNAS[0].id;

/**
 * Colunas em que uma tarefa parada por mais de `LIMITE_ATRASO_MS` na
 * subcoluna atual recebe destaque visual vermelho de atraso.
 */
export const COLUNAS_COM_PRAZO_DE_ATRASO = new Set<ColumnId>([
  'cadastramento',
  'carregamento-documentacao',
  'guia',
  'adiantamento',
  'saldo',
]);

/** Limite, em milissegundos, a partir do qual uma tarefa é considerada atrasada. */
export const LIMITE_ATRASO_MS = 60 * 60 * 1000;
