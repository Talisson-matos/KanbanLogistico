import type {
  Pedido,
  Tarefa,
  Pendencia,
  Checklist,
  Sessao,
  HistoricoEntry,
  Observacao,
} from '@/types';
import { ApiStorageService } from './ApiStorageService';

/**
 * Nomes das coleções no MongoDB (o backend expõe uma rota REST
 * genérica por coleção — ver `server/src/genericCrudRouter.js`).
 */
const COLECOES = {
  pedidos: 'pedidos',
  tarefas: 'tarefas',
  pendencias: 'pendencias',
  checklists: 'checklists',
  sessoes: 'sessoes',
  historico: 'historico',
  observacoes: 'observacoes',
} as const;

/**
 * Instâncias únicas (singletons) de armazenamento, uma por entidade.
 *
 * >>> PONTO ÚNICO DE TROCA DE PERSISTÊNCIA <<<
 * Antes, estas instâncias usavam `LocalStorageService` (localStorage
 * do navegador). Agora usam `ApiStorageService`, que fala com a API
 * REST do backend (Express + MongoDB) definida em `server/`. Nenhum
 * outro arquivo do frontend precisou ser alterado para essa troca —
 * `KanbanContext`, componentes e formulários continuam consumindo
 * apenas a interface `IStorageService<T>`.
 *
 * Caso seja necessário voltar a usar localStorage (ex.: modo offline),
 * basta trocar `ApiStorageService` por `LocalStorageService` aqui.
 */
export const pedidosStorage = new ApiStorageService<Pedido>(COLECOES.pedidos);
export const tarefasStorage = new ApiStorageService<Tarefa>(COLECOES.tarefas);
export const pendenciasStorage = new ApiStorageService<Pendencia>(COLECOES.pendencias);
export const checklistsStorage = new ApiStorageService<Checklist>(COLECOES.checklists);
export const sessoesStorage = new ApiStorageService<Sessao>(COLECOES.sessoes);
export const historicoStorage = new ApiStorageService<HistoricoEntry>(COLECOES.historico);
export const observacoesStorage = new ApiStorageService<Observacao>(COLECOES.observacoes);

export * from './IStorageService';
export { LocalStorageService } from './LocalStorageService';
export { ApiStorageService } from './ApiStorageService';
