import { useEffect, useState } from 'react';
import { ouvirNotificacoes, type Notificacao } from '@/services/notifications';
import './ToastHost.css';

interface ToastAtivo extends Notificacao {
  id: number;
}

let proximoId = 1;

/**
 * Host global de notificações (toasts). Deve ser montado uma única
 * vez, próximo à raiz da aplicação (`App.tsx`), e escuta o barramento
 * `services/notifications` — qualquer parte do sistema pode chamar
 * `notificar(mensagem)` para exibir um aviso, sem depender de props
 * ou de onde o componente que originou o aviso está montado.
 */
export function ToastHost() {
  const [toasts, setToasts] = useState<ToastAtivo[]>([]);

  useEffect(() => {
    return ouvirNotificacoes((notificacao) => {
      const id = proximoId++;
      setToasts((atual) => [...atual, { ...notificacao, id }]);
      window.setTimeout(() => {
        setToasts((atual) => atual.filter((t) => t.id !== id));
      }, 3600);
    });
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div className="toast-host">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast toast--${toast.tipo}`}>
          {toast.mensagem}
        </div>
      ))}
    </div>
  );
}
