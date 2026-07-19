import React, { createContext, useEffect, useReducer, useCallback, useMemo } from 'react';
import type {
  Pedido,
  Tarefa,
  Pendencia,
  Checklist,
  Sessao,
  CriarSessaoInput,
  Observacao,
  CriarPedidoInput,
  ColumnId,
  SubColumnId,
  EntidadeTipo,
  AcaoHistorico,
} from '@/types';
import { COLUNAS, PRIMEIRA_COLUNA } from '@/config/columns';
import { gerarId, agoraISO } from '@/services/idGenerator';
import {
  pedidosStorage,
  tarefasStorage,
  pendenciasStorage,
  checklistsStorage,
  sessoesStorage,
  historicoStorage,
  observacoesStorage,
} from '@/services/storage';
import { podeMoverTarefa, type DestinoMovimentacao, type ResultadoRegra } from '@/services/rules/movementRules';
import { notificar } from '@/services/notifications';
import { anexosService } from '@/services/anexos/anexosService';
import { useAuth } from '@/hooks/useAuth';
import { kanbanReducer, estadoInicial, type KanbanState } from './kanbanReducer';

/** Nome usado quando, por algum motivo, não há usuário logado (não deveria ocorrer em uso normal). */
const USUARIO_FALLBACK = 'sistema';

/** Intervalo de atualização automática em segundo plano do quadro (ms). */
const INTERVALO_ATUALIZACAO_MS = 15000;

export interface KanbanContextValue extends KanbanState {
  // Pedido
  criarPedido: (dados: CriarPedidoInput) => Promise<Pedido>;
  atualizarPedido: (pedidoId: string, alteracoes: Partial<Pedido>) => Promise<void>;

  // Tarefa
  moverTarefa: (tarefaId: string, destino: DestinoMovimentacao) => ResultadoRegra;
  marcarPendente: (tarefaId: string, texto: string) => Promise<void>;
  editarPendencia: (tarefaId: string, novoTexto: string) => Promise<void>;
  /** Alterna a marcação de urgência. Só tem efeito enquanto a tarefa está em "A Fazer". */
  alternarUrgencia: (tarefaId: string) => Promise<void>;
  resolverPendente: (tarefaId: string) => Promise<void>;
  excluirTarefa: (tarefaId: string) => Promise<void>;
  atualizarTarefa: (tarefaId: string, alteracoes: Partial<Tarefa>) => Promise<void>;
  /** Mescla dados no namespace de uma coluna específica de `tarefa.dadosEtapa`, preservando as demais etapas. */
  atualizarDadosEtapa: (
    tarefaId: string,
    coluna: ColumnId,
    dados: Record<string, unknown>,
  ) => Promise<void>;
  /** Avança a tarefa para outra coluna/subcoluna por ação de negócio (fora do drag and drop). */
  avancarParaColuna: (
    tarefaId: string,
    novaColuna: ColumnId,
    novaSubColuna?: SubColumnId,
    descricaoHistorico?: string,
  ) => Promise<void>;
  /** Envia a tarefa para retificação: retorna para uma coluna anterior com um motivo anexado. */
  enviarParaRetificacao: (
    tarefaId: string,
    colunaOrigem: ColumnId,
    motivo: string,
  ) => Promise<void>;
  /** Remove o sinalizador de retificação (chamado ao reenviar a etapa corrigida). */
  limparRetificacao: (tarefaId: string) => Promise<void>;
  /** Marca o Pedido como finalizado (chamado na coluna "Histórico/Finalização"). */
  finalizarPedido: (tarefaId: string) => Promise<void>;

  // Sessão
  criarSessao: (dados: CriarSessaoInput) => Promise<Sessao>;
  alternarItemSessao: (sessaoId: string, itemId: string) => Promise<void>;

  // Observações
  adicionarObservacao: (
    entidadeId: string,
    entidadeTipo: EntidadeTipo,
    texto: string,
  ) => Promise<Observacao>;

  // Consultas auxiliares
  getPedidoPorId: (id: string) => Pedido | undefined;
  getTarefasPorPedido: (pedidoId: string) => Tarefa[];
  getPendenciaAtual: (tarefaId: string) => Pendencia | undefined;
  getChecklistPorTarefa: (tarefaId: string) => Checklist | undefined;
  getSessoesPorTarefa: (tarefaId: string) => Sessao[];
  getHistoricoPorEntidade: (entidadeId: string) => KanbanState['historico'];
  getObservacoesPorEntidade: (entidadeId: string) => Observacao[];
}

