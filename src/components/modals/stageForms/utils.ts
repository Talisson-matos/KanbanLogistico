import type { Tarefa } from '@/types';

export type TipoMotorista = 'frota' | 'terceiro';

/**
 * Lê o tipo de motorista (Frota/Terceiro) definido no formulário de
 * "Prospecção de Motorista", consultado por diversas etapas
 * seguintes para decidir quais campos renderizar.
 */
export function obterTipoMotorista(tarefa: Tarefa): TipoMotorista | undefined {
  const dados = tarefa.dadosEtapa?.['prospeccao-motorista'] as
    | { tipoMotorista?: TipoMotorista }
    | undefined;
  return dados?.tipoMotorista;
}

/**
 * Verifica se um item foi marcado (solicitado) no checklist de
 * seleção da "Prospecção de Motorista" (`itensSolicitados`). Esses
 * itens não viram mais uma Sessão automática — servem apenas para
 * decidir, nas etapas seguintes, quais campos/anexos devem ser
 * pedidos novamente (ex.: "Ordem de Carregamento" em "Agendamento").
 */
export function foiSolicitadoNaProspeccao(tarefa: Tarefa, descricao: string): boolean {
  const dados = tarefa.dadosEtapa?.['prospeccao-motorista'] as
    | { itensSolicitados?: string[] }
    | undefined;
  return dados?.itensSolicitados?.includes(descricao) ?? false;
}

/**
 * Verifica se o passo "Fazer Monitoramento" foi selecionado no
 * checklist da "Prospecção de Motorista", usado pela etapa
 * "Carregamento/Documentação" para decidir se exibe o campo
 * novamente como reconfirmação.
 */
export function possuiMonitoramentoAtivo(tarefa: Tarefa): boolean {
  return foiSolicitadoNaProspeccao(tarefa, 'Fazer Monitoramento');
}
