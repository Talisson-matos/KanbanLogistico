import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import type { StageFormProps } from './registry';
import { obterTipoMotorista } from './utils';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

type Situacao = 'concluido' | 'retificar';

interface DadosGuia {
  [chave: string]: unknown;
  situacao?: Situacao;
}

export function GuiaForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna, enviarParaRetificacao } = useKanban();

  const tipoMotorista = obterTipoMotorista(tarefa);
  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosGuia | undefined;

  const [situacao, setSituacao] = useState<Situacao | null>(dadosSalvos?.situacao ?? null);
  const [motivoRetificacao, setMotivoRetificacao] = useState('');
  const [enviando, setEnviando] = useState(false);

  async function aoConfirmarConcluido() {
    if (enviando) return;
    setEnviando(true);
    try {
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, { situacao: 'concluido' });

      if (tipoMotorista === 'terceiro') {
        await avancarParaColuna(tarefa.id, 'adiantamento', 'a-fazer');
      } else {
        await avancarParaColuna(tarefa.id, 'viagem', 'a-fazer');
      }

      onConcluir?.();
    } finally {
      setEnviando(false);
    }
  }

  async function aoConfirmarRetificacao() {
    if (!motivoRetificacao.trim() || enviando) return;
    setEnviando(true);
    try {
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, { situacao: 'retificar' });
      await enviarParaRetificacao(tarefa.id, 'carregamento-documentacao', motivoRetificacao.trim());
      onConcluir?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      <p className="prospeccao-form__success">Validação e Pagamento da Guia</p>

      <AnexosPanel tarefaId={tarefa.id} titulo="Duplicata (comprovante de pagamento da Guia)" />

      <div className="prospeccao-form__tipo">
        <span className="prospeccao-form__tipo-label">Situação da Guia *</span>
        <div className="prospeccao-form__tipo-botoes">
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${situacao === 'concluido' ? 'is-selected' : ''}`}
            onClick={() => setSituacao('concluido')}
          >
            Concluído
          </button>
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${situacao === 'retificar' ? 'is-selected' : ''}`}
            onClick={() => setSituacao('retificar')}
          >
            Retificar
          </button>
        </div>
      </div>

      {situacao === 'concluido' && (
        <div className="prospeccao-form__footer">
          <Button variante="primary" onClick={aoConfirmarConcluido} disabled={enviando}>
            {enviando
              ? 'Avançando...'
              : `Confirmar e avançar para "${tipoMotorista === 'terceiro' ? 'Adiantamento' : 'Viagem'}"`}
          </Button>
        </div>
      )}

      {situacao === 'retificar' && (
        <>
          <div className="form-field">
            <label htmlFor="guia-motivo-retificacao">Informe o motivo</label>
            <textarea
              id="guia-motivo-retificacao"
              value={motivoRetificacao}
              onChange={(e) => setMotivoRetificacao(e.target.value)}
              rows={4}
              autoFocus
            />
          </div>

          <div className="prospeccao-form__footer">
            <Button
              variante="danger"
              onClick={aoConfirmarRetificacao}
              disabled={!motivoRetificacao.trim() || enviando}
            >
              {enviando ? 'Enviando...' : 'Confirmar retificação'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
