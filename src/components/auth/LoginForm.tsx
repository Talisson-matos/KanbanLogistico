import { useState, type FormEvent } from 'react';
import { Button } from '@/components/common/Button';
import { useAuth } from '@/hooks/useAuth';
import '@/components/modals/FormFields.css';

interface LoginFormProps {
  onIrParaRegistro: () => void;
  onIrParaAcessoSenhas: () => void;
}

export function LoginForm({ onIrParaRegistro, onIrParaAcessoSenhas }: LoginFormProps) {
  const { login, erro, limparErro } = useAuth();
  const [nome, setNome] = useState('');
  const [senha, setSenha] = useState('');
  const [enviando, setEnviando] = useState(false);

  const podeEntrar = nome.trim() !== '' && senha !== '';

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    if (!podeEntrar || enviando) return;
    setEnviando(true);
    try {
      await login(nome.trim(), senha);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form className="auth-screen__form" onSubmit={aoSubmeter}>
      <h2 className="auth-screen__form-title">Entrar</h2>

      <div className="form-field">
        <label htmlFor="login-usuario">Usuário</label>
        <input
          id="login-usuario"
          type="text"
          value={nome}
          onChange={(e) => {
            setNome(e.target.value);
            limparErro();
          }}
          placeholder="Seu nome de usuário"
          autoFocus
        />
      </div>

      <div className="form-field">
        <label htmlFor="login-senha">Senha</label>
        <input
          id="login-senha"
          type="password"
          value={senha}
          onChange={(e) => {
            setSenha(e.target.value);
            limparErro();
          }}
          placeholder="Sua senha"
        />
      </div>

      {erro && <p className="auth-screen__erro">{erro}</p>}

      <Button type="submit" variante="primary" disabled={!podeEntrar || enviando}>
        {enviando ? 'Entrando...' : 'Entrar'}
      </Button>

      <div className="auth-screen__links">
        <button type="button" className="auth-screen__link" onClick={onIrParaRegistro}>
          Não tem login? Cadastre-se
        </button>
        <button
          type="button"
          className="auth-screen__link auth-screen__link--muted"
          onClick={onIrParaAcessoSenhas}
        >
          Acesso de senhas
        </button>
      </div>
    </form>
  );
}
