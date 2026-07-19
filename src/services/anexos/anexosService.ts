import type { Anexo } from '@/types';
import { API_BASE_URL } from '@/config/api';

const ENDPOINT = `${API_BASE_URL}/arquivos`;

async function tratarResposta<T>(resposta: Response, contexto: string): Promise<T> {
  if (!resposta.ok) {
    let detalhe = '';
    try {
      const corpo = await resposta.json();
      detalhe = corpo?.erro ? `: ${corpo.erro}` : '';
    } catch {
      // corpo não era JSON; ignora
    }
    throw new Error(`[anexosService] ${contexto} (HTTP ${resposta.status})${detalhe}`);
  }
  return resposta.json();
}

/**
 * Serviço de anexos: fala diretamente com as rotas de upload/download
 * do backend (`server/src/routes/arquivos.js`), que armazenam o
 * binário no MongoDB via GridFS. Não implementa `IStorageService`
 * porque upload de arquivo é `multipart/form-data`, não JSON — mas
 * segue o mesmo espírito de abstração (o restante do app só conhece
 * este serviço, nunca a URL/mecanismo de armazenamento por trás).
 */
export const anexosService = {
  async listarPorTarefa(tarefaId: string): Promise<Anexo[]> {
    const resposta = await fetch(`${ENDPOINT}?tarefaId=${encodeURIComponent(tarefaId)}`);
    return tratarResposta<Anexo[]>(resposta, 'Falha ao listar anexos');
  },

  /** Envia um ou mais arquivos de uma vez, já vinculados à tarefa. */
  async enviar(tarefaId: string, arquivos: File[], enviadoPor = 'sistema'): Promise<Anexo[]> {
    const formData = new FormData();
    formData.append('tarefaId', tarefaId);
    formData.append('enviadoPor', enviadoPor);
    arquivos.forEach((arquivo) => formData.append('arquivos', arquivo));

    const resposta = await fetch(ENDPOINT, { method: 'POST', body: formData });
    return tratarResposta<Anexo[]>(resposta, 'Falha ao enviar arquivo(s)');
  },

  async excluir(id: string): Promise<void> {
    const resposta = await fetch(`${ENDPOINT}/${id}`, { method: 'DELETE' });
    if (!resposta.ok && resposta.status !== 404) {
      throw new Error(`[anexosService] Falha ao excluir anexo (HTTP ${resposta.status})`);
    }
  },

  /** URL para pré-visualizar o arquivo no navegador (abrir em nova aba). */
  obterUrlVisualizacao(id: string): string {
    return `${ENDPOINT}/${id}/download?disposition=inline`;
  },

  /** URL que força o download do arquivo. */
  obterUrlDownload(id: string): string {
    return `${ENDPOINT}/${id}/download?disposition=attachment`;
  },
};
