/**
 * Item (passo) de uma Sessão. Representa uma etapa de trabalho a ser
 * concluída dentro da sessão (ex.: "Fazer Monitoramento", "Solicitar
 * Ordem de Carregamento"), com estado de conclusão próprio.
 */
export interface SessaoItem {
  id: string;
  descricao: string;
  concluido: boolean;
  concluidoEm?: string;
}

/**
 * Sessão: conjunto de passos de trabalho aberto sobre uma Tarefa,
 * tipicamente criado automaticamente ao final de um formulário de
 * etapa (ex.: ao concluir o formulário de "Prospecção de Motorista",
 * cria-se uma Sessão com os passos operacionais daquela etapa).
 *
 * Além dos passos (`itens`), mantém também os campos originais de
 * período de trabalho (`inicio`/`fim`/`duracaoMinutos`), permitindo
 * futuramente medir tempo de execução por etapa e por operador.
 *
 * O avanço da Tarefa para a próxima coluna NÃO acontece
 * automaticamente ao concluir os itens da sessão — é sempre disparado
 * explicitamente pelo botão "Próxima Etapa" do formulário da etapa
 * (via `avancarParaColuna`), para garantir um comportamento previsível
 * e visível ao usuário.
 */
export interface Sessao {
  id: string;
  tarefaId: string;
  /** Título descritivo da sessão (ex.: "Prospecção de Motorista — Terceiro"). */
  titulo: string;
  itens: SessaoItem[];
  usuario: string;
  inicio: string;
  fim?: string;
  duracaoMinutos?: number;
  observacao?: string;
}

/** Dados necessários para criar uma nova Sessão a partir de uma lista de passos. */
export interface CriarSessaoInput {
  tarefaId: string;
  titulo: string;
  itens: string[];
}
