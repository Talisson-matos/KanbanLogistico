import type { ComponentType } from 'react';
import type { ColumnId, Tarefa } from '@/types';
import { ProspeccaoMotoristaForm } from './ProspeccaoMotorista';
import { CAMPOS_PROSPECCAO_MOTORISTA } from './ProspeccaoMotorista.campos';
import { CadastramentoForm } from './Cadastramento';
import { CAMPOS_CADASTRAMENTO } from './Cadastramento.campos';
import { AgendamentoForm } from './Agendamento';
import { CAMPOS_AGENDAMENTO } from './Agendamento.campos';
import { CarregamentoDocumentacaoForm } from './CarregamentoDocumentacao';
import { CAMPOS_CARREGAMENTO_DOCUMENTACAO } from './CarregamentoDocumentacao.campos';
import { GuiaForm } from './Guia';
import { CAMPOS_GUIA } from './Guia.campos';
import { AdiantamentoForm } from './Adiantamento';
import { CAMPOS_ADIANTAMENTO } from './Adiantamento.campos';
import { ViagemForm } from './Viagem';
import { CAMPOS_VIAGEM } from './Viagem.campos';
import { DescargaForm } from './Descarga';
import { CAMPOS_DESCARGA } from './Descarga.campos';
import { SaldoForm } from './Saldo';
import { CAMPOS_SALDO } from './Saldo.campos';
import { HistoricoFinalizacaoForm } from './HistoricoFinalizacao';
import { CAMPOS_HISTORICO_FINALIZACAO } from './HistoricoFinalizacao.campos';

/**
 * Contrato que todo formulário específico de etapa deverá seguir.
 * Cada formulário recebe a Tarefa em edição e expõe seus próprios
 * campos, persistindo o resultado em `tarefa.dadosEtapa[coluna]`
 * através de `atualizarDadosEtapa` (disponível via `useKanban()`).
 */
export interface StageFormProps {
  tarefa: Tarefa;
  onConcluir?: () => void;
}

/**
 * Registro de formulários por coluna.
 *
 * >>> PONTO DE EXTENSÃO PARA AS PRÓXIMAS PARTES <<<
 * Cada próxima parte do projeto deve apenas:
 *   1. Criar o componente do formulário em `stageForms/<NomeDaEtapa>.tsx`;
 *   2. Criar o arquivo de metadados de exibição em
 *      `stageForms/<NomeDaEtapa>.campos.ts` (ver `CampoExibicao` abaixo);
 *   3. Importar e associar ambos aqui, à coluna correspondente.
 *
 * Nenhuma alteração em `OpenTaskModal`, `TaskInfoModal`, `TaskCard`,
 * `Board` ou no `KanbanContext` é necessária: o modal "Abrir Tarefa"
 * passará a renderizar o formulário automaticamente, e o modal "Ver
 * Informações" passará a exibir os dados preenchidos automaticamente,
 * assim que ambos existirem.
 */
export const STAGE_FORM_REGISTRY: Partial<Record<ColumnId, ComponentType<StageFormProps>>> = {
  'prospeccao-motorista': ProspeccaoMotoristaForm,
  cadastramento: CadastramentoForm,
  agendamento: AgendamentoForm,
  'carregamento-documentacao': CarregamentoDocumentacaoForm,
  guia: GuiaForm,
  adiantamento: AdiantamentoForm,
  viagem: ViagemForm,
  descarga: DescargaForm,
  saldo: SaldoForm,
  'historico-finalizacao': HistoricoFinalizacaoForm,
};

/**
 * Tipos de campo suportados na exibição genérica de "Dados da Etapa"
 * dentro do modal "Ver Informações".
 *
 * - 'texto'    → renderizado como "Rótulo: valor"
 * - 'checkbox' → renderizado como "Sim: Rótulo" (marcado) ou
 *                "Não: Rótulo" (não marcado), conforme regra do projeto
 * - 'nota'     → texto fixo/informativo renderizado literalmente,
 *                sem rótulo + valor (ex.: observações automáticas
 *                geradas pelo próprio formulário da etapa)
 */
export type CampoTipo = 'texto' | 'checkbox' | 'nota';

export interface CampoExibicao {
  /** Chave correspondente em `tarefa.dadosEtapa[coluna]`. Ignorada quando `tipo` é 'nota'. */
  chave: string;
  /** Rótulo exibido para o campo. Para 'nota', é o próprio texto exibido. */
  rotulo: string;
  tipo: CampoTipo;
  /** Formatador opcional aplicado ao valor antes de exibir (ex.: moeda, data). */
  formatar?: (valor: unknown) => string;
}

/**
 * Registro de metadados de exibição por coluna, consultado pelo modal
 * "Ver Informações" para renderizar `tarefa.dadosEtapa[coluna]` de
 * forma legível e consistente com as regras do projeto (checkboxes
 * como "Sim/Não: Rótulo", demais campos como "Rótulo: valor").
 */
export const STAGE_FIELDS_REGISTRY: Partial<Record<ColumnId, CampoExibicao[]>> = {
  'prospeccao-motorista': CAMPOS_PROSPECCAO_MOTORISTA,
  cadastramento: CAMPOS_CADASTRAMENTO,
  agendamento: CAMPOS_AGENDAMENTO,
  'carregamento-documentacao': CAMPOS_CARREGAMENTO_DOCUMENTACAO,
  guia: CAMPOS_GUIA,
  adiantamento: CAMPOS_ADIANTAMENTO,
  viagem: CAMPOS_VIAGEM,
  descarga: CAMPOS_DESCARGA,
  saldo: CAMPOS_SALDO,
  'historico-finalizacao': CAMPOS_HISTORICO_FINALIZACAO,
};
