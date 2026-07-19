import './StatusCheckField.css';

interface StatusCheckFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  /** Texto exibido quando marcado. Padrão: "Validado". */
  rotuloMarcado?: string;
}

/**
 * Campo de preenchimento em formato de barra de status, usado nos
 * formulários de etapa no lugar de um checkbox simples. Clicar em
 * qualquer parte do campo alterna entre "Pendente" (vazio) e o rótulo
 * de `rotuloMarcado` (barra preenchida — "Validado" por padrão, ou
 * "Solicitar" nos campos que representam um pedido para etapas
 * futuras), dando uma indicação visual clara de progresso — diferente
 * do checklist de Sessão (ver `SessionChecklist`), que mantém o
 * checkbox nativo simples.
 */
export function StatusCheckField({
  label,
  checked,
  onChange,
  disabled,
  rotuloMarcado = 'Validado',
}: StatusCheckFieldProps) {
  return (
    <button
      type="button"
      className={`status-check ${checked ? 'is-filled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="status-check__label">{label}</span>
      <span className="status-check__bar">
        <span className="status-check__fill" />
      </span>
      <span className="status-check__state">{checked ? rotuloMarcado : 'Pendente'}</span>
    </button>
  );
}
