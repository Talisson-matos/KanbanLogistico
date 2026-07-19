/**
 * Gerador de identificadores únicos. Centralizado aqui para que,
 * caso o projeto passe a usar IDs gerados pelo banco de dados no
 * futuro, apenas este arquivo precise ser ajustado.
 */
export function gerarId(prefixo?: string): string {
  const aleatorio =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  return prefixo ? `${prefixo}_${aleatorio}` : aleatorio;
}

export function agoraISO(): string {
  return new Date().toISOString();
}
