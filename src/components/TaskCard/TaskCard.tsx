import { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Tarefa } from '@/types';
import { useKanban } from '@/hooks/useKanban';
import { useElapsedMs, formatarDuracao } from '@/hooks/useElapsedMs';
import { COLUNAS, COLUNAS_COM_PRAZO_DE_ATRASO, LIMITE_ATRASO_MS } from '@/config/columns';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { TaskInfoModal } from '@/components/modals/TaskInfoModal';
import { OpenTaskModal } from '@/components/modals/OpenTaskModal';
import { PendingReasonModal } from '@/components/modals/PendingReasonModal';
import { ViewPendencyModal } from '@/components/modals/ViewPendencyModal';
import { RetificarTarefaModal } from '@/components/modals/RetificarTarefaModal';
import './TaskCard.css';

interface TaskCardProps {
  tarefa: Tarefa;
}

export function TaskCard({ tarefa }: TaskCardProps) {
  const { getPedidoPorId, excluirTarefa, marcarPendente, alternarUrgencia, enviarParaRetificacao, limparRetificacao } =
    useKanban();
  const pedido = getPedidoPorId(tarefa.pedidoId);

  const [modalAbrirTarefa, setModalAbrirTarefa] = useState(false);
  const [modalInformacoes, setModalInformacoes] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalPendente, setModalPendente] = useState(false);
  const [modalVerRetificacao, setModalVerRetificacao] = useState(false);
  const [modalRetificar, setModalRetificar] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tarefa.id,
    data: {
      tipo: 'tarefa',
      tarefa,
    },
  });

  const estilo = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
  };

  async function aoConfirmarExclusao() {
    await excluirTarefa(tarefa.id);
    setModalExcluir(false);
  }

  async function aoConfirmarPendencia(texto: string) {
    await marcarPendente(tarefa.id, texto);
    setModalPendente(false);
  }

  async function aoConfirmarRetificacao(texto: string) {
    if (!tarefa.colunaAnterior) return;
    await enviarParaRetificacao(tarefa.id, tarefa.colunaAnterior, texto);
    setModalRetificar(false);
  }

  async function aoConcluirRetificacao() {
    await limparRetificacao(tarefa.id);
    setModalVerRetificacao(false);
  }

  const ehFinalizado = tarefa.columnId === 'historico-finalizacao';
  const podeMarcarUrgente = tarefa.subColumnId === 'a-fazer';

  // Nome do motorista, definido na "Prospecção de Motorista" — exibido
  // no cartão para identificação rápida em qualquer etapa do Kanban.
  const dadosProspeccao = tarefa.dadosEtapa?.['prospeccao-motorista'] as
    | { nomeMotorista?: string }
    | undefined;
  const nomeMotorista = dadosProspeccao?.nomeMotorista;

  // "Retificar" fica disponível em qualquer "A Fazer" (exceto na
  // primeira coluna, que não tem para onde voltar) e devolve a tarefa
  // para a coluna de onde ela realmente veio (`colunaAnterior`), e não
  // para a anterior na ordem fixa do Kanban — importante porque
  // tarefas de Frota pulam "Guia", "Adiantamento" e "Saldo".
  const colunaAnteriorConfig = COLUNAS.find((c) => c.id === tarefa.colunaAnterior);
  const podeRetificar = tarefa.subColumnId === 'a-fazer' && !ehFinalizado && !!colunaAnteriorConfig;

  const tempoNaSubcoluna = useElapsedMs(tarefa.subColunaDesde);
  const emAtraso =
    COLUNAS_COM_PRAZO_DE_ATRASO.has(tarefa.columnId) && tempoNaSubcoluna > LIMITE_ATRASO_MS;

  // Prioridade visual quando mais de um estado se aplica ao mesmo tempo.
  const estadoVisual = tarefa.retificacao
    ? 'retificar'
    : tarefa.urgente
      ? 'urgente'
      : emAtraso
        ? 'atrasado'
        : ehFinalizado
          ? 'finalizado'
          : 'normal';

  return (
    <>
      <article
        ref={setNodeRef}
        style={estilo}
        className={`task-card task-card--${estadoVisual}`}
        {...attributes}
      >
        <header className="task-card__drag-handle" {...listeners}>
          <p className="task-card__route">
            {pedido ? (
              <>
                {pedido.origem} <span aria-hidden="true">→</span> {pedido.destino}
              </>
            ) : (
              tarefa.titulo
            )}
          </p>
          <div className="task-card__header-side">
            {pedido && <span className="task-card__order-number">#{pedido.numero}</span>}
            {podeRetificar && (
              <button
                type="button"
                className="task-card__flag task-card__flag--retificar"
                onClick={() => setModalRetificar(true)}
                title={`Retificar — devolve para "A Fazer" de "${colunaAnteriorConfig?.titulo}"`}
                aria-label="Retificar tarefa"
              >
                ↩
              </button>
            )}
            {!ehFinalizado && (
              <button
                type="button"
                className={`task-card__flag ${tarefa.urgente ? 'is-active' : ''}`}
                onClick={() => alternarUrgencia(tarefa.id)}
                disabled={!podeMarcarUrgente}
                title={
                  podeMarcarUrgente
                    ? tarefa.urgente
                      ? 'Remover urgência'
                      : 'Marcar como urgente'
                    : 'Só é possível marcar urgência em "A Fazer".'
                }
                aria-pressed={tarefa.urgente ?? false}
                aria-label="Marcar tarefa como urgente"
              >
                🚩
              </button>
            )}
          </div>
        </header>

        <div className="task-card__meta">
          {nomeMotorista && (
            <span className="task-card__motorista">🚚 {nomeMotorista}</span>
          )}
          <span className={`task-card__timer ${emAtraso ? 'is-atrasado' : ''}`}>
            ⏱ {formatarDuracao(tempoNaSubcoluna)} {tarefa.subColumnId === 'a-fazer' ? 'em A Fazer' : 'em Fazendo'}
          </span>
        </div>

        <div className="task-card__responsaveis">
          {tarefa.criadoPor && (
            <span className="task-card__responsavel task-card__responsavel--criador">
              Criado por: <strong>{tarefa.criadoPor}</strong>
            </span>
          )}
          {tarefa.subColumnId === 'fazendo' && tarefa.fazendoPor && (
            <span className="task-card__responsavel task-card__responsavel--fazendo">
              Fazendo: <strong>{tarefa.fazendoPor}</strong>
            </span>
          )}
        </div>

        {tarefa.retificacao && (
          <button
            type="button"
            className="task-card__badge task-card__badge--retificar"
            onClick={() => setModalVerRetificacao(true)}
          >
            A Retificar
          </button>
        )}

        <div className="task-card__actions">
          {!ehFinalizado && (
            <button
              className="task-card__action"
              onClick={() => setModalAbrirTarefa(true)}
              disabled={tarefa.subColumnId === 'a-fazer'}
              title={
                tarefa.subColumnId === 'a-fazer'
                  ? 'Mova a tarefa para "Fazendo" para poder abri-la.'
                  : undefined
              }
            >
              Abrir Tarefa
            </button>
          )}
          <button className="task-card__action" onClick={() => setModalInformacoes(true)}>
            Ver Informações
          </button>
          <button className="task-card__action" onClick={() => setModalPendente(true)}>
            Pendente
          </button>
          <button
            className="task-card__action task-card__action--danger"
            onClick={() => setModalExcluir(true)}
          >
            Excluir Tarefa
          </button>
        </div>
      </article>

      <OpenTaskModal
        tarefa={tarefa}
        aberto={modalAbrirTarefa}
        onFechar={() => setModalAbrirTarefa(false)}
      />

      <TaskInfoModal
        tarefa={tarefa}
        aberto={modalInformacoes}
        onFechar={() => setModalInformacoes(false)}
      />

      <ConfirmDeleteModal
        aberto={modalExcluir}
        onCancelar={() => setModalExcluir(false)}
        onConfirmar={aoConfirmarExclusao}
      />

      <PendingReasonModal
        aberto={modalPendente}
        onCancelar={() => setModalPendente(false)}
        onConfirmar={aoConfirmarPendencia}
      />

      {tarefa.retificacao && (
        <ViewPendencyModal
          aberto={modalVerRetificacao}
          texto={tarefa.retificacao.motivo}
          titulo="Motivo da Retificação"
          textoVazio="Nenhum motivo informado."
          onFechar={() => setModalVerRetificacao(false)}
          acaoExtraLabel="Retificação Concluída"
          onAcaoExtra={aoConcluirRetificacao}
        />
      )}

      <RetificarTarefaModal
        aberto={modalRetificar}
        colunaDestinoTitulo={colunaAnteriorConfig?.titulo}
        onCancelar={() => setModalRetificar(false)}
        onConfirmar={aoConfirmarRetificacao}
      />
    </>
  );
}
