import type { CampoExibicao } from './registry';

function formatarDataHora(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return String(valor ?? '');
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export const CAMPOS_VIAGEM: CampoExibicao[] = [
  { chave: 'agendamentoDescarga', rotulo: 'Agendamento de Descarga', tipo: 'checkbox' },
  { chave: 'dataHora', rotulo: 'Data/Hora', tipo: 'texto', formatar: formatarDataHora },
  { chave: 'local', rotulo: 'Local', tipo: 'texto' },
];
