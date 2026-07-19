import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import type { StageFormProps } from './registry';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

type TipoMotorista = 'frota' | 'terceiro';

const ITENS_CANDIDATOS_TERCEIRO = [
  'Fazer Monitoramento',
  'Solicitar Ordem de Carregamento',
  'Cadastro Komando',
  'Cadastro Bounny',
  'Cadastro Otnet',
  'Cadastro Rodopar',
];

const ITENS_CANDIDATOS_FROTA = ['Fazer Monitoramento', 'Solicitar Ordem de Carregamento'];

interface DadosProspeccao {
  [chave: string]: unknown;
  tipoMotorista: TipoMotorista;
  nomeMotorista: string;
  conjuntoPlacas: string;
  valorFreteAcordado?: number;
  avaliacaoToxicologica?: boolean;
  earNaCarteira?: boolean;
  /** Itens marcados no checklist de seleção — só esses serão "solicitados" nas próximas etapas. */
  itensSolicitados: string[];
}

export function ProspeccaoMotoristaForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosProspeccao | undefined;

  const [fase, setFase] = useState<'form' | 'concluido'>(dadosSalvos ? 'concluido' : 'form');
  const [tipoMotorista, setTipoMotorista] = useState<TipoMotorista | null>(
    dadosSalvos?.tipoMotorista ?? null,
  );
  const [nomeMotorista, setNomeMotorista] = useState(dadosSalvos?.nomeMotorista ?? '');
  const [conjuntoPlacas, setConjuntoPlacas] = useState(dadosSalvos?.conjuntoPlacas ?? '');
  const [valorFreteAcordado, setValorFreteAcordado] = useState(
    dadosSalvos?.valorFreteAcordado != null ? String(dadosSalvos.valorFreteAcordado) : '',
  );
  const [avaliacaoToxicologica, setAvaliacaoToxicologica] = useState(
    dadosSalvos?.avaliacaoToxicologica ?? false,
  );
  const [earNaCarteira, setEarNaCarteira] = useState(dadosSalvos?.earNaCarteira ?? false);
  const [enviando, setEnviando] = useState(false);
  const [avancando, setAvancando] = useState(false);

  // Checklist de seleção: quais passos operacionais realmente se
  // aplicam a esta tarefa. Só os marcados aqui serão "solicitados"
  // novamente nas próximas etapas (ex.: "Fazer Monitoramento" em
  // "Carregamento/Documentação", "Ordem de Carregamento" em
  // "Agendamento"). Para Frota, todos vêm marcados por padrão
  // (comportamento anterior preservado); para Terceiro, todos vêm
  // desmarcados por padrão — a pessoa escolhe o que de fato pedir.
  const itensCandidatos = tipoMotorista === 'terceiro' ? ITENS_CANDIDATOS_TERCEIRO : ITENS_CANDIDATOS_FROTA;
  const [itensSelecionados, setItensSelecionados] = useState<Record<string, boolean>>(() => {
    if (dadosSalvos?.itensSolicitados && dadosSalvos.tipoMotorista) {
      const candidatosSalvos =
        dadosSalvos.tipoMotorista === 'terceiro' ? ITENS_CANDIDATOS_TERCEIRO : ITENS_CANDIDATOS_FROTA;
      return Object.fromEntries(
        candidatosSalvos.map((item) => [item, dadosSalvos.itensSolicitados.includes(item)]),
      );
    }
    return {};
  });

  function alternarItemSelecionado(item: string, marcado: boolean) {
    setItensSelecionados((atual) => ({ ...atual, [item]: marcado }));
  }

  function estaMarcado(item: string): boolean {
    if (item in itensSelecionados) return itensSelecionados[item];
    // Item ainda não tocado pela pessoa nesta sessão do formulário:
    // aplica o padrão por tipo (Frota = marcado, Terceiro = desmarcado).
    return tipoMotorista === 'frota';
  }

  const camposObrigatoriosPreenchidos =
    tipoMotorista !== null &&
    nomeMotorista.trim() !== '' &&
    conjuntoPlacas.trim() !== '' &&
    (tipoMotorista === 'frota' || valorFreteAcordado.trim() !== '');

  async function aoSubmeter() {
    if (!tipoMotorista || !camposObrigatoriosPreenchidos || enviando) return;
    setEnviando(true);

    try {
      const itensSolicitados = itensCandidatos.filter((item) => estaMarcado(item));

      const dadosEtapa: DadosProspeccao = {
        tipoMotorista,
        nomeMotorista: nomeMotorista.trim(),
        conjuntoPlacas: conjuntoPlacas.trim(),
        itensSolicitados,
        ...(tipoMotorista === 'terceiro'
          ? {
              valorFreteAcordado: Number(valorFreteAcordado),
              avaliacaoToxicologica,
              earNaCarteira,
            }
          : {}),
      };

      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, dadosEtapa);
      setFase('concluido');
    } finally {
      setEnviando(false);
    }
  }

  async function aoAvancarProximaEtapa() {
    if (avancando) return;
    setAvancando(true);
    try {
      await avancarParaColuna(tarefa.id, 'cadastramento', 'a-fazer');
      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  if (fase === 'concluido' && dadosSalvos) {
    return (
      <div className="prospeccao-form">
        <p className="prospeccao-form__success">
          Dados da prospecção salvos. Quando estiver pronto, clique em "Próxima Etapa" para
          avançar para "Cadastramento".
        </p>

        <AnexosPanel tarefaId={tarefa.id} />

        <div className="prospeccao-form__footer">
          <Button variante="ghost" onClick={() => setFase('form')}>
            Editar dados
          </Button>
          <Button variante="primary" onClick={aoAvancarProximaEtapa} disabled={avancando}>
            {avancando ? 'Avançando...' : 'Próxima Etapa'}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="prospeccao-form">
      <div className="prospeccao-form__tipo">
        <span className="prospeccao-form__tipo-label">Tipo de motorista *</span>
        <div className="prospeccao-form__tipo-botoes">
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${tipoMotorista === 'frota' ? 'is-selected' : ''}`}
            onClick={() => setTipoMotorista('frota')}
          >
            Frota
          </button>
          <button
            type="button"
            className={`prospeccao-form__tipo-botao ${tipoMotorista === 'terceiro' ? 'is-selected' : ''}`}
            onClick={() => setTipoMotorista('terceiro')}
          >
            Terceiro
          </button>
        </div>
      </div>

      {tipoMotorista && (
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="prospeccao-nome">Nome do motorista *</label>
            <input
              id="prospeccao-nome"
              type="text"
              value={nomeMotorista}
              onChange={(e) => setNomeMotorista(e.target.value)}
              placeholder="Nome completo"
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="prospeccao-placas">Conjunto de placas *</label>
            <input
              id="prospeccao-placas"
              type="text"
              value={conjuntoPlacas}
              onChange={(e) => setConjuntoPlacas(e.target.value.toUpperCase())}
              placeholder="Ex.: ABC1D23 / XYZ9K87"
            />
          </div>

          {tipoMotorista === 'terceiro' && (
            <>
              <div className="form-field">
                <label htmlFor="prospeccao-valor">Valor de frete acordado *</label>
                <input
                  id="prospeccao-valor"
                  type="number"
                  min="0"
                  step="0.01"
                  value={valorFreteAcordado}
                  onChange={(e) => setValorFreteAcordado(e.target.value)}
                  placeholder="0,00"
                />
              </div>

              <div className="form-field form-field--full">
                <StatusCheckField
                  label="Avaliação Toxicológico"
                  checked={avaliacaoToxicologica}
                  onChange={setAvaliacaoToxicologica}
                />
              </div>

              <div className="form-field form-field--full">
                <StatusCheckField
                  label="EAR na Carteira"
                  checked={earNaCarteira}
                  onChange={setEarNaCarteira}
                />
              </div>
            </>
          )}
        </div>
      )}

      {tipoMotorista && (
        <div className="prospeccao-form__checklist-selecao">
          <span className="prospeccao-form__tipo-label">
            Checklist — marque o que precisa ser solicitado nas próximas etapas
          </span>
          <div className="status-check-list">
            {itensCandidatos.map((item) => (
              <StatusCheckField
                key={item}
                label={item}
                checked={estaMarcado(item)}
                onChange={(marcado) => alternarItemSelecionado(item, marcado)}
                rotuloMarcado="Solicitar"
              />
            ))}
          </div>
          <p className="form-hint">
            Só os itens marcados aqui serão solicitados novamente nas próximas etapas do Kanban.
          </p>
        </div>
      )}

      <div className="prospeccao-form__footer">
        <Button
          variante="primary"
          onClick={aoSubmeter}
          disabled={!camposObrigatoriosPreenchidos || enviando}
        >
          {enviando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
