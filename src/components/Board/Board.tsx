import { useCallback, useMemo, useRef } from 'react';
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { COLUNAS } from '@/config/columns';
import { useKanban } from '@/hooks/useKanban';
import { Column } from '@/components/Column/Column';
import { CreateOrderButton } from '@/components/CreateOrderButton/CreateOrderButton';
import { notificar } from '@/services/notifications';
import type { ColumnId, SubColumnId, Tarefa } from '@/types';
import './Board.css';

/** Identificadores de droppable seguem o padrão "columnId::subColumnId". */
function parseContainerId(id: string): { columnId: ColumnId; subColumnId: SubColumnId } | null {
  const [columnId, subColumnId] = id.split('::');
  if (subColumnId === 'a-fazer' || subColumnId === 'fazendo') {
    return { columnId: columnId as ColumnId, subColumnId };
  }
  return null;
}

/** Rola para a direita quando a roda do mouse desce, e para a esquerda quando sobe. */
function aoRolar(evento: WheelEvent) {
  const elemento = evento.currentTarget as HTMLDivElement;
  if (Math.abs(evento.deltaY) <= Math.abs(evento.deltaX)) return;
  evento.preventDefault();
  elemento.scrollLeft += evento.deltaY;
}

export function Board() {
  const { tarefas, carregando, erro, moverTarefa } = useKanban();

  // O Kanban se move horizontalmente, então a rolagem do mouse (que é
  // vertical por padrão) é redirecionada para rolar as colunas na
  // horizontal — evita ter que arrastar a barra de rolagem inferior.
  // Usa um `ref` de callback (em vez de `useRef` + `useEffect([])`)
  // porque o elemento `.board` só existe na renderização "principal"
  // (não nas de carregamento/erro); um efeito de dependências vazias
  // rodaria assim que o componente montasse — quase sempre ainda na
  // tela de "Carregando...", sem o elemento — e nunca mais reanexaria
  // o listener depois que os dados chegassem. O callback ref, por sua
  // vez, é chamado de novo sempre que o próprio elemento é montado.
  const elementoAtualRef = useRef<HTMLDivElement | null>(null);
  const boardRef = useCallback((elemento: HTMLDivElement | null) => {
    if (elementoAtualRef.current) {
      elementoAtualRef.current.removeEventListener('wheel', aoRolar);
    }
    elementoAtualRef.current = elemento;
    if (elemento) {
      elemento.addEventListener('wheel', aoRolar, { passive: false });
    }
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    }),
  );

  function resolverDestino(overId: string): { columnId: ColumnId; subColumnId: SubColumnId } | null {
    const direto = parseContainerId(overId);
    if (direto) return direto;

    // O "over" pode ser outra tarefa (drop dentro de uma lista já
    // ocupada); nesse caso usamos o container dessa tarefa-alvo.
    const tarefaAlvo = tarefas.find((t) => t.id === overId);
    if (tarefaAlvo) {
      return { columnId: tarefaAlvo.columnId, subColumnId: tarefaAlvo.subColumnId };
    }

    return null;
  }

  function aoFinalizarArraste(evento: DragEndEvent) {
    const { active, over } = evento;
    if (!over) return;

    const destino = resolverDestino(String(over.id));
    if (!destino) return;

    const resultado = moverTarefa(String(active.id), destino);
    if (!resultado.permitido && resultado.motivo) {
      notificar(resultado.motivo, 'aviso');
    }
  }

  const tarefasPorColuna = useMemo(() => {
    const mapa = new Map<ColumnId, Tarefa[]>();
    for (const coluna of COLUNAS) {
      mapa.set(coluna.id, tarefas.filter((t) => t.columnId === coluna.id));
    }
    return mapa;
  }, [tarefas]);

  if (carregando) {
    return (
      <div className="board board--loading">
        <p>Carregando quadro...</p>
      </div>
    );
  }

  if (erro) {
    return (
      <div className="board board--loading board--erro">
        <p>{erro}</p>
        <p className="board__erro-hint">
          Verifique se o servidor da API (`server/`) está em execução e se a variável
          `VITE_API_BASE_URL` aponta para o endereço correto.
        </p>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={aoFinalizarArraste}>
      <div className="board" ref={boardRef}>
        <CreateOrderButton />

        <div className="board__columns">
          {COLUNAS.map((coluna) => (
            <Column key={coluna.id} coluna={coluna} tarefas={tarefasPorColuna.get(coluna.id) ?? []} />
          ))}
        </div>
      </div>
    </DndContext>
  );
}
