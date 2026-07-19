import type { ComId, IStorageService } from './IStorageService';

/**
 * Implementação de `IStorageService` baseada em `localStorage`.
 *
 * Mantida deliberadamente "burra" (sem regra de negócio) para que a
 * troca futura por uma implementação que fale com um banco de dados
 * real (ex.: via fetch/REST ou um SDK) seja transparente para o
 * restante da aplicação — basta implementar a mesma interface.
 */
export class LocalStorageService<T extends ComId> implements IStorageService<T> {
  private readonly storageKey: string;

  constructor(storageKey: string) {
    this.storageKey = storageKey;
  }

  private ler(): T[] {
    try {
      const bruto = window.localStorage.getItem(this.storageKey);
      if (!bruto) return [];
      const dados = JSON.parse(bruto);
      return Array.isArray(dados) ? (dados as T[]) : [];
    } catch (erro) {
      console.error(`[LocalStorageService] Falha ao ler "${this.storageKey}":`, erro);
      return [];
    }
  }

  private escrever(items: T[]): void {
    try {
      window.localStorage.setItem(this.storageKey, JSON.stringify(items));
    } catch (erro) {
      console.error(`[LocalStorageService] Falha ao escrever "${this.storageKey}":`, erro);
    }
  }

  async getAll(): Promise<T[]> {
    return this.ler();
  }

  async getById(id: string): Promise<T | undefined> {
    return this.ler().find((item) => item.id === id);
  }

  async create(item: T): Promise<T> {
    const items = this.ler();
    items.push(item);
    this.escrever(items);
    return item;
  }

  async update(id: string, alteracoes: Partial<T>): Promise<T | undefined> {
    const items = this.ler();
    const indice = items.findIndex((item) => item.id === id);
    if (indice === -1) return undefined;

    const atualizado = { ...items[indice], ...alteracoes } as T;
    items[indice] = atualizado;
    this.escrever(items);
    return atualizado;
  }

  async remove(id: string): Promise<void> {
    const items = this.ler().filter((item) => item.id !== id);
    this.escrever(items);
  }

  async replaceAll(items: T[]): Promise<void> {
    this.escrever(items);
  }
}
