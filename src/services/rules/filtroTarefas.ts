import type { Pedido, Tarefa } from '@/types';

/**
 * Critérios de filtro de uma coluna. Todos os campos são opcionais —
 * quando ausentes, não restringem a busca.
 */
export interface FiltroColuna {
  numeroPedido?: string;
  criadoPor?: string;
  motorista?: string;
  rota?: string;
}

export function filtroVazio(filtro: FiltroColuna | null | undefined): boolean {
  if (!filtro) return true;
  return !filtro.numeroPedido && !filtro.criadoPor && !filtro.motorista && !filtro.rota;
}

/**
 * Nome do motorista mais atual para a tarefa: prioriza o valor
 * preenchido no formulário de "Prospecção de Motorista" (a fonte mais
 * confiável, já que é definido durante o processo) e cai para
 * `pedido.motorista` (preenchido opcionalmente na criação do pedido)
 * quando a etapa ainda não foi concluída.
 */
export function obterMotoristaDaTarefa(tarefa: Tarefa, pedido: Pedido | undefined): string | undefined {
  const dadosProspeccao = tarefa.dadosEtapa?.['prospeccao-motorista'] as
    | { nomeMotorista?: string }
    | undefined;
  return dadosProspeccao?.nomeMotorista || pedido?.motorista || undefined;
}

export function obterRotaDaTarefa(pedido: Pedido | undefined): string | undefined {
  if (!pedido) return undefined;
  return `${pedido.origem} → ${pedido.destino}`;
}

export function tarefaCorrespondeAoFiltro(
  tarefa: Tarefa,
  filtro: FiltroColuna,
  pedido: Pedido | undefined,
): boolean {
  if (filtro.numeroPedido && pedido?.numero !== filtro.numeroPedido) return false;
  if (filtro.criadoPor && tarefa.criadoPor !== filtro.criadoPor) return false;
  if (filtro.motorista && obterMotoristaDaTarefa(tarefa, pedido) !== filtro.motorista) return false;
  if (filtro.rota && obterRotaDaTarefa(pedido) !== filtro.rota) return false;
  return true;
}
