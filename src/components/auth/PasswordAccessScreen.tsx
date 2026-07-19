import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { ConfirmActionModal } from '@/components/modals/ConfirmActionModal';
import { authService } from '@/services/auth/authService';
import type { UsuarioComSenha } from '@/types';
import '@/components/modals/FormFields.css';

interface PasswordAccessScreenProps {
  onVoltar: () => void;
}

function formatarData(iso: string): string {
  return new Date(iso).toLocaleString('pt-BR');
}

export function PasswordAccessScreen({ onVoltar }: PasswordAccessScreenProps) {
  const [senhaMestre, setSenhaMestre] = useState('');
  const [liberado, setLiberado] = useState(false);
  const [usuarios, setUsuarios] = useState<UsuarioComSenha[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [usuarioParaExcluir, setUsuarioParaExcluir] = useState<UsuarioComSenha | null>(null);

  async function aoSubmeterSenha(evento: FormEvent) {
    evento.preventDefault();
    if (!senhaMestre || carregando) return;
    setCarregando(true);
    setErro(null);
    try {
      const lista = await authService.listarUsuarios(senhaMestre);
      setUsuarios(lista);
      setLiberado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Senha de acesso inválida.');
    } finally {
      setCarregando(false);
    }
  }

  async function aoConfirmarExclusao() {
    if (!usuarioParaExcluir) return;
    try {
      await authService.excluirUsuario(usuarioParaExcluir.id, senhaMestre);
      setUsuarios((atual) => atual.filter((u) => u.id !== usuarioParaExcluir.id));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Falha ao excluir usuário.');
    } finally {
      setUsuarioParaExcluir(null);
    }
  }

  if (!liberado) {
    return (
      <form className="auth-screen__form" onSubmit={aoSubmeterSenha}>
        <h2 className="auth-screen__form-title">Acesso de senhas</h2>
        <p className="form-hint">
          Área restrita: informe a senha de acesso para ver e gerenciar os logins cadastrados.
        </p>

        <div className="form-field">
          <label htmlFor="senha-mestre">Senha de acesso</label>
          <input
            id="senha-mestre"
            type="password"
            value={senhaMestre}
            onChange={(e) => {
              setSenhaMestre(e.target.value);
              setErro(null);
            }}
            placeholder="Senha de acesso"
            autoFocus
          />
        </div>

        {erro && <p className="auth-screen__erro">{erro}</p>}

        <Button type="submit" variante="primary" disabled={!senhaMestre || carregando}>
          {carregando ? 'Verificando...' : 'Acessar'}
        </Button>

        <div className="auth-screen__links">
          <button type="button" className="auth-screen__link" onClick={onVoltar}>
            Voltar para o login
          </button>
        </div>
      </form>
    );
  }

  return (
    <div className="auth-screen__form auth-screen__form--wide">
      <h2 className="auth-screen__form-title">Usuários cadastrados</h2>
      <p className="form-hint">
        Todos os logins e senhas cadastrados no sistema. É possível excluir o acesso de qualquer
        usuário.
      </p>

      {erro && <p className="auth-screen__erro">{erro}</p>}

      {usuarios.length === 0 ? (
        <p className="form-hint">Nenhum usuário cadastrado ainda.</p>
      ) : (
        <div className="auth-screen__table-wrap">
          <table className="auth-screen__table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Senha</th>
                <th>Cadastrado em</th>
                <th aria-label="Ações" />
              </tr>
            </thead>
            <tbody>
              {usuarios.map((usuario) => (
                <tr key={usuario.id}>
                  <td>{usuario.nome}</td>
                  <td className="auth-screen__table-senha">{usuario.senha}</td>
                  <td>{formatarData(usuario.criadoEm)}</td>
                  <td>
                    <button
                      type="button"
                      className="auth-screen__table-excluir"
                      onClick={() => setUsuarioParaExcluir(usuario)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="auth-screen__links">
        <button type="button" className="auth-screen__link" onClick={onVoltar}>
          Voltar para o login
        </button>
      </div>

      <ConfirmActionModal
        titulo="Excluir usuário"
        mensagem={`Tem certeza que deseja excluir o login "${usuarioParaExcluir?.nome ?? ''}"?`}
        textoConfirmar="Excluir usuário"
        aberto={usuarioParaExcluir !== null}
        onCancelar={() => setUsuarioParaExcluir(null)}
        onConfirmar={aoConfirmarExclusao}
      />
    </div>
  );
}
