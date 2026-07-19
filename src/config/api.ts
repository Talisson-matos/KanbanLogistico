/**
 * URL base da API backend. Configurável via variável de ambiente do
 * Vite (`VITE_API_BASE_URL`), com fallback para o servidor local de
 * desenvolvimento (`server/`, porta 4000).
 */
export const API_BASE_URL: string = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:4000/api';
