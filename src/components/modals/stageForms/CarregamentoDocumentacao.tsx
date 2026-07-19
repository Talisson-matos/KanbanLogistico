import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import type { StageFormProps } from './registry';
import { obterTipoMotorista, possuiMonitoramentoAtivo } from './utils';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosCarregamentoDocumentacao {
  [chave: string]: unknown;
  fazerCte?: boolean;
  fazerMdfe?: boolean;
  fazerContrato?: boolean;
  fazerMonitoramento?: boolean;
  numeroMonitoramento?: string;
  haveraGuiaIcms?: boolean;
}

export function CarregamentoDocumentacaoForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const tipoMotorista = obterTipoMotorista(tarefa);
  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as
    | DadosCarregamentoDocumentacao
    | undefined;

  const monitoramentoAtivo = possuiMonitoramentoAtivo(tarefa);

  const [fazerCte, setFazerCte] = useState(dadosSalvos?.fazerCte ?? false);
  const [fazerMdfe, setFazerMdfe] = useState(dadosSalvos?.fazerMdfe ?? false);
  const [fazerContrato, setFazerContrato] = useState(dadosSalvos?.fazerContrato ?? false);
  const [fazerMonitoramento, setFazerMonitoramento] = useState(
    dadosSalvos?.fazerMonitoramento ?? false,
  );
  const [numeroMonitoramento, setNumeroMonitoramento] = useState(
    dadosSalvos?.numeroMonitoramento ?? '',
  );
  const [haveraGuiaIcms, setHaveraGuiaIcms] = useState<boolean | null>(
    dadosSalvos?.haveraGuiaIcms ?? null,
  );
  const [enviando, setEnviando] = useState(false);

  // Enquanto o Monitoramento estiver validado, o número passa a ser
  // obrigatório para poder avançar.
  const numeroMonitoramentoPendente =
    monitoramentoAtivo && fazerMonitoramento && numeroMonitoramento.trim() === '';

  const podeAvancar = haveraGuiaIcms !== null && !numeroMonitoramentoPendente;

  async function aoAvancar() {
    if (!podeAvancar || enviando || haveraGuiaIcms === null) return;
    setEnviando(true);

    try {
      const dadosEtapa: DadosCarregamentoDocumentacao = {
        fazerCte,
        fazerMdfe,
        ...(tipoMotorista === 'terceiro' ? { fazerContrato } : {}),
        ...(monitoramentoAtivo
          ? { fazerMonitoramento, numeroMonitoramento: numeroMonitoramento.trim() }
          : {}),
        haveraGuiaIcms,
      };

      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, dadosEtapa);

      // Qualquer sinalizador "A Retificar" é limpo automaticamente por
      // `avancarParaColuna` a seguir, independente da coluna de destino.
      if (haveraGuiaIcms) {
        await avancarParaColuna(tarefa.id, 'guia', 'a-fazer');
      } else if (tipoMotorista === 'terceiro') {
        await avancarParaColuna(tarefa.id, 'adiantamento', 'a-fazer');
      } else {
        await avancarParaColuna(tarefa.id, 'viagem', 'a-fazer');
      }

      onConcluir?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      {tarefa.retificacao && (
        <p className="prospeccao-form__nota prospeccao-form__nota--erro">
          Esta tarefa retornou para retificação: {tarefa.retificacao.motivo}
        </p>
      )}

      <div className="status-check-list">
        <StatusCheckField label="Fazer CTe" checked={fazerCte} onChange={setFazerCte} />
        <StatusCheckField label="Fazer MDFe" checked={fazerMdfe} onChange={setFazerMdfe} />

        {tipoMotorista === 'terceiro' && (
          <StatusCheckField
            label="Fazer Contrato"
            checked={fazerContrato}
            onChange={setFazerContrato}
          />
        )}

        {monitoramentoAtivo && (
          <StatusCheckField
            label="Fazer Monitoramento"
            checked={fazerMonitoramento}
            onChange={setFazerMonitoramento}
          />
        )}
      </div>

      {monitoramentoAtivo && fazerMonitoramento && (
        <div className="form-field">
          <label htmlFor="carregamento-numero-monitoramento">Número do Monitoramento *</label>
          <input
            id="carregamento-numero-monitoramento"
            type="text"
            value={numeroMonitoramento}
            onChange={(e) => setNumeroMonitoramento(e.target.value)}
            placeholder="Informe o número do monitoramento"
          />
        </div>
      )}

      <AnexosPanel tarefaId={tarefa.id} titulo="Documentos" />

      <div className="prospeccao-form__tipo">
        <span className="prospeccao-form__tipo-label">Haverá Guia de ICMS? *</span>
        <div className="prospeccao-form__tipo-botoes">
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${haveraGuiaIcms === true ? 'is-selected' : ''}`}
            onClick={() => setHaveraGuiaIcms(true)}
          >
            Sim
          </button>
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${haveraGuiaIcms === false ? 'is-selected' : ''}`}
            onClick={() => setHaveraGuiaIcms(false)}
          >
            Não
          </button>
        </div>
      </div>

      {haveraGuiaIcms === true && (
        <AnexosPanel tarefaId={tarefa.id} titulo="Guia de ICMS (anexar junto aos documentos)" />
      )}

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!podeAvancar || enviando}>
          {enviando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
