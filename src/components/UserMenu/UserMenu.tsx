import { useEffect, useRef, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import './UserMenu.css';

/**
 * Mostra o nome do usuário logado no cabeçalho do Kanban. Clicar
 * abre um pequeno menu com a opção "Sair", permitindo trocar de
 * usuário sem recarregar a página.
 */
export function UserMenu() {
  const { usuarioAtual, logout } = useAuth();
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!aberto) return;

    function aoClicarFora(evento: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(evento.target as Node)) {
        setAberto(false);
      }
    }

    document.addEventListener('mousedown', aoClicarFora);
    return () => document.removeEventListener('mousedown', aoClicarFora);
  }, [aberto]);

  if (!usuarioAtual) return null;

  const inicial = usuarioAtual.nome.trim().charAt(0).toUpperCase() || '?';

  return (
    <div className="user-menu" ref={containerRef}>
      <button
        type="button"
        className="user-menu__trigger"
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="menu"
        aria-expanded={aberto}
      >
        <span className="user-menu__avatar" aria-hidden="true">
          {inicial}
        </span>
        <span className="user-menu__nome">{usuarioAtual.nome}</span>
        <span className="user-menu__seta" aria-hidden="true">
          ▾
        </span>
      </button>

      {aberto && (
        <div className="user-menu__dropdown" role="menu">
          <button
            type="button"
            className="user-menu__sair"
            role="menuitem"
            onClick={() => {
              setAberto(false);
              logout();
            }}
          >
            Sair
          </button>
        </div>
      )}
    </div>
  );
}
