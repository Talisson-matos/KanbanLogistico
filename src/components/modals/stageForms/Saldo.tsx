import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import type { StageFormProps } from './registry';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosSaldo {
  [chave: string]: unknown;
  pagamentoSaldo?: boolean;
}

export function SaldoForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosSaldo | undefined;

  const [pagamentoSaldo, setPagamentoSaldo] = useState(dadosSalvos?.pagamentoSaldo ?? false);
  const [avancando, setAvancando] = useState(false);

  async function aoAvancar() {
    if (!pagamentoSaldo || avancando) return;
    setAvancando(true);
    try {
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, { pagamentoSaldo });
      await avancarParaColuna(tarefa.id, 'historico-finalizacao', 'a-fazer');
      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      <div className="status-check-list">
        <StatusCheckField
          label="Pagamento de Saldo"
          checked={pagamentoSaldo}
          onChange={setPagamentoSaldo}
        />
      </div>

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!pagamentoSaldo || avancando}>
          {avancando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
