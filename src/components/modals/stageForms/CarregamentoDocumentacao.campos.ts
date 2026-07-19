import type { CampoExibicao } from './registry';

function formatarSimNao(valor: unknown): string {
  return valor === true ? 'Sim' : valor === false ? 'Não' : String(valor ?? '');
}

export const CAMPOS_CARREGAMENTO_DOCUMENTACAO: CampoExibicao[] = [
  { chave: 'fazerCte', rotulo: 'Fazer CTe', tipo: 'checkbox' },
  { chave: 'fazerMdfe', rotulo: 'Fazer MDFe', tipo: 'checkbox' },
  { chave: 'fazerContrato', rotulo: 'Fazer Contrato', tipo: 'checkbox' },
  { chave: 'fazerMonitoramento', rotulo: 'Fazer Monitoramento', tipo: 'checkbox' },
  { chave: 'numeroMonitoramento', rotulo: 'Número do Monitoramento', tipo: 'texto' },
  {
    chave: 'haveraGuiaIcms',
    rotulo: 'Haverá Guia de ICMS?',
    tipo: 'texto',
    formatar: formatarSimNao,
  },
];
