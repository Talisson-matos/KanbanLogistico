import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import './ViewPendencyModal.css';

interface ViewPendencyModalProps {
  aberto: boolean;
  texto: string;
  onFechar: () => void;
  /** Título do modal e mensagem de texto vazio. Padrão: "Pendência". */
  titulo?: string;
  textoVazio?: string;
  /** Ação extra exibida no rodapé, ao lado de "Fechar" (ex.: "Retificação Concluída"). */
  acaoExtraLabel?: string;
  onAcaoExtra?: () => void;
}

export function ViewPendencyModal({
  aberto,
  texto,
  onFechar,
  titulo = 'Pendência',
  textoVazio = 'Nenhum texto de pendência registrado.',
  acaoExtraLabel,
  onAcaoExtra,
}: ViewPendencyModalProps) {
  return (
    <Modal
      titulo={titulo}
      aberto={aberto}
      onFechar={onFechar}
      largura="sm"
      rodape={
        <>
          <Button variante="secondary" onClick={onFechar}>
            Fechar
          </Button>
          {acaoExtraLabel && onAcaoExtra && (
            <Button variante="primary" onClick={onAcaoExtra}>
              {acaoExtraLabel}
            </Button>
          )}
        </>
      }
    >
      <p className="view-pendency__text">{texto || textoVazio}</p>
    </Modal>
  );
}
