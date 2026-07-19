import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import '@/components/modals/FormFields.css';

interface RegisterFormProps {
  onIrParaLogin: () => void;
}

export function RegisterForm({ onIrParaLogin }: RegisterFormProps) {
  const { registrar, erro, limparErro } = useAuth();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [confirmarSenha, setConfirmarSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const senhasConferem = senha !== '' && senha === confirmarSenha;
  const podeCadastrar = nome.trim().length >= 2 && senha.length >= 4 && senhasConferem;

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!podeCadastrar || enviando) return;
    setEnviando(true);
    try {
      const sucesso = await registrar(nome.trim(), senha, confirmarSenha);
      if (sucesso) onIrParaLogin();
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="auth-screen__form" onSubmit={aoSubmeter}>
      <h2 className="auth-screen__form-title">Cadastrar</h2>

      <div className="form-field">
        <label htmlFor="registro-nome">Nome</label>
        <input
          id="registro-nome"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            limparErro();
          }}
          placeholder="Nome de usuário"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor="registro-senha">Senha</label>
        <input
          id="registro-senha"
          type="password"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            limparErro();
          }}
          placeholder="Mínimo 4 caracteres"
        />
      </div>

      <div className="form-field">
        <label htmlFor="registro-confirmar-senha">Confirmar senha</label>
        <input
          id="registro-confirmar-senha"
          type="password"
          value={confirmarSenha}
          onChange={(e) => {
            setConfirmarSenha(e.target.value);
            limparErro();
          }}
          placeholder="Repita a senha"
        />
        {confirmarSenha !== '' && !senhasConferem && (
          <p className="form-hint form-hint--erro">As senhas não coincidem.</p>
        )}
      </div>

      {erro && <p className="auth-screen__erro">{erro}</p>}

      <Button type="submit" variante="primary" disabled={!podeCadastrar || enviando}>
        {enviando ? 'Cadastrando...' : 'Cadastrar'}
      </Button>

      <div className="auth-screen__links">
        <button type="button" className="auth-screen__link" onClick={onIrParaLogin}>
          Já tem login? Entrar
        </button>
      </div>
    </form>
  );
}
