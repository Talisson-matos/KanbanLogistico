/**
 * Barramento de notificações simples (pub-sub), usado para exibir
 * avisos temporários (toasts) originados em qualquer parte da
 * aplicação — regras de movimentação bloqueadas, retificações,
 * confirmações de ações, etc. — sem acoplar quem dispara o aviso a
 * quem o exibe (`ToastHost`, montado uma única vez em `App`).
 */
export type TipoNotificacao = 'info' | 'sucesso' | 'aviso' | 'erro';

export interface Notificacao {
  mensagem: string;
  tipo: TipoNotificacao;
}

type Ouvinte = (notificacao: Notificacao) => void;

const ouvintes = new Set<Ouvinte>();

export function notificar(mensagem: string, tipo: TipoNotificacao = 'info'): void {
  ouvintes.forEach((ouvinte) => ouvinte({ mensagem, tipo }));
}

export function ouvirNotificacoes(ouvinte: Ouvinte): () => void {
  ouvintes.add(ouvinte);
  return () => ouvintes.delete(ouvinte);
}
