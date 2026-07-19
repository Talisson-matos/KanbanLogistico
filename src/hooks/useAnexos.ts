import { useCallback, useEffect, useState } from 'react';
import type { Anexo } from '@/types';
import { anexosService } from '@/services/anexos/anexosService';
import { notificar } from '@/services/notifications';

export function useAnexos(tarefaId: string) {
  const [anexos, setAnexos] = useState<Anexo[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await anexosService.listarPorTarefa(tarefaId);
      setAnexos(lista);
    } catch (e) {
      console.error('[useAnexos] Falha ao carregar anexos:', e);
      setErro('Não foi possível carregar os anexos.');
    } finally {
      setCarregando(false);
    }
  }, [tarefaId]);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  const enviarArquivos = useCallback(
    async (arquivos: FileList | File[]) => {
      const lista = Array.from(arquivos);
      if (lista.length === 0) return;

      setEnviando(true);
      try {
        const novos = await anexosService.enviar(tarefaId, lista);
        setAnexos((atual) => [...atual, ...novos]);
        notificar(
          lista.length === 1
            ? 'Arquivo anexado com sucesso!'
            : `${lista.length} arquivos anexados com sucesso!`,
          'sucesso',
        );
      } catch (e) {
        console.error('[useAnexos] Falha ao enviar arquivos:', e);
        notificar('Falha ao enviar arquivo(s). Verifique a conexão com o servidor.', 'erro');
      } finally {
        setEnviando(false);
      }
    },
    [tarefaId],
  );

  const excluirArquivo = useCallback(async (id: string) => {
    try {
      await anexosService.excluir(id);
      setAnexos((atual) => atual.filter((anexo) => anexo.id !== id));
      notificar('Arquivo excluído.', 'info');
    } catch (e) {
      console.error('[useAnexos] Falha ao excluir arquivo:', e);
      notificar('Falha ao excluir o arquivo.', 'erro');
    }
  }, []);

  return { anexos, carregando, enviando, erro, enviarArquivos, excluirArquivo, recarregar };
}
