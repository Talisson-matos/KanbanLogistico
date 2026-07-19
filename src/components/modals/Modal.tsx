import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

interface ModalProps {
  titulo: string;
  aberto: boolean;
  onFechar: () => void;
  children: React.ReactNode;
  rodape?: React.ReactNode;
  /** Ações extras exibidas no cabeçalho, à esquerda do botão de fechar. */
  acoesHeader?: React.ReactNode;
  largura?: 'sm' | 'md' | 'lg';
}

export function Modal({
  titulo,
  aberto,
  onFechar,
  children,
  rodape,
  acoesHeader,
  largura = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!aberto) return;

    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar();
    }

    document.addEventListener('keydown', aoPressionarTecla);
    return () => document.removeEventListener('keydown', aoPressionarTecla);
  }, [aberto, onFechar]);

  if (!aberto) return null;

  // Renderizado via portal direto em `document.body`: assim o modal
  // sai da árvore DOM do quadro (`.board`), que tem um listener de
  // `wheel` convertendo rolagem vertical em horizontal. Se o modal
  // continuasse aninhado ali dentro, rolar o mouse sobre ele também
  // seria sequestrado para mover as colunas — com o portal, o scroll
  // dentro do modal volta a ser vertical normal.
  return createPortal(
    <div className="modal-overlay" onMouseDown={onFechar} role="presentation">
      <div
        className={`modal modal--${largura}`}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onMouseDown={(evento) => evento.stopPropagation()}
      >
        <header className="modal__header">
          <h2 className="modal__title">{titulo}</h2>
          <div className="modal__header-actions">
            {acoesHeader}
            <button className="modal__close" onClick={onFechar} aria-label="Fechar">
              ×
            </button>
          </div>
        </header>

        <div className="modal__body">{children}</div>

        {rodape && <footer className="modal__footer">{rodape}</footer>}
      </div>
    </div>,
    document.body,
  );
}
