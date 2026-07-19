import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import { AnexosPanel } from '@/components/common/AnexosPanel';
import type { StageFormProps } from './registry';
import { obterTipoMotorista, foiSolicitadoNaProspeccao } from './utils';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosCadastramento {
  [chave: string]: unknown;
  komandoCadastro?: boolean;
  komandoAprovado?: boolean;
  bounnyCadastro?: boolean;
  bounnyAprovado?: boolean;
  otnetCadastro?: boolean;
  otnetAprovado?: boolean;
  rodoparCadastro?: boolean;
  placasValidadas?: boolean;
  /** "Solicita" que a etapa "Agendamento" peça a data/hora do carregamento. */
  agendamentoDeCarregamentoSolicitado?: boolean;
}

export function CadastramentoForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const tipoMotorista = obterTipoMotorista(tarefa);
  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosCadastramento | undefined;

  // No Cadastramento de Terceiro, só entram na lista os cadastros que
  // realmente foram marcados no checklist de seleção da "Prospecção
  // de Motorista" — o que não foi marcado lá não é solicitado aqui.
  const komandoSolicitado = foiSolicitadoNaProspeccao(tarefa, 'Cadastro Komando');
  const bounnySolicitado = foiSolicitadoNaProspeccao(tarefa, 'Cadastro Bounny');
  const otnetSolicitado = foiSolicitadoNaProspeccao(tarefa, 'Cadastro Otnet');
  const rodoparSolicitado = foiSolicitadoNaProspeccao(tarefa, 'Cadastro Rodopar');

  const [fase, setFase] = useState<'form' | 'concluido'>(dadosSalvos ? 'concluido' : 'form');
  const [komandoCadastro, setKomandoCadastro] = useState(dadosSalvos?.komandoCadastro ?? false);
  const [komandoAprovado, setKomandoAprovado] = useState(dadosSalvos?.komandoAprovado ?? false);
  const [bounnyCadastro, setBounnyCadastro] = useState(dadosSalvos?.bounnyCadastro ?? false);
  const [bounnyAprovado, setBounnyAprovado] = useState(dadosSalvos?.bounnyAprovado ?? false);
  const [otnetCadastro, setOtnetCadastro] = useState(dadosSalvos?.otnetCadastro ?? false);
  const [otnetAprovado, setOtnetAprovado] = useState(dadosSalvos?.otnetAprovado ?? false);
  const [rodoparCadastro, setRodoparCadastro] = useState(dadosSalvos?.rodoparCadastro ?? false);
  const [placasValidadas, setPlacasValidadas] = useState(dadosSalvos?.placasValidadas ?? false);
  const [agendamentoDeCarregamentoSolicitado, setAgendamentoDeCarregamentoSolicitado] = useState(
    dadosSalvos?.agendamentoDeCarregamentoSolicitado ?? false,
  );
  const [enviando, setEnviando] = useState(false);
  const [avancando, setAvancando] = useState(false);

  async function aoSubmeter() {
    if (enviando) return;
    setEnviando(true);

    try {
      const dadosEtapa: DadosCadastramento = {
        agendamentoDeCarregamentoSolicitado,
        ...(tipoMotorista === 'terceiro'
          ? {
              ...(komandoSolicitado ? { komandoCadastro, komandoAprovado } : {}),
              ...(bounnySolicitado ? { bounnyCadastro, bounnyAprovado } : {}),
              ...(otnetSolicitado ? { otnetCadastro, otnetAprovado } : {}),
              ...(rodoparSolicitado ? { rodoparCadastro } : {}),
            }
          : { placasValidadas }),
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
      await avancarParaColuna(tarefa.id, 'agendamento', 'a-fazer');
      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  if (fase === 'concluido' && dadosSalvos) {
    return (
      <div className="prospeccao-form">
        <p className="prospeccao-form__success">
          Dados do cadastramento salvos. Quando estiver pronto, clique em "Próxima Etapa" para
          avançar para "Agendamento".
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

  if (!tipoMotorista) {
    return (
      <p className="prospeccao-form__nota">
        Tipo de motorista não definido na etapa "Prospecção de Motorista". Volte para aquela etapa
        antes de continuar o cadastramento.
      </p>
    );
  }

  return (
    <div className="prospeccao-form">
      {tipoMotorista === 'terceiro' ? (
        <div className="status-check-list">
          {komandoSolicitado && (
            <>
              <StatusCheckField
                label="Fazer Cadastro Komando"
                checked={komandoCadastro}
                onChange={setKomandoCadastro}
              />
              <StatusCheckField
                label="Aprovado (Komando)"
                checked={komandoAprovado}
                onChange={setKomandoAprovado}
              />
            </>
          )}

          {bounnySolicitado && (
            <>
              <StatusCheckField
                label="Fazer Cadastro Bounny"
                checked={bounnyCadastro}
                onChange={setBounnyCadastro}
              />
              <StatusCheckField
                label="Aprovado (Bounny)"
                checked={bounnyAprovado}
                onChange={setBounnyAprovado}
              />
            </>
          )}

          {otnetSolicitado && (
            <>
              <StatusCheckField
                label="Fazer Cadastro Otnet"
                checked={otnetCadastro}
                onChange={setOtnetCadastro}
              />
              <StatusCheckField
                label="Aprovado (Otnet)"
                checked={otnetAprovado}
                onChange={setOtnetAprovado}
              />
            </>
          )}

          {rodoparSolicitado && (
            <StatusCheckField
              label="Fazer Cadastro Rodopar"
              checked={rodoparCadastro}
              onChange={setRodoparCadastro}
            />
          )}

          {!komandoSolicitado && !bounnySolicitado && !otnetSolicitado && !rodoparSolicitado && (
            <p className="prospeccao-form__nota">
              Nenhum cadastro (Komando, Bounny, Otnet ou Rodopar) foi solicitado na etapa
              "Prospecção de Motorista".
            </p>
          )}
        </div>
      ) : (
        <div className="status-check-list">
          <StatusCheckField
            label="Conjunto de placas validado para viagem"
            checked={placasValidadas}
            onChange={setPlacasValidadas}
          />
        </div>
      )}

      <div className="status-check-list">
        <StatusCheckField
          label="Agendamento de Carregamento"
          checked={agendamentoDeCarregamentoSolicitado}
          onChange={setAgendamentoDeCarregamentoSolicitado}
          rotuloMarcado="Solicitar"
        />
      </div>

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoSubmeter} disabled={enviando}>
          {enviando ? 'Salvando...' : 'Salvar'}
        </Button>
      </div>
    </div>
  );
}
