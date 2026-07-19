import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import type { StageFormProps } from './registry';
import { foiSolicitadoNaProspeccao } from './utils';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosAgendamento {
  [chave: string]: unknown;
  agendamentoCarregamento?: boolean;
  dataHora?: string;
  local?: string;
  ordemDeCarregamento?: boolean;
}

export function AgendamentoForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosAgendamento | undefined;

  // Cada um destes só aparece aqui se realmente foi solicitado em uma
  // etapa anterior: "Agendamento de Carregamento" no Cadastramento, e
  // "Ordem de Carregamento" na Prospecção de Motorista.
  const dadosCadastramento = tarefa.dadosEtapa?.['cadastramento'] as
    | { agendamentoDeCarregamentoSolicitado?: boolean }
    | undefined;
  const agendamentoSolicitado = dadosCadastramento?.agendamentoDeCarregamentoSolicitado ?? false;
  const ordemDeCarregamentoSolicitada = foiSolicitadoNaProspeccao(
    tarefa,
    'Solicitar Ordem de Carregamento',
  );
  const nadaSolicitado = !agendamentoSolicitado && !ordemDeCarregamentoSolicitada;

  const [agendamentoCarregamento, setAgendamentoCarregamento] = useState(
    dadosSalvos?.agendamentoCarregamento ?? false,
  );
  const [dataHora, setDataHora] = useState(dadosSalvos?.dataHora ?? '');
  const [local, setLocal] = useState(dadosSalvos?.local ?? '');
  const [ordemDeCarregamento, setOrdemDeCarregamento] = useState(
    dadosSalvos?.ordemDeCarregamento ?? false,
  );
  const [enviando, setEnviando] = useState(false);

  const podeAvancar =
    !agendamentoSolicitado || (agendamentoCarregamento && dataHora.trim() !== '' && local.trim() !== '');

  async function aoAvancar() {
    if (!podeAvancar || enviando) return;
    setEnviando(true);

    try {
      const dadosEtapa: DadosAgendamento = {
        ...(agendamentoSolicitado ? { agendamentoCarregamento, dataHora, local } : {}),
        ...(ordemDeCarregamentoSolicitada ? { ordemDeCarregamento } : {}),
      };

      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, dadosEtapa);
      await avancarParaColuna(tarefa.id, 'carregamento-documentacao', 'a-fazer');
      onConcluir?.();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      {(agendamentoSolicitado || ordemDeCarregamentoSolicitada) && (
        <div className="status-check-list">
          {agendamentoSolicitado && (
            <StatusCheckField
              label="Agendamento de Carregamento"
              checked={agendamentoCarregamento}
              onChange={setAgendamentoCarregamento}
            />
          )}
          {ordemDeCarregamentoSolicitada && (
            <StatusCheckField
              label="Ordem de Carregamento"
              checked={ordemDeCarregamento}
              onChange={setOrdemDeCarregamento}
            />
          )}
        </div>
      )}

      {agendamentoSolicitado && agendamentoCarregamento && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="agendamento-data-hora">Data/Hora *</label>
            <input
              id="agendamento-data-hora"
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="agendamento-local">Local *</label>
            <input
              id="agendamento-local"
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Local do carregamento"
            />
          </div>
        </div>
      )}

      {ordemDeCarregamentoSolicitada && (
        <AnexosPanel tarefaId={tarefa.id} titulo="Ordem de Carregamento (anexo)" />
      )}

      {nadaSolicitado && (
        <>
          <p className="prospeccao-form__nota">
            Nada foi solicitado nas etapas anteriores para esta tarefa. Anexe algum documento se
            precisar e avance para a próxima etapa.
          </p>
          <AnexosPanel tarefaId={tarefa.id} />
        </>
      )}

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!podeAvancar || enviando}>
          {enviando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
