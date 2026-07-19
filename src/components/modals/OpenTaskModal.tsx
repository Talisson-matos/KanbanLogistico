import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import type { Tarefa } from '@/types';
import { COLUNAS } from '@/config/columns';
import { STAGE_FORM_REGISTRY } from './stageForms/registry';
import './OpenTaskModal.css';

interface OpenTaskModalProps {
  tarefa: Tarefa | null;
  aberto: boolean;
  onFechar: () => void;
}

/**
 * Modal acionado por "Abrir Tarefa".
 *
 * Consulta o `STAGE_FORM_REGISTRY` para encontrar o formulário
 * específico da coluna da tarefa. Enquanto os formulários das
 * próximas partes não forem registrados, exibe um placeholder
 * informativo — a estrutura, porém, já está pronta para recebê-los.
 */
export function OpenTaskModal({ tarefa, aberto, onFechar }: OpenTaskModalProps) {
  if (!tarefa) return null;

  const coluna = COLUNAS.find((c) => c.id === tarefa.columnId);
  const FormularioEtapa = STAGE_FORM_REGISTRY[tarefa.columnId];

  return (
    <Modal
      titulo={`Abrir tarefa — ${coluna?.titulo ?? ''}`}
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      rodape={
        <Button variante="secondary" onClick={onFechar}>
          Fechar
        </Button>
      }
    >
      {FormularioEtapa ? (
        <FormularioEtapa tarefa={tarefa} onConcluir={onFechar} />
      ) : (
        <div className="open-task-placeholder">
          <p>
            O formulário específico da etapa <strong>{coluna?.titulo}</strong> ainda não foi
            implementado nesta parte do projeto.
          </p>
          <p className="open-task-placeholder__hint">
            A arquitetura já está preparada: assim que o formulário desta etapa for adicionado ao
            <code> STAGE_FORM_REGISTRY</code>, ele passará a ser exibido automaticamente aqui, sem
            necessidade de alterar este componente.
          </p>
        </div>
      )}
    </Modal>
  );
}
