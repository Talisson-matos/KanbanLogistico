import type { ComId, IStorageService } from './IStorageService';
import { API_BASE_URL } from '@/config/api';

/**
 * Implementação de `IStorageService` que conversa com a API REST do
 * backend (Express + MongoDB) em vez do `localStorage`.
 *
 * Mantida deliberadamente "burra" (sem regra de negócio), espelhando
 * exatamente os mesmos métodos de `LocalStorageService` — o restante
 * da aplicação (Context, componentes) não precisa saber qual das duas
 * implementações está em uso.
 */
export class ApiStorageService<T extends ComId> implements IStorageService<T> {
  private readonly endpoint: string;

  constructor(nomeColecao: string) {
    this.endpoint = `${API_BASE_URL}/${nomeColecao}`;
  }

  private async tratarResposta<R>(resposta: Response, contexto: string): Promise<R> {
    if (!resposta.ok) {
      let detalhe = '';
      try {
        const corpo = await resposta.json();
        detalhe = corpo?.erro ? `: ${corpo.erro}` : '';
      } catch {
        // corpo não era JSON; ignora
      }
      throw new Error(`[ApiStorageService] ${contexto} (HTTP ${resposta.status})${detalhe}`);
    }
    return resposta.json();
  }

  async getAll(): Promise<T[]> {
    const resposta = await fetch(this.endpoint);
    return this.tratarResposta<T[]>(resposta, `Falha ao listar "${this.endpoint}"`);
  }

  async getById(id: string): Promise<T | undefined> {
    const resposta = await fetch(`${this.endpoint}/${id}`);
    if (resposta.status === 404) return undefined;
    return this.tratarResposta<T>(resposta, `Falha ao buscar "${this.endpoint}/${id}"`);
  }

  async create(item: T): Promise<T> {
    const resposta = await fetch(this.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return this.tratarResposta<T>(resposta, `Falha ao criar em "${this.endpoint}"`);
  }

  async update(id: string, alteracoes: Partial<T>): Promise<T | undefined> {
    // Campos com valor `undefined` (ex.: `retificacao: undefined` ao
    // concluir uma retificação, `fazendoPor: undefined` ao avançar de
    // coluna) seriam descartados pelo `JSON.stringify` — a chave nem
    // chegaria ao backend, que nunca removeria o valor antigo no
    // MongoDB. Por isso são convertidos para `null` aqui, que o
    // backend (`genericCrudRouter.js`) interpreta como pedido
    // explícito de remoção do campo (`$unset`).
    const alteracoesSerializaveis: Record<string, unknown> = { ...alteracoes };
    for (const chave of Object.keys(alteracoesSerializaveis)) {
      if (alteracoesSerializaveis[chave] === undefined) {
        alteracoesSerializaveis[chave] = null;
      }
    }

    const resposta = await fetch(`${this.endpoint}/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(alteracoesSerializaveis),
    });
    if (resposta.status === 404) return undefined;
    return this.tratarResposta<T>(resposta, `Falha ao atualizar "${this.endpoint}/${id}"`);
  }

  async remove(id: string): Promise<void> {
    const resposta = await fetch(`${this.endpoint}/${id}`, { method: 'DELETE' });
    if (!resposta.ok && resposta.status !== 404) {
      throw new Error(
        `[ApiStorageService] Falha ao remover "${this.endpoint}/${id}" (HTTP ${resposta.status})`,
      );
    }
  }

  async replaceAll(items: T[]): Promise<void> {
    const resposta = await fetch(this.endpoint, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(items),
    });
    if (!resposta.ok) {
      throw new Error(
        `[ApiStorageService] Falha ao substituir itens em "${this.endpoint}" (HTTP ${resposta.status})`,
      );
    }
  }
}
