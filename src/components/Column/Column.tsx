import { useMemo, useState } from 'react';
import type { ColumnConfig } from '@/config/columns';
import type { Tarefa } from '@/types';
import { useKanban } from '@/hooks/useKanban';
import { SubColumn } from '@/components/SubColumn/SubColumn';
import { PendingBox } from '@/components/PendingBox/PendingBox';
import { ColumnFilterModal } from '@/components/modals/ColumnFilterModal';
import { ordenarPorPrioridade } from '@/services/rules/ordenarTarefas';
import {
  filtroVazio,
  obterMotoristaDaTarefa,
  obterRotaDaTarefa,
  tarefaCorrespondeAoFiltro,
  type FiltroColuna,
} from '@/services/rules/filtroTarefas';
import './Column.css';

interface ColumnProps {
  coluna: ColumnConfig;
  tarefas: Tarefa[];
}

function unicos(valores: (string | undefined)[]): string[] {
  return Array.from(new Set(valores.filter((v): v is string => Boolean(v)))).sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  );
}

export function Column({ coluna, tarefas }: ColumnProps) {
  const { getPedidoPorId } = useKanban();

  const [filtro, setFiltro] = useState<FiltroColuna>({});
  const [modalFiltroAberto, setModalFiltroAberto] = useState(false);
  const filtroAtivo = !filtroVazio(filtro);

  const tarefasAtivasBrutas = useMemo(() => tarefas.filter((t) => !t.pendente), [tarefas]);
  const tarefasPendentes = useMemo(() => tarefas.filter((t) => t.pendente), [tarefas]);

  // Opções disponíveis para o filtro, derivadas das tarefas
  // atualmente presentes nesta coluna (e seus respectivos pedidos).
  const opcoesFiltro = useMemo(() => {
    const pedidos = tarefasAtivasBrutas.map((t) => getPedidoPorId(t.pedidoId));
    return {
      numeroPedido: unicos(pedidos.map((p) => p?.numero)),
      criadoPor: unicos(tarefasAtivasBrutas.map((t) => t.criadoPor)),
      motorista: unicos(
        tarefasAtivasBrutas.map((t, i) => obterMotoristaDaTarefa(t, pedidos[i])),
      ),
      rota: unicos(pedidos.map((p) => obterRotaDaTarefa(p))),
    };
  }, [tarefasAtivasBrutas, getPedidoPorId]);

  const tarefasAtivas = useMemo(() => {
    if (filtroVazio(filtro)) return tarefasAtivasBrutas;
    return tarefasAtivasBrutas.filter((t) =>
      tarefaCorrespondeAoFiltro(t, filtro, getPedidoPorId(t.pedidoId)),
    );
  }, [tarefasAtivasBrutas, filtro, getPedidoPorId]);

  const tarefasAFazer = useMemo(
    () => ordenarPorPrioridade(tarefasAtivas.filter((t) => t.subColumnId === 'a-fazer')),
    [tarefasAtivas],
  );
  const tarefasFazendo = useMemo(
    () => ordenarPorPrioridade(tarefasAtivas.filter((t) => t.subColumnId === 'fazendo')),
    [tarefasAtivas],
  );

  // A coluna final "Histórico/Finalização" não tem sentido de
  // "A Fazer"/"Fazendo" — as tarefas chegam aqui já concluídas, então
  // exibimos uma única lista "Finalizado" em vez das duas subcolunas.
  const ehColunaFinal = coluna.id === 'historico-finalizacao';

  function aoClicarFiltro() {
    if (filtroAtivo) {
      setFiltro({});
    } else {
      setModalFiltroAberto(true);
    }
  }

  return (
    <section className={`column ${ehColunaFinal ? 'column--final' : ''}`} aria-label={coluna.titulo}>
      <header className="column__header">
        <span className="column__order">{String(coluna.ordem).padStart(2, '0')}</span>
        <div className="column__header-main">
          <h2 className="column__title">{coluna.titulo}</h2>
          <p className="column__description">{coluna.descricao}</p>
        </div>
        <button
          type="button"
          className={`column__filter-btn ${filtroAtivo ? 'is-active' : ''}`}
          onClick={aoClicarFiltro}
          title={filtroAtivo ? 'Remover filtro' : 'Filtrar tarefas desta coluna'}
          aria-pressed={filtroAtivo}
          aria-label="Filtrar coluna"
        >
          <svg viewBox="0 0 20 20" width="14" height="14" aria-hidden="true">
            <path
              d="M3 4h14l-5.5 6.2v5.3l-3 1.5v-6.8z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </header>

      <div className="column__body">
        {ehColunaFinal ? (
          <SubColumn id={`${coluna.id}::a-fazer`} titulo="Finalizado" tarefas={tarefasAFazer.concat(tarefasFazendo)} />
        ) : (
          <>
            <SubColumn id={`${coluna.id}::a-fazer`} titulo="A Fazer" tarefas={tarefasAFazer} />
            <SubColumn id={`${coluna.id}::fazendo`} titulo="Fazendo" tarefas={tarefasFazendo} />
          </>
        )}
      </div>

      <PendingBox colunaTitulo={coluna.titulo} tarefas={tarefasPendentes} />

      <ColumnFilterModal
        aberto={modalFiltroAberto}
        colunaTitulo={coluna.titulo}
        filtroAtual={filtro}
        opcoesNumeroPedido={opcoesFiltro.numeroPedido}
        opcoesCriadoPor={opcoesFiltro.criadoPor}
        opcoesMotorista={opcoesFiltro.motorista}
        opcoesRota={opcoesFiltro.rota}
        onFechar={() => setModalFiltroAberto(false)}
        onAplicar={setFiltro}
      />
    </section>
  );
}
