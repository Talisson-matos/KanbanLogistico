import './FillStatusToggle.css';

interface FillStatusToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

/**
 * Alternador em formato de "barra de status de preenchimento",
 * usado no lugar de checkboxes simples nos formulários de "Abrir
 * Tarefa". Mostra uma barrinha que se preenche e um rótulo de estado
 * ("Pendente"/"Preenchido") ao lado do texto do campo.
 */
export function FillStatusToggle({ label, checked, onChange, disabled }: FillStatusToggleProps) {
  return (
    <button
      type="button"
      className={`fill-status ${checked ? 'is-filled' : ''}`}
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      aria-pressed={checked}
    >
      <span className="fill-status__bar" aria-hidden="true">
        <span className="fill-status__fill" />
      </span>
      <span className="fill-status__label">{label}</span>
      <span className="fill-status__state">{checked ? 'Preenchido' : 'Pendente'}</span>
    </button>
  );
}
