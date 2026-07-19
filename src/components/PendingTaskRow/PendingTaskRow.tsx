import { useState } from 'react';
import type { Tarefa } from '@/types';
import { useKanban } from '@/hooks/useKanban';
import { OpenTaskModal } from '@/components/modals/OpenTaskModal';
import { TaskInfoModal } from '@/components/modals/TaskInfoModal';
import { ConfirmDeleteModal } from '@/components/modals/ConfirmDeleteModal';
import { PendingReasonModal } from '@/components/modals/PendingReasonModal';
import { ViewPendencyModal } from '@/components/modals/ViewPendencyModal';
import './PendingTaskRow.css';

interface PendingTaskRowProps {
  tarefa: Tarefa;
}

export function PendingTaskRow({ tarefa }: PendingTaskRowProps) {
  const { getPedidoPorId, getPendenciaAtual, excluirTarefa, editarPendencia, resolverPendente } =
    useKanban();

  const pedido = getPedidoPorId(tarefa.pedidoId);
  const pendencia = getPendenciaAtual(tarefa.id);

  const [modalAbrirTarefa, setModalAbrirTarefa] = useState(false);
  const [modalInformacoes, setModalInformacoes] = useState(false);
  const [modalExcluir, setModalExcluir] = useState(false);
  const [modalEditarPendencia, setModalEditarPendencia] = useState(false);
  const [modalVerPendencia, setModalVerPendencia] = useState(false);

  async function aoConfirmarExclusao() {
    await excluirTarefa(tarefa.id);
    setModalExcluir(false);
  }

  async function aoConfirmarEdicaoPendencia(texto: string) {
    await editarPendencia(tarefa.id, texto);
    setModalEditarPendencia(false);
  }

  async function aoFinalizarPendencia() {
    await resolverPendente(tarefa.id);
  }

  const ehFinalizado = tarefa.columnId === 'historico-finalizacao';

  const dadosProspeccao = tarefa.dadosEtapa?.['prospeccao-motorista'] as
    | { nomeMotorista?: string }
    | undefined;
  const nomeMotorista = dadosProspeccao?.nomeMotorista;

  return (
    <>
      <article className={`pending-row ${ehFinalizado ? 'pending-row--finalizado' : ''}`}>
        <header className="pending-row__header">
          <p className="pending-row__title">
            {pedido ? (
              <>
                {pedido.origem} <span aria-hidden="true">→</span> {pedido.destino}
              </>
            ) : (
              tarefa.titulo
            )}
          </p>
          {pedido && <span className="pending-row__order-number">#{pedido.numero}</span>}
        </header>

        {nomeMotorista && <span className="pending-row__motorista">🚚 {nomeMotorista}</span>}

        <div className="pending-row__responsaveis">
          {tarefa.criadoPor && (
            <span className="pending-row__responsavel">
              Criado por: <strong>{tarefa.criadoPor}</strong>
            </span>
          )}
          {tarefa.subColumnId === 'fazendo' && tarefa.fazendoPor && (
            <span className="pending-row__responsavel pending-row__responsavel--fazendo">
              Fazendo: <strong>{tarefa.fazendoPor}</strong>
            </span>
          )}
        </div>

        {tarefa.retificacao && <span className="pending-row__badge">A Retificar</span>}

        <div className="pending-row__actions">
          {!ehFinalizado && (
            <button
              className="pending-row__action"
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
          <button className="pending-row__action" onClick={() => setModalInformacoes(true)}>
            Ver Informações
          </button>
          <button className="pending-row__action" onClick={() => setModalEditarPendencia(true)}>
            Pendente
          </button>
          <button
            className="pending-row__action pending-row__action--danger"
            onClick={() => setModalExcluir(true)}
          >
            Excluir
          </button>
          <button className="pending-row__action" onClick={() => setModalVerPendencia(true)}>
            Ver Pendência
          </button>
          <button
            className="pending-row__action pending-row__action--success"
            onClick={aoFinalizarPendencia}
          >
            Pendência Finalizada
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
        aberto={modalEditarPendencia}
        textoInicial={pendencia?.motivo ?? ''}
        onCancelar={() => setModalEditarPendencia(false)}
        onConfirmar={aoConfirmarEdicaoPendencia}
      />

      <ViewPendencyModal
        aberto={modalVerPendencia}
        texto={pendencia?.motivo ?? ''}
        onFechar={() => setModalVerPendencia(false)}
      />
    </>
  );
}
