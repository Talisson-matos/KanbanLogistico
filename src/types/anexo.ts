/**
 * Anexo: arquivo (imagem, PDF, texto, etc.) enviado e vinculado a uma
 * Tarefa. O conteúdo binário é armazenado no MongoDB via GridFS, no
 * backend; este tipo representa apenas os metadados manipulados pelo
 * frontend.
 */
export interface Anexo {
  id: string;
  tarefaId: string;
  nomeArquivo: string;
  tipoMime: string;
  /** Tamanho em bytes. */
  tamanho: number;
  criadoEm: string;
  enviadoPor?: string;
}
