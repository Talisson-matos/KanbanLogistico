import type { CampoExibicao } from './registry';

function formatarDataHora(valor: unknown): string {
  if (typeof valor !== 'string' || !valor) return String(valor ?? '');
  const data = new Date(valor);
  if (Number.isNaN(data.getTime())) return valor;
  return data.toLocaleString('pt-BR');
}

export const CAMPOS_AGENDAMENTO: CampoExibicao[] = [
  { chave: 'agendamentoCarregamento', rotulo: 'Agendamento de Carregamento', tipo: 'checkbox' },
  { chave: 'dataHora', rotulo: 'Data/Hora', tipo: 'texto', formatar: formatarDataHora },
  { chave: 'local', rotulo: 'Local', tipo: 'texto' },
  { chave: 'ordemDeCarregamento', rotulo: 'Ordem de Carregamento', tipo: 'checkbox' },
];
