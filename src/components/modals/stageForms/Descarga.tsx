import { useState } from 'react';
import { useKanban } from '@/hooks/useKanban';
import { Button } from '@/components/common/Button';
import { StatusCheckField } from '@/components/common/StatusCheckField';
import type { StageFormProps } from './registry';
import { obterTipoMotorista } from './utils';
import '@/components/modals/FormFields.css';
import './StageFormsShared.css';

interface DadosDescarga {
  [chave: string]: unknown;
  canhotosEnviados?: boolean;
  descargaConcluida?: boolean;
  manifestoEncerrado?: boolean;
}

export function DescargaForm({ tarefa, onConcluir }: StageFormProps) {
  const { atualizarDadosEtapa, avancarParaColuna } = useKanban();

  const tipoMotorista = obterTipoMotorista(tarefa);
  const dadosSalvos = tarefa.dadosEtapa?.[tarefa.columnId] as DadosDescarga | undefined;

  const [canhotosEnviados, setCanhotosEnviados] = useState(dadosSalvos?.canhotosEnviados ?? false);
  const [descargaConcluida, setDescargaConcluida] = useState(
    dadosSalvos?.descargaConcluida ?? false,
  );
  const [manifestoEncerrado, setManifestoEncerrado] = useState(
    dadosSalvos?.manifestoEncerrado ?? false,
  );
  const [avancando, setAvancando] = useState(false);

  const podeAvancar = canhotosEnviados && descargaConcluida && manifestoEncerrado;

  async function aoAvancar() {
    if (!podeAvancar || avancando) return;
    setAvancando(true);
    try {
      const dadosEtapa: DadosDescarga = {
        canhotosEnviados,
        descargaConcluida,
        manifestoEncerrado,
      };
      await atualizarDadosEtapa(tarefa.id, tarefa.columnId, dadosEtapa);

      if (tipoMotorista === 'terceiro') {
        await avancarParaColuna(tarefa.id, 'saldo', 'a-fazer');
      } else {
        await avancarParaColuna(tarefa.id, 'historico-finalizacao', 'a-fazer');
      }

      onConcluir?.();
    } finally {
      setAvancando(false);
    }
  }

  return (
    <div className="prospeccao-form">
      <div className="status-check-list">
        <StatusCheckField
          label="Canhotos enviados"
          checked={canhotosEnviados}
          onChange={setCanhotosEnviados}
        />
        <StatusCheckField
          label="Descarga Concluída"
          checked={descargaConcluida}
          onChange={setDescargaConcluida}
        />
        <StatusCheckField
          label="Manifesto Encerrado"
          checked={manifestoEncerrado}
          onChange={setManifestoEncerrado}
        />
      </div>

      <div className="prospeccao-form__footer">
        <Button variante="primary" onClick={aoAvancar} disabled={!podeAvancar || avancando}>
          {avancando ? 'Avançando...' : 'Próxima Etapa'}
        </Button>
      </div>
    </div>
  );
}
