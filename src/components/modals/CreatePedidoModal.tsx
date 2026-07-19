import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import { useKanban } from '@/hooks/useKanban';
import type { CriarPedidoInput } from '@/types';
import './FormFields.css';

interface CreatePedidoModalProps {
  aberto: boolean;
  onFechar: () => void;
}

interface FormState {
  numero: string;
  origem: string;
  destino: string;
  valorFrete: string;
  outrasInformacoes: string;
  observacoesGerais: string;
}

const VALORES_INICIAIS: FormState = {
  numero: '',
  origem: '',
  destino: '',
  valorFrete: '',
  outrasInformacoes: '',
  observacoesGerais: '',
};

export function CreatePedidoModal({ aberto, onFechar }: CreatePedidoModalProps) {
  const { criarPedido } = useKanban();
  const [dados, setDados] = useState<FormState>(VALORES_INICIAIS);
  const [enviando, setEnviando] = useState(false);

  const obrigatoriosPreenchidos =
    dados.numero.trim() && dados.origem.trim() && dados.destino.trim();

  function atualizarCampo<K extends keyof FormState>(campo: K, valor: FormState[K]) {
    setDados((anterior) => ({ ...anterior, [campo]: valor }));
  }

  function aoFechar() {
    setDados(VALORES_INICIAIS);
    onFechar();
  }

  async function aoSubmeter() {
    if (!obrigatoriosPreenchidos || enviando) return;

    setEnviando(true);
    try {
      const valorFreteNumerico = dados.valorFrete.trim()
        ? Number(dados.valorFrete.replace(',', '.'))
        : undefined;

      const entrada: CriarPedidoInput = {
        numero: dados.numero.trim(),
        origem: dados.origem.trim(),
        destino: dados.destino.trim(),
        valorFrete:
          valorFreteNumerico !== undefined && !Number.isNaN(valorFreteNumerico)
            ? valorFreteNumerico
            : undefined,
        outrasInformacoes: dados.outrasInformacoes.trim() || undefined,
        observacoesGerais: dados.observacoesGerais.trim() || undefined,
      };

      await criarPedido(entrada);
      aoFechar();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      titulo="Criar pedido"
      aberto={aberto}
      onFechar={aoFechar}
      largura="md"
      rodape={
        <>
          <Button variante="ghost" onClick={aoFechar}>
            Cancelar
          </Button>
          <Button
            variante="primary"
            onClick={aoSubmeter}
            disabled={!obrigatoriosPreenchidos || enviando}
          >
            {enviando ? 'Criando...' : 'Criar pedido'}
          </Button>
        </>
      }
    >
      <div className="form-field">
        <label htmlFor="pedido-numero">Número do Pedido *</label>
        <input
          id="pedido-numero"
          type="text"
          value={dados.numero}
          onChange={(e) => atualizarCampo('numero', e.target.value)}
          placeholder="Ex.: 24500"
          autoFocus
        />
      </div>

      <fieldset className="form-fieldset">
        <legend>Rota *</legend>
        <div className="form-grid">
          <div className="form-field">
            <label htmlFor="pedido-origem">Origem</label>
            <input
              id="pedido-origem"
              type="text"
              value={dados.origem}
              onChange={(e) => atualizarCampo('origem', e.target.value)}
              placeholder="Cidade/UF de origem"
            />
          </div>

          <div className="form-field">
            <label htmlFor="pedido-destino">Destino</label>
            <input
              id="pedido-destino"
              type="text"
              value={dados.destino}
              onChange={(e) => atualizarCampo('destino', e.target.value)}
              placeholder="Cidade/UF de destino"
            />
          </div>
        </div>
      </fieldset>

      <div className="form-field">
        <label htmlFor="pedido-valor-frete">Valor do Frete</label>
        <div className="form-field__prefixed">
          <span className="form-field__prefix">R$</span>
          <input
            id="pedido-valor-frete"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            value={dados.valorFrete}
            onChange={(e) => atualizarCampo('valorFrete', e.target.value)}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className="form-field">
        <label htmlFor="pedido-outras-informacoes">Outras Informações</label>
        <textarea
          id="pedido-outras-informacoes"
          value={dados.outrasInformacoes}
          onChange={(e) => atualizarCampo('outrasInformacoes', e.target.value)}
          rows={3}
          placeholder="Informações complementares sobre o pedido"
        />
      </div>

      <div className="form-field">
        <label htmlFor="pedido-observacoes">Observações</label>
        <textarea
          id="pedido-observacoes"
          value={dados.observacoesGerais}
          onChange={(e) => atualizarCampo('observacoesGerais', e.target.value)}
          rows={3}
        />
      </div>

      <p className="form-hint">
        Ao salvar, uma tarefa será criada automaticamente na coluna "Prospecção de Motorista",
        subcoluna "A Fazer".
      </p>
    </Modal>
  );
}
