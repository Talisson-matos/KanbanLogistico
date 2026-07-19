import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import './FormFields.css';

interface PendingReasonModalProps {
  aberto: boolean;
  /** Quando informado, o modal abre em modo de edição, pré-preenchido com o texto atual. */
  textoInicial?: string;
  onCancelar: () => void;
  onConfirmar: (texto: string) => void;
}

export function PendingReasonModal({
  aberto,
  textoInicial = '',
  onCancelar,
  onConfirmar,
}: PendingReasonModalProps) {
  const [texto, setTexto] = useState(textoInicial);

  // Sincroniza o texto inicial sempre que o modal é reaberto.
  useEffect(() => {
    if (aberto) setTexto(textoInicial);
  }, [aberto, textoInicial]);

  function aoFechar() {
    setTexto('');
    onCancelar();
  }

  function aoConfirmar() {
    if (!texto.trim()) return;
    onConfirmar(texto.trim());
    setTexto('');
  }

  return (
    <Modal
      titulo="Marcar tarefa como pendente"
      aberto={aberto}
      onFechar={aoFechar}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button variante="primary" onClick={aoConfirmar} disabled={!texto.trim()}>
            Confirmar
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="pendencia-texto">Descreva a pendência</label>
        <textarea
          id="pendencia-texto"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          rows={4}
          autoFocus
        />
      </div>
    </Modal>
  );
}
