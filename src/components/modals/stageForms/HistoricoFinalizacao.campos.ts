import type { CampoExibicao } from './registry';

function formatarData(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return String(valor ?? '');
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export const CAMPOS_HISTORICO_FINALIZACAO: CampoExibicao[] = [
  { chave: 'finalizadoEm', rotulo: 'Finalizado em', tipo: 'texto', formatar: formatarData },
];
