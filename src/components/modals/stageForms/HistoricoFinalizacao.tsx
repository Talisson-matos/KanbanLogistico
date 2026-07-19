import { useMemo, useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { SessionChecklist } from '@/components/common/SessionChecklist';
import type { StageFormProps } from './registry';
import { obterSecoesEtapasPreenchidas } from './summary';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';
import './HistoricoFinalizacao.css';

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function HistoricoFinalizacaoForm({ tarefa, onConcluir }: StageFormProps) {
  const { getPedidoPorId, getSessoesPorTarefa, finalizarPedido } = useKanban();

  const pedido = getPedidoPorId(tarefa.pedidoId);
  const sessoes = useMemo(() => getSessoesPorTarefa(tarefa.id), [getSessoesPorTarefa, tarefa.id]);
  const secoesEtapas = useMemo(() => obterSecoesEtapasPreenchidas(tarefa), [tarefa]);

  const [finalizando, setFinalizando] = useState(false);
  const jaFinalizado = pedido?.status === 'finalizado';

  const finalizadoEmBruto = tarefa.dadosEtapa?.[tarefa.columnId]?.finalizadoEm;
  const finalizadoEm = typeof finalizadoEmBruto === 'string' ? finalizadoEmBruto : undefined;

  async function aoFinalizar() {
    if (finalizando || jaFinalizado) return;
    setFinalizando(true);
    try {
      await finalizarPedido(tarefa.id);
      onConcluir?.();
    } finally {
      setFinalizando(false);
    }
  }

  return (
    <div className="prospeccao-form historico-finalizacao">
      <p className="prospeccao-form__success">
        Esta é a etapa final do fluxo. Abaixo está o resumo de tudo o que foi preenchido e salvo
        ao longo de todo o processo, etapa por etapa.
      </p>

      {jaFinalizado && (
        <p className="historico-finalizacao__ja-finalizado">
          Pedido finalizado{finalizadoEm ? ` em ${formatarData(finalizadoEm)}` : ''}.
        </p>
      )}

      {pedido && (
        <section className="historico-finalizacao__section">
          <h4>Pedido</h4>
          <dl className="historico-finalizacao__grid">
            <div>
              <dt>Número</dt>
              <dd>{pedido.numero}</dd>
            </div>
            <div>
              <dt>Rota</dt>
              <dd>
                {pedido.origem} → {pedido.destino}
              </dd>
            </div>
            <div>
              <dt>Valor do Frete</dt>
              <dd>
                {pedido.valorFrete != null
                  ? pedido.valorFrete.toLocaleString('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                    })
                  : '—'}
              </dd>
            </div>
          </dl>
        </section>
      )}

      <section className="historico-finalizacao__section">
        <h4>Dados de todas as etapas</h4>
        {secoesEtapas.length > 0 ? (
          <div className="historico-finalizacao__stages">
            {secoesEtapas.map(({ coluna, linhas }) => (
              <div key={coluna.id} className="historico-finalizacao__stage">
                <p className="historico-finalizacao__stage-title">{coluna.titulo}</p>
                <ul>
                  {linhas.map((linha, indice) => (
                    <li key={indice}>{linha}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="prospeccao-form__nota">Nenhum dado de etapa foi salvo para esta tarefa.</p>
        )}
      </section>

      {sessoes.length > 0 && (
        <section className="historico-finalizacao__section">
          <h4>Sessões</h4>
          <div className="historico-finalizacao__stages">
            {sessoes.map((sessao) => (
              <SessionChecklist key={sessao.id} sessao={sessao} />
            ))}
          </div>
        </section>
      )}

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoFinalizar} disabled={finalizando || jaFinalizado}>
          {jaFinalizado ? 'Pedido já finalizado' : finalizando ? 'Finalizando...' : 'Finalizar Pedido'}
        </Button>
      </div>
    </div>
  );
}
