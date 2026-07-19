import type { CampoExibicao } from './registry';

function formatarSituacao(valor: unknown): string {
  if (valor === 'concluido') return 'Concluído';
  if (valor === 'retificar') return 'Retificado';
  return String(valor ?? '');
}

export const CAMPOS_GUIA: CampoExibicao[] = [
  { chave: 'situacao', rotulo: 'Situação da Guia', tipo: 'texto', formatar: formatarSituacao },
];
