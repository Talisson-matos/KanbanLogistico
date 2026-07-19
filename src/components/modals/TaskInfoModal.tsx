import { useEffect, useMemo, useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import { SessionChecklist } from '@/components/common/SessionChecklist';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import { useAnexos } from '@/hooks/useAnexos';
import { useKanban } from '@/hooks/useKanban';
import type { Tarefa } from '@/types';
import { COLUNAS } from '@/config/columns';
import { obterSecoesEtapasPreenchidas } from './stageForms/summary';
import './TaskInfoModal.css';

interface TaskInfoModalProps {
  tarefa: Tarefa | null;
  aberto: boolean;
  onFechar: () => void;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function TaskInfoModal({ tarefa, aberto, onFechar }: TaskInfoModalProps) {
  const {
    getPedidoPorId,
    getChecklistPorTarefa,
    getSessoesPorTarefa,
    getHistoricoPorEntidade,
    getObservacoesPorEntidade,
    adicionarObservacao,
    atualizarPedido,
  } = useKanban();

  const [novaObservacao, setNovaObservacao] = useState('');
  const [observacoesPermanentes, setObservacoesPermanentes] = useState('');
  const [salvandoObservacoesPermanentes, setSalvandoObservacoesPermanentes] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const pedido = tarefa ? getPedidoPorId(tarefa.pedidoId) : undefined;
  const checklist = tarefa ? getChecklistPorTarefa(tarefa.id) : undefined;
  const sessoes = tarefa ? getSessoesPorTarefa(tarefa.id) : [];
  const historico = tarefa ? getHistoricoPorEntidade(tarefa.id) : [];
  const observacoes = tarefa ? getObservacoesPorEntidade(tarefa.id) : [];
  // Reutiliza o mesmo hook do AnexosPanel apenas para poder incluir os
  // nomes dos arquivos anexados no texto de "Copiar Tudo".
  const { anexos } = useAnexos(tarefa?.id ?? '');

  const coluna = useMemo(
    () => COLUNAS.find((c) => c.id === tarefa?.columnId),
    [tarefa?.columnId],
  );

  // Sincroniza o campo permanente de observações com o pedido sempre
  // que o modal é reaberto ou a tarefa/pedido muda.
  useEffect(() => {
    setObservacoesPermanentes(pedido?.observacoesGerais ?? '');
  }, [pedido?.id, pedido?.observacoesGerais, aberto]);

  // Histórico completo de TODAS as etapas já preenchidas (não apenas a
  // atual), conforme exigido: "Tudo que for preenchido nos formulários
  // futuros deverá ser armazenado" no Ver Informações.
  const secoesEtapasPreenchidas = useMemo(
    () => (tarefa ? obterSecoesEtapasPreenchidas(tarefa) : []),
    [tarefa],
  );

  if (!tarefa) return null;

  async function aoSalvarObservacao() {
    if (!novaObservacao.trim() || !tarefa) return;
    await adicionarObservacao(tarefa.id, 'tarefa', novaObservacao.trim());
    setNovaObservacao('');
  }

  async function aoSalvarObservacoesPermanentes() {
    if (!pedido || salvandoObservacoesPermanentes) return;
    setSalvandoObservacoesPermanentes(true);
    try {
      await atualizarPedido(pedido.id, { observacoesGerais: observacoesPermanentes });
    } finally {
      setSalvandoObservacoesPermanentes(false);
    }
  }

  function montarTextoCompleto(): string {
    const linhas: string[] = [];

    if (anexos.length > 0) {
      linhas.push('=== ANEXOS ===');
      anexos.forEach((anexo) => {
        linhas.push(`${anexo.nomeArquivo} (${formatarData(anexo.criadoEm)})`);
      });
      linhas.push('');
    }

    linhas.push('=== TAREFA ===');
    linhas.push(`Título: ${tarefa!.titulo}`);
    linhas.push(`Coluna: ${coluna?.titulo ?? ''}`);
    linhas.push(`Subcoluna: ${tarefa!.subColumnId === 'a-fazer' ? 'A Fazer' : 'Fazendo'}`);
    linhas.push(`Situação: ${tarefa!.pendente ? 'Pendente' : 'Em andamento'}`);
    if (tarefa!.criadoPor) linhas.push(`Criado por: ${tarefa!.criadoPor}`);
    if (tarefa!.subColumnId === 'fazendo' && tarefa!.fazendoPor) {
      linhas.push(`Fazendo (atualmente): ${tarefa!.fazendoPor}`);
    }
    linhas.push(`Criada em: ${formatarData(tarefa!.criadoEm)}`);
    linhas.push(`Atualizada em: ${formatarData(tarefa!.atualizadoEm)}`);

    if (pedido) {
      linhas.push('');
      linhas.push('=== PEDIDO ===');
      linhas.push(`Número do Pedido: ${pedido.numero}`);
      linhas.push(
        `Valor do Frete: ${
          pedido.valorFrete != null
            ? pedido.valorFrete.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
            : '—'
        }`,
      );
      linhas.push(`Rota: ${pedido.origem} → ${pedido.destino}`);
      if (pedido.motorista) linhas.push(`Motorista: ${pedido.motorista}`);
      if (pedido.placa) linhas.push(`Placa: ${pedido.placa}`);
      if (pedido.outrasInformacoes) linhas.push(`Outras Informações: ${pedido.outrasInformacoes}`);
    }

    if (secoesEtapasPreenchidas.length > 0) {
      linhas.push('');
      linhas.push('=== DADOS DAS ETAPAS ===');
      secoesEtapasPreenchidas.forEach(({ coluna: colunaEtapa, linhas: linhasDaEtapa }) => {
        linhas.push(`-- ${colunaEtapa.titulo} --`);
        linhas.push(...linhasDaEtapa);
      });
    }

    linhas.push('');
    linhas.push('=== CHECKLIST ===');
    if (checklist) {
      checklist.itens.forEach((item) => {
        linhas.push(`${item.concluido ? 'Sim' : 'Não'}: ${item.descricao}`);
      });
    } else {
      linhas.push('Nenhum checklist definido para esta etapa.');
    }

    linhas.push('');
    linhas.push('=== SESSÕES ===');
    if (sessoes.length > 0) {
      sessoes.forEach((sessao) => {
        linhas.push(`${sessao.titulo}`);
        sessao.itens.forEach((item) => {
          linhas.push(`  ${item.concluido ? 'Sim' : 'Não'}: ${item.descricao}`);
        });
      });
    } else {
      linhas.push('Nenhuma sessão registrada.');
    }

    linhas.push('');
    linhas.push('=== HISTÓRICO ===');
    if (historico.length > 0) {
      [...historico]
        .sort((a, b) => b.data.localeCompare(a.data))
        .forEach((entrada) => {
          linhas.push(`${formatarData(entrada.data)} — ${entrada.descricao}`);
        });
    } else {
      linhas.push('Sem registros de histórico.');
    }

    linhas.push('');
    linhas.push('=== OBSERVAÇÕES PERMANENTES ===');
    linhas.push(observacoesPermanentes.trim() || '—');

    linhas.push('');
    linhas.push('=== REGISTRO DE OBSERVAÇÕES ===');
    if (observacoes.length > 0) {
      observacoes.forEach((obs) => {
        linhas.push(`${formatarData(obs.criadoEm)} — ${obs.texto}`);
      });
    } else {
      linhas.push('Nenhuma observação registrada.');
    }

    return linhas.join('\n');
  }

  async function aoCopiarTudo() {
    const texto = montarTextoCompleto();
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch (erro) {
      console.error('[TaskInfoModal] Falha ao copiar para a área de transferência:', erro);
    }
  }

  return (
    <Modal
      titulo="Informações da tarefa"
      aberto={aberto}
      onFechar={onFechar}
      largura="lg"
      acoesHeader={
        <Button variante="secondary" tamanho="sm" onClick={aoCopiarTudo}>
          {copiado ? 'Copiado!' : 'Copiar Tudo'}
        </Button>
      }
    >
      <div className="task-info">
        <AnexosPanel tarefaId={tarefa.id} />

        <section className="task-info__section">
          <h3 className="task-info__heading">Tarefa</h3>
          <dl className="task-info__grid">
            <div>
              <dt>Título</dt>
              <dd>{tarefa.titulo}</dd>
            </div>
            <div>
              <dt>Coluna</dt>
              <dd>{coluna?.titulo}</dd>
            </div>
            <div>
              <dt>Subcoluna</dt>
              <dd>{tarefa.subColumnId === 'a-fazer' ? 'A Fazer' : 'Fazendo'}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd>{tarefa.pendente ? 'Pendente' : 'Em andamento'}</dd>
            </div>
            {tarefa.criadoPor && (
              <div>
                <dt>Criado por</dt>
                <dd>{tarefa.criadoPor}</dd>
              </div>
            )}
            {tarefa.subColumnId === 'fazendo' && tarefa.fazendoPor && (
              <div>
                <dt>Fazendo (atualmente)</dt>
                <dd>{tarefa.fazendoPor}</dd>
              </div>
            )}
            <div>
              <dt>Criada em</dt>
              <dd>{formatarData(tarefa.criadoEm)}</dd>
            </div>
            <div>
              <dt>Atualizada em</dt>
              <dd>{formatarData(tarefa.atualizadoEm)}</dd>
            </div>
          </dl>
        </section>

        {pedido && (
          <section className="task-info__section">
            <h3 className="task-info__heading">Pedido</h3>
            <dl className="task-info__grid">
              <div>
                <dt>Número do Pedido</dt>
                <dd className="task-info__mono">{pedido.numero}</dd>
              </div>
              <div>
                <dt>Valor do Frete</dt>
                <dd>
                  {pedido.valorFrete != null
                    ? pedido.valorFrete.toLocaleString('pt-BR', {
                        style: 'currency',
                        currency: 'BRL',
                      })
                    : '—'}
                </dd>
              </div>
              <div className="task-info__grid-full">
                <dt>Rota</dt>
                <dd>
                  {pedido.origem} <span aria-hidden="true">→</span> {pedido.destino}
                </dd>
              </div>
              {pedido.motorista && (
                <div>
                  <dt>Motorista</dt>
                  <dd>{pedido.motorista}</dd>
                </div>
              )}
              {pedido.placa && (
                <div>
                  <dt>Placa</dt>
                  <dd className="task-info__mono">{pedido.placa}</dd>
                </div>
              )}
              {pedido.outrasInformacoes && (
                <div className="task-info__grid-full">
                  <dt>Outras Informações</dt>
                  <dd>{pedido.outrasInformacoes}</dd>
                </div>
              )}
            </dl>
          </section>
        )}

        <section className="task-info__section">
          <h3 className="task-info__heading">Dados das Etapas</h3>
          {secoesEtapasPreenchidas.length > 0 ? (
            <div className="task-info__stage-sections">
              {secoesEtapasPreenchidas.map(({ coluna: colunaEtapa, linhas }) => (
                <div key={colunaEtapa.id} className="task-info__stage-section">
                  <p className="task-info__stage-section-title">
                    {colunaEtapa.titulo}
                    {colunaEtapa.id === tarefa.columnId && (
                      <span className="task-info__tag-atual">etapa atual</span>
                    )}
                  </p>
                  <ul className="task-info__list task-info__list--etapa">
                    {linhas.map((linha, indice) => (
                      <li key={indice}>{linha}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <p className="task-info__empty">
              Nenhuma informação preenchida em nenhuma etapa ainda. Tudo o que for preenchido nos
              formulários de "Abrir Tarefa" aparecerá automaticamente aqui, etapa por etapa.
            </p>
          )}
        </section>

        <section className="task-info__section">
          <h3 className="task-info__heading">Checklist</h3>
          {checklist ? (
            <ul className="task-info__checklist">
              {checklist.itens.map((item) => (
                <li key={item.id} className={item.concluido ? 'is-done' : ''}>
                  <span className="task-info__checkbox" aria-hidden="true">
                    {item.concluido ? '✓' : ''}
                  </span>
                  {item.concluido ? 'Sim' : 'Não'}: {item.descricao}
                </li>
              ))}
            </ul>
          ) : (
            <p className="task-info__empty">Nenhum checklist definido para esta etapa ainda.</p>
          )}
        </section>

        <section className="task-info__section">
          <h3 className="task-info__heading">Sessões</h3>
          {sessoes.length > 0 ? (
            <div className="task-info__sessions">
              {sessoes.map((sessao) => (
                <SessionChecklist key={sessao.id} sessao={sessao} />
              ))}
            </div>
          ) : (
            <p className="task-info__empty">Nenhuma sessão registrada para esta tarefa.</p>
          )}
        </section>

        <section className="task-info__section">
          <h3 className="task-info__heading">Histórico</h3>
          {historico.length > 0 ? (
            <ul className="task-info__list task-info__list--history">
              {[...historico]
                .sort((a, b) => b.data.localeCompare(a.data))
                .map((entrada) => (
                  <li key={entrada.id}>
                    <span className="task-info__history-date">{formatarData(entrada.data)}</span>
                    <span>{entrada.descricao}</span>
                  </li>
                ))}
            </ul>
          ) : (
            <p className="task-info__empty">Sem registros de histórico.</p>
          )}
        </section>

        <section className="task-info__section">
          <h3 className="task-info__heading">Observações Permanentes</h3>
          <p className="task-info__hint">
            Campo único, editável em qualquer etapa do Kanban — não é um registro por data, e sim
            a observação atual do pedido.
          </p>
          <div className="task-info__permanent-observation">
            <textarea
              value={observacoesPermanentes}
              onChange={(evento) => setObservacoesPermanentes(evento.target.value)}
              placeholder="Observações gerais do pedido, editáveis a qualquer momento..."
              rows={3}
            />
            <Button
              variante="secondary"
              tamanho="sm"
              onClick={aoSalvarObservacoesPermanentes}
              disabled={salvandoObservacoesPermanentes || !pedido}
            >
              {salvandoObservacoesPermanentes ? 'Salvando...' : 'Salvar observações'}
            </Button>
          </div>
        </section>

        <section className="task-info__section">
          <h3 className="task-info__heading">Registro de Observações</h3>
          {observacoes.length > 0 ? (
            <ul className="task-info__list">
              {observacoes.map((obs) => (
                <li key={obs.id}>
                  <span className="task-info__mono">{formatarData(obs.criadoEm)}</span> —{' '}
                  {obs.texto}
                </li>
              ))}
            </ul>
          ) : (
            <p className="task-info__empty">Nenhuma observação registrada.</p>
          )}

          <div className="task-info__add-observation">
            <textarea
              value={novaObservacao}
              onChange={(evento) => setNovaObservacao(evento.target.value)}
              placeholder="Adicionar uma nova observação datada sobre esta tarefa..."
              rows={2}
            />
            <Button variante="secondary" tamanho="sm" onClick={aoSalvarObservacao}>
              Adicionar observação
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}
