import { Modal } from './Modal';
import type { Tarefa } from '@/types';
import { PendingTaskRow } from '@/components/PendingTaskRow/PendingTaskRow';
import './PendingListModal.css';

interface PendingListModalProps {
  aberto: boolean;
  colunaTitulo: string;
  tarefas: Tarefa[];
  onFechar: () => void;
}

export function PendingListModal({ aberto, colunaTitulo, tarefas, onFechar }: PendingListModalProps) {
  return (
    <Modal titulo={`Pendentes — ${colunaTitulo}`} aberto={aberto} onFechar={onFechar} largura="lg">
      {tarefas.length === 0 ? (
        <p className="pending-list__empty">Nenhuma tarefa pendente nesta coluna.</p>
      ) : (
        <div className="pending-list">
          {tarefas.map((tarefa) => (
            <PendingTaskRow key={tarefa.id} tarefa={tarefa} />
          ))}
        </div>
      )}
    </Modal>
  );
}
