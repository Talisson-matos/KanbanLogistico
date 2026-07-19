import { useRef, useState, type DragEvent } from 'react';
import type { Anexo } from '@/types';
import { useAnexos } from '@/hooks/useAnexos';
import { anexosService } from '@/services/anexos/anexosService';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import './AnexosPanel.css';

interface AnexosPanelProps {
  tarefaId: string;
  /** Título da seção. Padrão: "Anexos". */
  titulo?: string;
}

function formatarTamanho(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

/** Rótulo curto do tipo de arquivo, derivado do MIME type ou da extensão. */
function rotuloTipo(anexo: Anexo): string {
  const mime = anexo.tipoMime || '';
  if (mime.startsWith('image/')) return 'IMG';
  if (mime === 'application/pdf') return 'PDF';
  if (mime.startsWith('text/')) return 'TXT';
  if (mime.includes('word')) return 'DOC';
  if (mime.includes('sheet') || mime.includes('excel')) return 'XLS';
  const extensao = anexo.nomeArquivo.split('.').pop();
  return extensao ? extensao.slice(0, 4).toUpperCase() : 'ARQ';
}

function baixarArquivo(url: string, nomeArquivo: string) {
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  link.rel = 'noopener';
  document.body.appendChild(link);
  link.click();
  link.remove();
}

export function AnexosPanel({ tarefaId, titulo = 'Anexos' }: AnexosPanelProps) {
  const { anexos, carregando, enviando, erro, enviarArquivos, excluirArquivo } =
    useAnexos(tarefaId);
  const inputRef = useRef<HTMLInputElement>(null);
  const [anexoParaExcluir, setAnexoParaExcluir] = useState<Anexo | null>(null);
  const [arrastando, setArrastando] = useState(false);

  function aoSelecionarArquivos(lista: FileList | null) {
    if (!lista || lista.length === 0) return;
    // Envia todos os arquivos selecionados de uma só vez, em uma
    // única requisição — não é preciso repetir o upload um por um.
    enviarArquivos(lista);
    if (inputRef.current) inputRef.current.value = '';
  }

  function aoSoltarArquivos(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    aoSelecionarArquivos(evento.dataTransfer.files);
  }

  async function aoConfirmarExclusao() {
    if (!anexoParaExcluir) return;
    await excluirArquivo(anexoParaExcluir.id);
    setAnexoParaExcluir(null);
  }

  return (
    <section className="anexos-panel">
      <h3 className="anexos-panel__heading">{titulo}</h3>

      <div
        className={`anexos-panel__dropzone ${arrastando ? 'is-over' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
          setArrastando(true);
        }}
        onDragLeave={() => setArrastando(false)}
        onDrop={aoSoltarArquivos}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          className="anexos-panel__input"
          onChange={(e) => aoSelecionarArquivos(e.target.files)}
          id={`anexos-input-${tarefaId}`}
        />
        <label htmlFor={`anexos-input-${tarefaId}`} className="anexos-panel__dropzone-label">
          <span className="anexos-panel__dropzone-title">
            {enviando ? 'Enviando arquivo(s)...' : 'Clique ou arraste arquivos aqui'}
          </span>
          <span className="anexos-panel__dropzone-hint">
            Qualquer tipo de arquivo — imagens, PDF, TXT, etc. Pode selecionar vários de uma vez.
          </span>
        </label>
      </div>

      {erro && <p className="anexos-panel__erro">{erro}</p>}

      {carregando ? (
        <p className="anexos-panel__vazio">Carregando anexos...</p>
      ) : anexos.length === 0 ? (
        <p className="anexos-panel__vazio">Nenhum arquivo anexado ainda.</p>
      ) : (
        <ul className="anexos-panel__lista">
          {anexos.map((anexo) => (
            <li key={anexo.id} className="anexos-panel__item">
              <span className="anexos-panel__tipo">{rotuloTipo(anexo)}</span>

              <div className="anexos-panel__info">
                <span className="anexos-panel__nome" title={anexo.nomeArquivo}>
                  {anexo.nomeArquivo}
                </span>
                <span className="anexos-panel__meta">
                  {formatarTamanho(anexo.tamanho)} · {formatarData(anexo.criadoEm)}
                </span>
              </div>

              <div className="anexos-panel__acoes">
                <button
                  type="button"
                  className="anexos-panel__acao"
                  onClick={() => window.open(anexosService.obterUrlVisualizacao(anexo.id), '_blank')}
                >
                  Ver Arquivo
                </button>
                <button
                  type="button"
                  className="anexos-panel__acao"
                  onClick={() =>
                    baixarArquivo(anexosService.obterUrlDownload(anexo.id), anexo.nomeArquivo)
                  }
                >
                  Baixar Arquivo
                </button>
                <button
                  type="button"
                  className="anexos-panel__acao anexos-panel__acao--danger"
                  onClick={() => setAnexoParaExcluir(anexo)}
                >
                  Excluir Arquivo
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmActionModal
        titulo="Excluir arquivo"
        mensagem={`Tem certeza que deseja excluir o arquivo "${anexoParaExcluir?.nomeArquivo ?? ''}"?`}
        textoConfirmar="Excluir arquivo"
        aberto={anexoParaExcluir !== null}
        onCancelar={() => setAnexoParaExcluir(null)}
        onConfirmar={aoConfirmarExclusao}
      />
    </section>
  );
}
