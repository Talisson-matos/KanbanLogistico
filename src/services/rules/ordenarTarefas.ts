import type { Tarefa } from '@/types';

/**
 * Ordena as tarefas de uma mesma subcoluna por prioridade de
 * atendimento:
 *
 * 1. Tarefas marcadas como urgentes (bandeirinha) vêm sempre primeiro.
 * 2. Dentro de cada grupo (urgentes / não urgentes), a tarefa há mais
 *    tempo parada na subcoluna atual (`subColunaDesde` mais antigo)
 *    vem primeiro — inclusive entre urgentes, quando há mais de uma.
 * 3. As demais seguem depois, na mesma regra de tempo.
 */
export function ordenarPorPrioridade(tarefas: Tarefa[]): Tarefa[] {
  return [...tarefas].sort((a, b) => {
    const aUrgente = Boolean(a.urgente);
    const bUrgente = Boolean(b.urgente);
    if (aUrgente !== bUrgente) return aUrgente ? -1 : 1;

    const tempoA = new Date(a.subColunaDesde).getTime();
    const tempoB = new Date(b.subColunaDesde).getTime();
    return tempoA - tempoB;
  });
}
