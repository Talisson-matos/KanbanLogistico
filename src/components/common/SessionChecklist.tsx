import type { Sessao } from '@/types';
import { useKanban } from '@/hooks/useKanban';
import './SessionChecklist.css';

interface SessionChecklistProps {
  sessao: Sessao;
}

export function SessionChecklist({ sessao }: SessionChecklistProps) {
  const { alternarItemSessao } = useKanban();

  const concluidos = sessao.itens.filter((item) => item.concluido).length;

  return (
    <div className="session-checklist">
      <header className="session-checklist__header">
        <p className="session-checklist__title">{sessao.titulo}</p>
        <span className="session-checklist__progress">
          {concluidos}/{sessao.itens.length}
        </span>
      </header>

      <ul className="session-checklist__items">
        {sessao.itens.map((item) => (
          <li key={item.id}>
            <label className="session-checklist__item">
              <input
                type="checkbox"
                checked={item.concluido}
                onChange={() => alternarItemSessao(sessao.id, item.id)}
              />
              <span className={item.concluido ? 'is-done' : ''}>{item.descricao}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
