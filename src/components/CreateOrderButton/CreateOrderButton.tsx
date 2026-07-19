import { useState } from 'react';
import { Button } from '@/components/common/Button';
import { CreatePedidoModal } from '@/components/modals/CreatePedidoModal';
import './CreateOrderButton.css';

export function CreateOrderButton() {
  const [modalAberto, setModalAberto] = useState(false);

  return (
    <div className="create-order">
      <Button variante="primary" onClick={() => setModalAberto(true)} className="create-order__btn">
        <span className="create-order__icon" aria-hidden="true">
          +
        </span>
        Criar Pedido
      </Button>

      <CreatePedidoModal aberto={modalAberto} onFechar={() => setModalAberto(false)} />
    </div>
  );
}
