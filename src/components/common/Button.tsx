import React from 'react';
import './Button.css';

type Variante = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamanho?: 'sm' | 'md';
}

export function Button({
  variante = 'secondary',
  tamanho = 'md',
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const classes = ['btn', `btn--${variante}`, `btn--${tamanho}`, className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
}
