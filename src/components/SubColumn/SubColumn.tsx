import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Tarefa } from '@/types';
import { TaskCard } from '@/components/TaskCard/TaskCard';
import './SubColumn.css';

interface SubColumnProps {
  id: string;
  titulo: string;
  tarefas: Tarefa[];
}

export function SubColumn({ id, titulo, tarefas }: SubColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { tipo: 'subcoluna' },
  });

  return (
    <div className="subcolumn">
      <div className="subcolumn__header">
        <span className="subcolumn__title">{titulo}</span>
        <span className="subcolumn__count">{tarefas.length}</span>
      </div>

      <div ref={setNodeRef} className={`subcolumn__dropzone ${isOver ? 'is-over' : ''}`}>
        <SortableContext items={tarefas.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tarefas.length === 0 && <p className="subcolumn__empty">Sem tarefas</p>}
          {tarefas.map((tarefa) => (
            <TaskCard key={tarefa.id} tarefa={tarefa} />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
