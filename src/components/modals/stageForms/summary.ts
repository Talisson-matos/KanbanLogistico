import { COLUNAS, type ColumnConfig } from '@/config/columns';
import type { Tarefa } from '@/types';
import { STAGE_FIELDS_REGISTRY, type CampoExibicao } from './registry';

export interface SecaoEtapaPreenchida {
  coluna: ColumnConfig;
  linhas: string[];
}

/**
 * Formata os dados de uma etapa em linhas de texto legíveis, seguindo
 * a regra do projeto: checkbox → "Sim/Não: Rótulo"; demais campos →
 * "Rótulo: valor"; 'nota' → texto fixo (só quando presente/verdadeiro).
 */
function formatarLinhasDeEtapa(
  campos: CampoExibicao[],
  dados: Record<string, unknown>,
): string[] {
  return campos
    .filter((campo) => {
      if (campo.tipo === 'nota') return Boolean(dados[campo.chave]);
      return dados[campo.chave] !== undefined;
    })
    .map((campo) => {
      if (campo.tipo === 'nota') return campo.rotulo;

      if (campo.tipo === 'checkbox') {
        const marcado = Boolean(dados[campo.chave]);
        return `${marcado ? 'Sim' : 'Não'}: ${campo.rotulo}`;
      }

      const valorBruto = dados[campo.chave];
      const valor = campo.formatar ? campo.formatar(valorBruto) : String(valorBruto ?? '');
      return `${campo.rotulo}: ${valor}`;
    });
}

/**
 * Reúne, em ordem de coluna, todas as etapas que já têm dados
 * preenchidos em `tarefa.dadosEtapa` — usado tanto pelo modal "Ver
 * Informações" quanto pela etapa final "Histórico/Finalização", que
 * exibe o resumo completo de tudo o que foi salvo ao longo do
 * processo.
 */
export function obterSecoesEtapasPreenchidas(tarefa: Tarefa): SecaoEtapaPreenchida[] {
  if (!tarefa.dadosEtapa) return [];

  return COLUNAS.filter((c) => tarefa.dadosEtapa?.[c.id])
    .map((c) => {
      const campos = STAGE_FIELDS_REGISTRY[c.id];
      const dados = tarefa.dadosEtapa?.[c.id];
      if (!campos || !dados) return null;
      const linhas = formatarLinhasDeEtapa(campos, dados as Record<string, unknown>);
      return linhas.length > 0 ? { coluna: c, linhas } : null;
    })
    .filter((secao): secao is SecaoEtapaPreenchida => secao !== null);
}
