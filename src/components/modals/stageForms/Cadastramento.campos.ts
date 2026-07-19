import type { CampoExibicao } from './registry';

/**
 * Metadados de exibição da etapa "Cadastramento". Todos os campos
 * são condicionais ao tipo de motorista definido na Prospecção — os
 * que não se aplicam simplesmente não existem em `dadosEtapa` e são
 * omitidos automaticamente pelo renderizador genérico do "Ver
 * Informações".
 */
export const CAMPOS_CADASTRAMENTO: CampoExibicao[] = [
  { chave: 'komandoCadastro', rotulo: 'Fazer Cadastro Komando', tipo: 'checkbox' },
  { chave: 'komandoAprovado', rotulo: 'Aprovado (Komando)', tipo: 'checkbox' },
  { chave: 'bounnyCadastro', rotulo: 'Fazer Cadastro Bounny', tipo: 'checkbox' },
  { chave: 'bounnyAprovado', rotulo: 'Aprovado (Bounny)', tipo: 'checkbox' },
  { chave: 'otnetCadastro', rotulo: 'Fazer Cadastro Otnet', tipo: 'checkbox' },
  { chave: 'otnetAprovado', rotulo: 'Aprovado (Otnet)', tipo: 'checkbox' },
  { chave: 'rodoparCadastro', rotulo: 'Fazer Cadastro Rodopar', tipo: 'checkbox' },
  {
    chave: 'placasValidadas',
    rotulo: 'Conjunto de placas validado para viagem',
    tipo: 'checkbox',
  },
  {
    chave: 'agendamentoDeCarregamentoSolicitado',
    rotulo: 'Agendamento de Carregamento (solicitado)',
    tipo: 'checkbox',
  },
];
