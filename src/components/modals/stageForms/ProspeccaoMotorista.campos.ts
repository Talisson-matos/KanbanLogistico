import type { CampoExibicao } from './registry';

function formatarMoeda(valor: unknown): string {
  const numero = typeof valor === 'number' ? valor : Number(valor);
  if (Number.isNaN(numero)) return String(valor ?? '');
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatarTipoMotorista(valor: unknown): string {
  if (valor === 'frota') return 'Frota';
  if (valor === 'terceiro') return 'Terceiro';
  return String(valor ?? '');
}

function formatarLista(valor: unknown): string {
  return Array.isArray(valor) ? valor.join(', ') : String(valor ?? '');
}

/**
 * Metadados de exibição dos dados preenchidos no formulário
 * "Prospecção de Motorista", usados pelo modal "Ver Informações"
 * para renderizar `tarefa.dadosEtapa` de forma legível.
 *
 * Campos ausentes em `dadosEtapa` (ex.: "Valor de Frete Acordado" e
 * "Avaliação Toxicológica" quando o motorista é da Frota) são
 * automaticamente omitidos pelo renderizador genérico.
 */
export const CAMPOS_PROSPECCAO_MOTORISTA: CampoExibicao[] = [
  { chave: 'tipoMotorista', rotulo: 'Tipo de Motorista', tipo: 'texto', formatar: formatarTipoMotorista },
  { chave: 'nomeMotorista', rotulo: 'Nome do Motorista', tipo: 'texto' },
  { chave: 'conjuntoPlacas', rotulo: 'Conjunto de Placas', tipo: 'texto' },
  {
    chave: 'valorFreteAcordado',
    rotulo: 'Valor de Frete Acordado',
    tipo: 'texto',
    formatar: formatarMoeda,
  },
  { chave: 'avaliacaoToxicologica', rotulo: 'Avaliação Toxicológico', tipo: 'checkbox' },
  { chave: 'earNaCarteira', rotulo: 'EAR na Carteira', tipo: 'checkbox' },
  {
    chave: 'itensSolicitados',
    rotulo: 'Itens Solicitados para Próximas Etapas',
    tipo: 'texto',
    formatar: formatarLista,
  },
];
