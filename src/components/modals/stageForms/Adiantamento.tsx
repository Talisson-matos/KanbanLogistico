import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import type { StageFormProps } from './registry';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosAdiantamento {
  [chave: string]: unknown;
  adiantamentoPago?: boolean;
  planilhaAtualizada?: boolean;
}

export function AdiantamentoForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosAdiantamento | undefined;

  const [adiantamentoPago, setAdiantamentoPago] = useState(dadosSalvos?.adiantamentoPago ?? false);
  const [planilhaAtualizada, setPlanilhaAtualizada] = useState(
    dadosSalvos?.planilhaAtualizada ?? false,
  );
  const [avancando, setAvancando] = useState(false);

  const podeAvancar = adiantamentoPago && planilhaAtualizada;

  async function aoAvancar() {
    if (!podeAvancar || avancando) return;
    setAvancando(true);
    try {
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, {
        adiantamentoPago,
        planilhaAtualizada,
      });
      await avancarParaColuna(tarefa.id, 'viagem', 'a-fazer');
      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      <div className="status-check-list">
        <StatusCheckField
          label="Adiantamento Pago"
          checked={adiantamentoPago}
          onChange={setAdiantamentoPago}
        />
        <StatusCheckField
          label="Planilha Atualizada"
          checked={planilhaAtualizada}
          onChange={setPlanilhaAtualizada}
        />
      </div>

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!podeAvancar || avancando}>
          {avancando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
