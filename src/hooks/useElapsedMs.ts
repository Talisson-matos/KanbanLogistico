import { useEffect, useState } from 'react';

/** Recalcula a cada 30s — suficiente para um cronômetro em minutos/horas. */
const INTERVALO_ATUALIZACAO_MS = 30000;

/**
 * Retorna, de forma reativa, o tempo decorrido desde `desde` (ISO) em
 * milissegundos, atualizando sozinho a cada 30 segundos — usado para
 * exibir "há quanto tempo" uma tarefa está em sua subcoluna atual e
 * para decidir o destaque visual de atraso.
 */
export function useElapsedMs(desde: string | undefined): number {
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!desde) return;
    const intervalo = window.setInterval(() => setAgora(Date.now()), INTERVALO_ATUALIZACAO_MS);
    return () => window.clearInterval(intervalo);
  }, [desde]);

  if (!desde) return 0;
  const inicio = new Date(desde).getTime();
  if (Number.isNaN(inicio)) return 0;
  return Math.max(0, agora - inicio);
}

/** Formata uma duração em milissegundos como "12min", "1h 05min" ou "2d 03h". */
export function formatarDuracao(ms: number): string {
  const minutosTotais = Math.floor(ms / 60000);
  if (minutosTotais < 1) return 'agora mesmo';

  const dias = Math.floor(minutosTotais / (60 * 24));
  const horas = Math.floor((minutosTotais % (60 * 24)) / 60);
  const minutos = minutosTotais % 60;

  if (dias > 0) return `${dias}d ${String(horas).padStart(2, '0')}h`;
  if (horas > 0) return `${horas}h ${String(minutos).padStart(2, '0')}min`;
  return `${minutos}min`;
}
