import { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { Button } from '@/components/common/Button';
import type { FiltroColuna } from '@/services/rules/filtroTarefas';
import './FormFields.css';

interface ColumnFilterModalProps {
  aberto: boolean;
  colunaTitulo: string;
  filtroAtual: FiltroColuna;
  opcoesNumeroPedido: string[];
  opcoesCriadoPor: string[];
  opcoesMotorista: string[];
  opcoesRota: string[];
  onFechar: () => void;
  onAplicar: (filtro: FiltroColuna) => void;
}

export function ColumnFilterModal({
  aberto,
  colunaTitulo,
  filtroAtual,
  opcoesNumeroPedido,
  opcoesCriadoPor,
  opcoesMotorista,
  opcoesRota,
  onFechar,
  onAplicar,
}: ColumnFilterModalProps) {
  const [numeroPedido, setNumeroPedido] = useState(filtroAtual.numeroPedido ?? '');
  const [criadoPor, setCriadoPor] = useState(filtroAtual.criadoPor ?? '');
  const [motorista, setMotorista] = useState(filtroAtual.motorista ?? '');
  const [rota, setRota] = useState(filtroAtual.rota ?? '');

  // Sincroniza os campos sempre que o modal é reaberto.
  useEffect(() => {
    if (!aberto) return;
    setNumeroPedido(filtroAtual.numeroPedido ?? '');
    setCriadoPor(filtroAtual.criadoPor ?? '');
    setMotorista(filtroAtual.motorista ?? '');
    setRota(filtroAtual.rota ?? '');
  }, [aberto, filtroAtual]);

  function aoAplicar() {
    onAplicar({
      numeroPedido: numeroPedido || undefined,
      criadoPor: criadoPor || undefined,
      motorista: motorista || undefined,
      rota: rota || undefined,
    });
    onFechar();
  }

  function aoLimpar() {
    onAplicar({});
    onFechar();
  }

  const semTarefas =
    opcoesNumeroPedido.length === 0 &&
    opcoesCriadoPor.length === 0 &&
    opcoesMotorista.length === 0 &&
    opcoesRota.length === 0;

  return (
    <Modal
      titulo={`Filtrar — ${colunaTitulo}`}
      aberto={aberto}
      onFechar={onFechar}
      largura="sm"
      rodape={
        <>
          <Button variante="ghost" onClick={aoLimpar}>
            Limpar filtro
          </Button>
          <Button variante="primary" onClick={aoAplicar}>
            Aplicar filtro
          </Button>
        </>
      }
    >
      {semTarefas ? (
        <p className="form-hint">Nenhuma tarefa nesta coluna ainda para filtrar.</p>
      ) : (
        <>
          <div className="form-field">
            <label htmlFor="filtro-numero-pedido">Número do Pedido</label>
            <select
              id="filtro-numero-pedido"
              value={numeroPedido}
              onChange={(e) => setNumeroPedido(e.target.value)}
            >
              <option value="">Todos</option>
              {opcoesNumeroPedido.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filtro-criado-por">Usuário que criou</label>
            <select
              id="filtro-criado-por"
              value={criadoPor}
              onChange={(e) => setCriadoPor(e.target.value)}
            >
              <option value="">Todos</option>
              {opcoesCriadoPor.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filtro-motorista">Motorista</label>
            <select id="filtro-motorista" value={motorista} onChange={(e) => setMotorista(e.target.value)}>
              <option value="">Todos</option>
              {opcoesMotorista.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </div>

          <div className="form-field">
            <label htmlFor="filtro-rota">Rota</label>
            <select id="filtro-rota" value={rota} onChange={(e) => setRota(e.target.value)}>
              <option value="">Todas</option>
              {opcoesRota.map((valor) => (
                <option key={valor} value={valor}>
                  {valor}
                </option>
              ))}
            </select>
          </div>
        </>
      )}
    </Modal>
  );
}