export const KanbanContext = createContext<KanbanContextValue | undefined>(undefined);

interface KanbanProviderProps {
  children: React.ReactNode;
}

export function KanbanProvider({ children }: KanbanProviderProps) {
  const [state, dispatch] = useReducer(kanbanReducer, estadoInicial);
  const { usuarioAtual } = useAuth();
  const nomeUsuario = usuarioAtual?.nome ?? USUARIO_FALLBACK;

  // Carrega todos os dados persistidos na inicialização e, depois,
  // atualiza silenciosamente em segundo plano a cada poucos segundos
  // — assim mudanças feitas por outros usuários aparecem sozinhas,
  // sem precisar recarregar a página.
  useEffect(() => {
    let cancelado = false;

    async function carregar(silencioso: boolean) {
      try {
        const [pedidos, tarefas, pendencias, checklists, sessoes, historico, observacoes] =
          await Promise.all([
            pedidosStorage.getAll(),
            tarefasStorage.getAll(),
            pendenciasStorage.getAll(),
            checklistsStorage.getAll(),
            sessoesStorage.getAll(),
            historicoStorage.getAll(),
            observacoesStorage.getAll(),
          ]);

        if (cancelado) return;

        dispatch({
          type: 'CARREGAR_DADOS_INICIAIS',
          payload: { pedidos, tarefas, pendencias, checklists, sessoes, historico, observacoes },
        });
      } catch (erro) {
        if (cancelado) return;
        console.error('[KanbanProvider] Falha ao carregar dados da API:', erro);
        // Uma falha numa atualização silenciosa em segundo plano não
        // deve derrubar o quadro inteiro numa tela de erro — só a
        // carga inicial faz isso.
        if (!silencioso) {
          dispatch({
            type: 'SET_ERRO',
            payload:
              'Não foi possível conectar à API do backend (MongoDB). Tente novamente em instantes.',
          });
          dispatch({ type: 'SET_CARREGANDO', payload: false });
        }
      }
    }

    carregar(false);

    const intervalo = window.setInterval(() => carregar(true), INTERVALO_ATUALIZACAO_MS);

    return () => {
      cancelado = true;
      window.clearInterval(intervalo);
    };
  }, []);

  const registrarHistorico = useCallback(
    async (
      entidadeId: string,
      entidadeTipo: EntidadeTipo,
      acao: AcaoHistorico,
      descricao: string,
      metadados?: Record<string, unknown>,
    ) => {
      const entrada = {
        id: gerarId('hist'),
        entidadeId,
        entidadeTipo,
        acao,
        descricao,
        usuario: nomeUsuario,
        data: agoraISO(),
        metadados,
      };
      await historicoStorage.create(entrada);
      dispatch({ type: 'ADD_HISTORICO', payload: entrada });
    },
    [nomeUsuario],
  );

  const criarPedido = useCallback(
    async (dados: CriarPedidoInput): Promise<Pedido> => {
      const agora = agoraISO();
      const pedido: Pedido = {
        id: gerarId('pedido'),
        numero: dados.numero,
        origem: dados.origem,
        destino: dados.destino,
        valorFrete: dados.valorFrete,
        outrasInformacoes: dados.outrasInformacoes,
        observacoesGerais: dados.observacoesGerais,
        status: 'ativo',
        criadoEm: agora,
        atualizadoEm: agora,
      };

      await pedidosStorage.create(pedido);
      dispatch({ type: 'ADD_PEDIDO', payload: pedido });

      // Todo novo pedido inicia automaticamente sua primeira tarefa
      // na primeira coluna do fluxo, subcoluna "A Fazer".
      const tarefa: Tarefa = {
        id: gerarId('tarefa'),
        pedidoId: pedido.id,
        columnId: PRIMEIRA_COLUNA,
        subColumnId: 'a-fazer',
        titulo: `Pedido ${pedido.numero} — ${pedido.origem} → ${pedido.destino}`,
        descricao: '',
        pendente: false,
        criadoPor: nomeUsuario,
        subColunaDesde: agora,
        criadoEm: agora,
        atualizadoEm: agora,
      };

      await tarefasStorage.create(tarefa);
      dispatch({ type: 'ADD_TAREFA', payload: tarefa });

      await registrarHistorico(pedido.id, 'pedido', 'criacao', `Pedido ${pedido.numero} criado.`);
      await registrarHistorico(
        tarefa.id,
        'tarefa',
        'criacao',
        `Tarefa criada na coluna "Prospecção de Motorista".`,
      );

      return pedido;
    },
    [registrarHistorico, nomeUsuario],
  );

  const atualizarPedido = useCallback(
    async (pedidoId: string, alteracoes: Partial<Pedido>) => {
      const atualizado = await pedidosStorage.update(pedidoId, {
        ...alteracoes,
        atualizadoEm: agoraISO(),
      });
      if (atualizado) {
        dispatch({ type: 'UPDATE_PEDIDO', payload: atualizado });
        await registrarHistorico(pedidoId, 'pedido', 'edicao', 'Dados do pedido atualizados.');
      }
    },
    [registrarHistorico],
  );

  const atualizarTarefa = useCallback(async (tarefaId: string, alteracoes: Partial<Tarefa>) => {
    const atualizado = await tarefasStorage.update(tarefaId, {
      ...alteracoes,
      atualizadoEm: agoraISO(),
    });
    if (atualizado) {
      dispatch({ type: 'UPDATE_TAREFA', payload: atualizado });
    }
  }, []);

  const atualizarDadosEtapa = useCallback(
    async (tarefaId: string, coluna: ColumnId, dados: Record<string, unknown>) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa) return;

      const dadosEtapaAtualizados = {
        ...(tarefa.dadosEtapa ?? {}),
        [coluna]: { ...(tarefa.dadosEtapa?.[coluna] ?? {}), ...dados },
      };

      await atualizarTarefa(tarefaId, { dadosEtapa: dadosEtapaAtualizados });
    },
    [state.tarefas, atualizarTarefa],
  );

  const avancarParaColuna = useCallback(
    async (
      tarefaId: string,
      novaColuna: ColumnId,
      novaSubColuna: SubColumnId = 'a-fazer',
      descricaoHistorico?: string,
    ) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa) return;

      const agora = agoraISO();
      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        columnId: novaColuna,
        subColumnId: novaSubColuna,
        // Guarda de onde a tarefa está saindo, para que o botão
        // "Retificar" saiba exatamente para onde devolvê-la depois.
        colunaAnterior: tarefa.columnId,
        // Libera a tarefa para o próximo responsável assumir na nova coluna.
        fazendoPor: undefined,
        // A marcação de urgência vale só para a etapa em que foi
        // sinalizada — assim que a tarefa é "pega" e avança para a
        // próxima etapa, a demarcação sai.
        urgente: false,
        // Qualquer retificação pendente é considerada resolvida ao
        // avançar de coluna — independente de qual coluna a tarefa
        // tenha sido devolvida (o botão "Retificar" agora funciona em
        // qualquer "A Fazer", não só na etapa "Guia").
        retificacao: undefined,
        // Reinicia o temporizador da subcoluna a cada avanço de etapa.
        subColunaDesde: agora,
        atualizadoEm: agora,
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      const nomeColuna = COLUNAS.find((c) => c.id === novaColuna)?.titulo ?? novaColuna;
      await registrarHistorico(
        tarefaId,
        'tarefa',
        'movimentacao',
        descricaoHistorico ?? `Tarefa avançou para a coluna "${nomeColuna}".`,
      );
    },
    [state.tarefas, registrarHistorico],
  );

  const enviarParaRetificacao = useCallback(
    async (tarefaId: string, colunaOrigem: ColumnId, motivo: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa) return;

      const agora = agoraISO();
      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        columnId: colunaOrigem,
        subColumnId: 'a-fazer',
        colunaAnterior: tarefa.columnId,
        fazendoPor: undefined,
        subColunaDesde: agora,
        retificacao: { motivo, colunaOrigem, criadoEm: agora },
        atualizadoEm: agora,
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      const nomeColuna = COLUNAS.find((c) => c.id === colunaOrigem)?.titulo ?? colunaOrigem;
      await registrarHistorico(
        tarefaId,
        'tarefa',
        'movimentacao',
        `Retificação: "${motivo}". Tarefa retornou para "${nomeColuna}" (A Fazer).`,
      );

      notificar('A Retificar', 'aviso');
    },
    [state.tarefas, registrarHistorico],
  );

  const limparRetificacao = useCallback(async (tarefaId: string) => {
    const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
      retificacao: undefined,
      atualizadoEm: agoraISO(),
    });
    if (tarefaAtualizada) {
      dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
    }
  }, []);

  const finalizarPedido = useCallback(
    async (tarefaId: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa) return;

      const agora = agoraISO();

      const dadosEtapaAtualizados = {
        ...(tarefa.dadosEtapa ?? {}),
        [tarefa.columnId]: {
          ...(tarefa.dadosEtapa?.[tarefa.columnId] ?? {}),
          finalizadoEm: agora,
        },
      };

      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        dadosEtapa: dadosEtapaAtualizados,
        atualizadoEm: agora,
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      const pedidoAtualizado = await pedidosStorage.update(tarefa.pedidoId, {
        status: 'finalizado',
        atualizadoEm: agora,
      });
      if (pedidoAtualizado) {
        dispatch({ type: 'UPDATE_PEDIDO', payload: pedidoAtualizado });
      }

      await registrarHistorico(tarefaId, 'tarefa', 'finalizacao', 'Tarefa finalizada.');
      await registrarHistorico(tarefa.pedidoId, 'pedido', 'finalizacao', 'Pedido finalizado.');
      notificar('Pedido finalizado com sucesso!', 'sucesso');
    },
    [state.tarefas, registrarHistorico],
  );

  const moverTarefa = useCallback(
    (tarefaId: string, destino: DestinoMovimentacao): ResultadoRegra => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa) return { permitido: false, motivo: 'Tarefa não encontrada.' };

      const resultado = podeMoverTarefa(tarefa, destino);
      if (!resultado.permitido) return resultado;

      const tarefaAtualizada: Tarefa = {
        ...tarefa,
        columnId: destino.columnId,
        subColumnId: destino.subColumnId,
        // Único movimento de drag permitido é A Fazer -> Fazendo; marca
        // quem assumiu a tarefa neste exato momento.
        fazendoPor: destino.subColumnId === 'fazendo' ? nomeUsuario : tarefa.fazendoPor,
        // Reinicia o temporizador: a tarefa acabou de entrar nesta subcoluna.
        subColunaDesde: agoraISO(),
        atualizadoEm: agoraISO(),
      };

      tarefasStorage.update(tarefaId, tarefaAtualizada);
      dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });

      registrarHistorico(
        tarefaId,
        'tarefa',
        'movimentacao',
        `Tarefa movida para a subcoluna "${destino.subColumnId === 'a-fazer' ? 'A Fazer' : 'Fazendo'}"${
          destino.subColumnId === 'fazendo' ? ` por ${nomeUsuario}` : ''
        }.`,
      );

      return resultado;
    },
    [state.tarefas, registrarHistorico, nomeUsuario],
  );

  const marcarPendente = useCallback(
    async (tarefaId: string, texto: string) => {
      const pendencia: Pendencia = {
        id: gerarId('pendencia'),
        tarefaId,
        motivo: texto,
        resolvida: false,
        criadoEm: agoraISO(),
      };

      await pendenciasStorage.create(pendencia);
      dispatch({ type: 'ADD_PENDENCIA', payload: pendencia });

      // A tarefa sai do quadro (deixa de aparecer em "A Fazer"/"Fazendo")
      // e passa a existir apenas na caixa "Pendentes" da própria coluna.
      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        pendente: true,
        pendenciaAtualId: pendencia.id,
        atualizadoEm: agoraISO(),
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      await registrarHistorico(tarefaId, 'tarefa', 'pendencia-criada', 'Tarefa marcada como pendente.');
    },
    [registrarHistorico],
  );

  const editarPendencia = useCallback(
    async (tarefaId: string, novoTexto: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa || !tarefa.pendenciaAtualId) return;

      const pendenciaAtualizada = await pendenciasStorage.update(tarefa.pendenciaAtualId, {
        motivo: novoTexto,
      });
      if (pendenciaAtualizada) {
        dispatch({ type: 'UPDATE_PENDENCIA', payload: pendenciaAtualizada });
      }

      await registrarHistorico(tarefaId, 'tarefa', 'edicao', 'Texto da pendência atualizado.');
    },
    [state.tarefas, registrarHistorico],
  );

  const alternarUrgencia = useCallback(
    async (tarefaId: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      // A urgência só pode ser marcada/desmarcada enquanto a tarefa
      // está em "A Fazer" — uma vez em "Fazendo", o botão fica oculto.
      if (!tarefa || tarefa.subColumnId !== 'a-fazer') return;

      const novoValor = !tarefa.urgente;
      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        urgente: novoValor,
        atualizadoEm: agoraISO(),
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      await registrarHistorico(
        tarefaId,
        'tarefa',
        'edicao',
        novoValor ? 'Tarefa marcada como urgente.' : 'Marcação de urgência removida.',
      );
    },
    [state.tarefas, registrarHistorico],
  );

  const resolverPendente = useCallback(
    async (tarefaId: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);
      if (!tarefa || !tarefa.pendenciaAtualId) return;

      const pendenciaId = tarefa.pendenciaAtualId;

      // A "Pendência Finalizada" apaga automaticamente o texto da
      // pendência: o registro é removido por completo, em vez de
      // apenas marcado como resolvido.
      await pendenciasStorage.remove(pendenciaId);
      dispatch({ type: 'REMOVE_PENDENCIA', payload: { id: pendenciaId } });

      // Retorna exatamente para a coluna de origem, sempre na
      // subcoluna "Fazendo" — nunca para "A Fazer". Quem finaliza a
      // pendência assume o "Fazendo" da tarefa a partir de agora.
      const tarefaAtualizada = await tarefasStorage.update(tarefaId, {
        pendente: false,
        pendenciaAtualId: undefined,
        subColumnId: 'fazendo',
        fazendoPor: nomeUsuario,
        subColunaDesde: agoraISO(),
        atualizadoEm: agoraISO(),
      });
      if (tarefaAtualizada) {
        dispatch({ type: 'UPDATE_TAREFA', payload: tarefaAtualizada });
      }

      await registrarHistorico(
        tarefaId,
        'tarefa',
        'pendencia-resolvida',
        'Pendência finalizada. Tarefa retornou para "Fazendo".',
      );
    },
    [state.tarefas, registrarHistorico, nomeUsuario],
  );

  const excluirTarefa = useCallback(
    async (tarefaId: string) => {
      const tarefa = state.tarefas.find((t) => t.id === tarefaId);

      // Remove também a pendência em aberto associada, se existir,
      // para não deixar registros órfãos.
      if (tarefa?.pendenciaAtualId) {
        await pendenciasStorage.remove(tarefa.pendenciaAtualId);
        dispatch({ type: 'REMOVE_PENDENCIA', payload: { id: tarefa.pendenciaAtualId } });
      }

      // Remove também os anexos (arquivos no GridFS) vinculados à
      // tarefa, para não deixar binários órfãos no MongoDB.
      try {
        const anexos = await anexosService.listarPorTarefa(tarefaId);
        await Promise.all(anexos.map((anexo) => anexosService.excluir(anexo.id)));
      } catch (erro) {
        console.error('[KanbanProvider] Falha ao excluir anexos da tarefa:', erro);
      }

      await tarefasStorage.remove(tarefaId);
      dispatch({ type: 'REMOVE_TAREFA', payload: { id: tarefaId } });
      await registrarHistorico(tarefaId, 'tarefa', 'exclusao', 'Tarefa excluída.');
    },
    [state.tarefas, registrarHistorico],
  );

  const adicionarObservacao = useCallback(
    async (entidadeId: string, entidadeTipo: EntidadeTipo, texto: string) => {
      const observacao: Observacao = {
        id: gerarId('obs'),
        entidadeId,
        entidadeTipo,
        texto,
        autor: nomeUsuario,
        criadoEm: agoraISO(),
      };

      await observacoesStorage.create(observacao);
      dispatch({ type: 'ADD_OBSERVACAO', payload: observacao });
      await registrarHistorico(entidadeId, entidadeTipo, 'observacao-adicionada', 'Observação adicionada.');

      return observacao;
    },
    [registrarHistorico, nomeUsuario],
  );

  const criarSessao = useCallback(
    async (dados: CriarSessaoInput): Promise<Sessao> => {
      const agora = agoraISO();
      const sessao: Sessao = {
        id: gerarId('sessao'),
        tarefaId: dados.tarefaId,
        titulo: dados.titulo,
        itens: dados.itens.map((descricao) => ({
          id: gerarId('sessao-item'),
          descricao,
          concluido: false,
        })),
        usuario: nomeUsuario,
        inicio: agora,
      };

      await sessoesStorage.create(sessao);
      dispatch({ type: 'ADD_SESSAO', payload: sessao });
      await registrarHistorico(
        dados.tarefaId,
        'tarefa',
        'criacao',
        `Sessão "${dados.titulo}" criada com ${sessao.itens.length} passo(s).`,
      );

      return sessao;
    },
    [registrarHistorico, nomeUsuario],
  );

  const alternarItemSessao = useCallback(
    async (sessaoId: string, itemId: string) => {
      const sessao = state.sessoes.find((s) => s.id === sessaoId);
      if (!sessao) return;

      const agora = agoraISO();
      const itensAtualizados = sessao.itens.map((item) =>
        item.id === itemId
          ? { ...item, concluido: !item.concluido, concluidoEm: !item.concluido ? agora : undefined }
          : item,
      );

      // Quando todos os itens estiverem concluídos, marca o fim da sessão;
      // se algum item voltar a ficar pendente, o fim é desfeito.
      const todosConcluidos = itensAtualizados.every((item) => item.concluido);

      const sessaoAtualizada = await sessoesStorage.update(sessaoId, {
        itens: itensAtualizados,
        fim: todosConcluidos ? agora : undefined,
      });
      if (sessaoAtualizada) {
        dispatch({ type: 'UPDATE_SESSAO', payload: sessaoAtualizada });
      }
    },
    [state.sessoes],
  );

  // Consultas auxiliares.
  const getPedidoPorId = useCallback(
    (id: string) => state.pedidos.find((p) => p.id === id),
    [state.pedidos],
  );

  const getTarefasPorPedido = useCallback(
    (pedidoId: string) => state.tarefas.filter((t) => t.pedidoId === pedidoId),
    [state.tarefas],
  );

  const getPendenciaAtual = useCallback(
    (tarefaId: string) => state.pendencias.find((p) => p.tarefaId === tarefaId && !p.resolvida),
    [state.pendencias],
  );

  const getChecklistPorTarefa = useCallback(
    (tarefaId: string) => state.checklists.find((c) => c.tarefaId === tarefaId),
    [state.checklists],
  );

  const getSessoesPorTarefa = useCallback(
    (tarefaId: string) => state.sessoes.filter((s) => s.tarefaId === tarefaId),
    [state.sessoes],
  );

  const getHistoricoPorEntidade = useCallback(
    (entidadeId: string) => state.historico.filter((h) => h.entidadeId === entidadeId),
    [state.historico],
  );

  const getObservacoesPorEntidade = useCallback(
    (entidadeId: string) => state.observacoes.filter((o) => o.entidadeId === entidadeId),
    [state.observacoes],
  );

  const value = useMemo<KanbanContextValue>(
    () => ({
      ...state,
      criarPedido,
      atualizarPedido,
      moverTarefa,
      marcarPendente,
      editarPendencia,
      alternarUrgencia,
      resolverPendente,
      excluirTarefa,
      atualizarTarefa,
      atualizarDadosEtapa,
      avancarParaColuna,
      enviarParaRetificacao,
      limparRetificacao,
      finalizarPedido,
      criarSessao,
      alternarItemSessao,
      adicionarObservacao,
      getPedidoPorId,
      getTarefasPorPedido,
      getPendenciaAtual,
      getChecklistPorTarefa,
      getSessoesPorTarefa,
      getHistoricoPorEntidade,
      getObservacoesPorEntidade,
    }),
    [
      state,
      criarPedido,
      atualizarPedido,
      moverTarefa,
      marcarPendente,
      editarPendencia,
      alternarUrgencia,
      resolverPendente,
      excluirTarefa,
      atualizarTarefa,
      atualizarDadosEtapa,
      avancarParaColuna,
      enviarParaRetificacao,
      limparRetificacao,
      finalizarPedido,
      criarSessao,
      alternarItemSessao,
      adicionarObservacao,
      getPedidoPorId,
      getTarefasPorPedido,
      getPendenciaAtual,
      getChecklistPorTarefa,
      getSessoesPorTarefa,
      getHistoricoPorEntidade,
      getObservacoesPorEntidade,
    ],
  );

  return <KanbanContext.Provider value={value}>{children}</KanbanContext.Provider>;
}
