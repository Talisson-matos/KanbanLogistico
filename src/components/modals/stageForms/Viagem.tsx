import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import type { StageFormProps } from './registry';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosViagem {
  [chave: string]: unknown;
  agendamentoDescarga?: boolean;
  dataHora?: string;
  local?: string;
}

export function ViagemForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosViagem | undefined;

  const [agendamentoDescarga, setAgendamentoDescarga] = useState(
    dadosSalvos?.agendamentoDescarga ?? false,
  );
  const [dataHora, setDataHora] = useState(dadosSalvos?.dataHora ?? '');
  const [local, setLocal] = useState(dadosSalvos?.local ?? '');
  const [avancando, setAvancando] = useState(false);

  const podeAvancar = agendamentoDescarga && dataHora.trim() !== '' && local.trim() !== '';

  async function aoAvancar() {
    if (!podeAvancar || avancando) return;
    setAvancando(true);
    try {
      const dadosEtapa: DadosViagem = { agendamentoDescarga, dataHora, local };
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, dadosEtapa);
      await avancarParaColuna(tarefa.id, 'descarga', 'a-fazer');
      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      <div className="status-check-list">
        <StatusCheckField
          label="Agendamento de Descarga"
          checked={agendamentoDescarga}
          onChange={setAgendamentoDescarga}
        />
      </div>

      {agendamentoDescarga && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="viagem-data-hora">Data/Hora *</label>
            <input
              id="viagem-data-hora"
              type="datetime-local"
              value={dataHora}
              onChange={(e) => setDataHora(e.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="viagem-local">Local *</label>
            <input
              id="viagem-local"
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              placeholder="Local da descarga"
            />
          </div>
        </div>
      )}

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!podeAvancar || avancando}>
          {avancando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
