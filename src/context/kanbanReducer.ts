import type {
  Pedido,
  Tarefa,
  Pendencia,
  Checklist,
  Sessao,
  HistoricoEntry,
  Observacao,
} from '@/types';

export interface KanbanState {
  pedidos: Pedido[];
  tarefas: Tarefa[];
  pendencias: Pendencia[];
  checklists: Checklist[];
  sessoes: Sessao[];
  historico: HistoricoEntry[];
  observacoes: Observacao[];
  carregando: boolean;
  erro?: string;
}

export const estadoInicial: KanbanState = {
  pedidos: [],
  tarefas: [],
  pendencias: [],
  checklists: [],
  sessoes: [],
  historico: [],
  observacoes: [],
  carregando: true,
};

export type KanbanAction =
  | { type: 'CARREGAR_DADOS_INICIAIS'; payload: Omit<KanbanState, 'carregando' | 'erro'> }
  | { type: 'SET_CARREGANDO'; payload: boolean }
  | { type: 'SET_ERRO'; payload: string | undefined }
  | { type: 'ADD_PEDIDO'; payload: Pedido }
  | { type: 'UPDATE_PEDIDO'; payload: Pedido }
  | { type: 'ADD_TAREFA'; payload: Tarefa }
  | { type: 'UPDATE_TAREFA'; payload: Tarefa }
  | { type: 'REMOVE_TAREFA'; payload: { id: string } }
  | { type: 'ADD_PENDENCIA'; payload: Pendencia }
  | { type: 'UPDATE_PENDENCIA'; payload: Pendencia }
  | { type: 'REMOVE_PENDENCIA'; payload: { id: string } }
  | { type: 'ADD_CHECKLIST'; payload: Checklist }
  | { type: 'UPDATE_CHECKLIST'; payload: Checklist }
  | { type: 'ADD_SESSAO'; payload: Sessao }
  | { type: 'UPDATE_SESSAO'; payload: Sessao }
  | { type: 'ADD_HISTORICO'; payload: HistoricoEntry }
  | { type: 'ADD_OBSERVACAO'; payload: Observacao };

export function kanbanReducer(state: KanbanState, action: KanbanAction): KanbanState {
  switch (action.type) {
    case 'CARREGAR_DADOS_INICIAIS':
      return { ...state, ...action.payload, carregando: false, erro: undefined };

    case 'SET_CARREGANDO':
      return { ...state, carregando: action.payload };

    case 'SET_ERRO':
      return { ...state, erro: action.payload };

    case 'ADD_PEDIDO':
      return { ...state, pedidos: [...state.pedidos, action.payload] };

    case 'UPDATE_PEDIDO':
      return {
        ...state,
        pedidos: state.pedidos.map((p) => (p.id === action.payload.id ? action.payload : p)),
      };

    case 'ADD_TAREFA':
      return { ...state, tarefas: [...state.tarefas, action.payload] };

    case 'UPDATE_TAREFA':
      return {
        ...state,
        tarefas: state.tarefas.map((t) => (t.id === action.payload.id ? action.payload : t)),
      };

    case 'REMOVE_TAREFA':
      return {
        ...state,
        tarefas: state.tarefas.filter((t) => t.id !== action.payload.id),
      };

    case 'ADD_PENDENCIA':
      return { ...state, pendencias: [...state.pendencias, action.payload] };

    case 'UPDATE_PENDENCIA':
      return {
        ...state,
        pendencias: state.pendencias.map((p) =>
          p.id === action.payload.id ? action.payload : p,
        ),
      };

    case 'REMOVE_PENDENCIA':
      return {
        ...state,
        pendencias: state.pendencias.filter((p) => p.id !== action.payload.id),
      };

    case 'ADD_CHECKLIST':
      return { ...state, checklists: [...state.checklists, action.payload] };

    case 'UPDATE_CHECKLIST':
      return {
        ...state,
        checklists: state.checklists.map((c) =>
          c.id === action.payload.id ? action.payload : c,
        ),
      };

    case 'ADD_SESSAO':
      return { ...state, sessoes: [...state.sessoes, action.payload] };

    case 'UPDATE_SESSAO':
      return {
        ...state,
        sessoes: state.sessoes.map((s) => (s.id === action.payload.id ? action.payload : s)),
      };

    case 'ADD_HISTORICO':
      return { ...state, historico: [...state.historico, action.payload] };

    case 'ADD_OBSERVACAO':
      return { ...state, observacoes: [...state.observacoes, action.payload] };

    default:
      return state;
  }
}
