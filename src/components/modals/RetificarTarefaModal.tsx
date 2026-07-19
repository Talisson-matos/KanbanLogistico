import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import './FormFields.css';

interface RetificarTarefaModalProps {
  aberto: boolean;
  /** Título da coluna para onde a tarefa vai retornar, só para a mensagem. */
  colunaDestinoTitulo?: string;
  onCancelar: () => void;
  onConfirmar: (texto: string) => void;
}

export function RetificarTarefaModal({
  aberto,
  colunaDestinoTitulo,
  onCancelar,
  onConfirmar,
}: RetificarTarefaModalProps) {
  const [texto, setTexto] = useState('');

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
      titulo="Retificar tarefa"
      aberto={aberto}
      onFechar={aoFechar}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={aoConfirmar} disabled={!texto.trim()}>
            Confirmar retificação
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="retificar-texto">Descreva o que precisa ser retificado</label>
        <textarea
          id="retificar-texto"
          value={texto}
          onChange={(evento) => setTexto(evento.target.value)}
          rows={4}
          autoFocus
        />
      </div>
      {colunaDestinoTitulo && (
        <p className="form-hint">
          Ao confirmar, a tarefa retorna para "A Fazer" de "{colunaDestinoTitulo}".
        </p>
      )}
    </Modal>
  );
}
