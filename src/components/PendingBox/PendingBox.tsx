import { useState } from 'react';
import type { Tarefa } from '@/types';
import { PendingListModal } from '@/components/modals/PendingListModal';
import './PendingBox.css';

interface PendingBoxProps {
  colunaTitulo: string;
  tarefas: Tarefa[];
}

/**
 * Caixa "Pendentes" de uma coluna.
 *
 * Não é mais uma zona de drop: a única forma de uma tarefa chegar
 * aqui é através do botão "Pendente" (que a remove do quadro), e a
 * única forma de sair é através de "Pendência Finalizada" dentro do
 * modal de listagem. Por isso a caixa mostra apenas um contador e,
 * ao ser clicada, abre o modal com todas as tarefas pendentes da
 * coluna.
 */
export function PendingBox({ colunaTitulo, tarefas }: PendingBoxProps) {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <>
      <button
        type="button"
        className={`pending-box ${tarefas.length > 0 ? 'pending-box--com-itens' : ''}`}
        onClick={() => setModalAberto(true)}
      >
        <span className="pending-box__title">Pendentes</span>
        <span className="pending-box__count">{tarefas.length}</span>
      </button>

      <PendingListModal
        aberto={modalAberto}
        colunaTitulo={colunaTitulo}
        tarefas={tarefas}
        onFechar={() => setModalAberto(false)}
      />
    </>
  );
}
