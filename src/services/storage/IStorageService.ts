/**
 * Contrato genérico de persistência.
 *
 * Toda a aplicação acessa dados através desta interface, nunca
 * diretamente via `localStorage`. Isso permite que, no futuro,
 * `LocalStorageService` seja substituído por uma implementação que
 * conversa com uma API/banco de dados real (ex.: `ApiStorageService`)
 * sem que nenhum componente, contexto ou hook precise ser alterado —
 * basta trocar a instância exportada em `services/storage/index.ts`.
 */
export interface ComId {
  id: string;
}

export interface IStorageService<T extends ComId> {
  /** Retorna todos os registros. */
  getAll(): Promise<T[]>;
  /** Retorna um registro pelo id, ou undefined se não existir. */
  getById(id: string): Promise<T | undefined>;
  /** Cria um novo registro. */
  create(item: T): Promise<T>;
  /** Atualiza parcialmente um registro existente pelo id. */
  update(id: string, alteracoes: Partial<T>): Promise<T | undefined>;
  /** Remove um registro pelo id. */
  remove(id: string): Promise<void>;
  /** Substitui toda a coleção (útil para sincronizações/migrações). */
  replaceAll(items: T[]): Promise<void>;
}
