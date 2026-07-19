import { Modal } from './Modal';
import { Button } from '@/components/common/Button';

interface ConfirmActionModalProps {
  titulo: string;
  mensagem: string;
  textoConfirmar?: string;
  aberto: boolean;
  onCancelar: () => void;
  onConfirmar: () => void;
}

/**
 * Modal de confirmação genérico, para ações diferentes de "excluir
 * tarefa" (que tem seu próprio modal com o texto exigido pelo
 * projeto). Usado, por exemplo, para confirmar a exclusão de um
 * anexo.
 */
export function ConfirmActionModal({
  titulo,
  mensagem,
  textoConfirmar = 'Confirmar',
  aberto,
  onCancelar,
  onConfirmar,
}: ConfirmActionModalProps) {
  return (
    <Modal
      titulo={titulo}
      aberto={aberto}
      onFechar={onCancelar}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={onCancelar}>
            Cancelar
          </Button>
          <Button variante="danger" onClick={onConfirmar}>
            {textoConfirmar}
          </Button>
        </>
      }
    >
      <p>{mensagem}</p>
    </Modal>
  );
}
