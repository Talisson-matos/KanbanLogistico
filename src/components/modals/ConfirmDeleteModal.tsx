import { Modal } from './Modal';
import { Button } from '@/components/common/Button';

interface ConfirmDeleteModalProps {
  aberto: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

export function ConfirmDeleteModal({ aberto, onCancelar, onConfirmar }: ConfirmDeleteModalProps) {
  return (
    <Modal
      titulo="Excluir tarefa"
      aberto={aberto}
      onFechar={onCancelar}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={onConfirmar}>
            Excluir tarefa
          </Button>
        </>
      }
    >
      <p>Tem certeza que deseja excluir a tarefa?</p>
    </Modal>
  );
}
