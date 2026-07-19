import { useState } from 'react';
import { LoginForm } from './LoginForm';
import { RegisterForm } from './RegisterForm';
import { PasswordAccessScreen } from './PasswordAccessScreen';
import './AuthScreen.css';

type Modo = 'login' | 'registrar' | 'acesso-senhas';

/**
 * Tela cheia exibida enquanto não há usuário logado. Alterna entre
 * login, cadastro e a tela administrativa "Acesso de senhas" — nenhuma
 * delas usa roteador, apenas estado local, já que o app inteiro é uma
 * única view.
 */
export function AuthScreen() {
  const [modo, setModo] = useState<Modo>('login');

  return (
    <div className="auth-screen">
      <div className="auth-screen__card">
        <div className="auth-screen__brand">
          <span className="auth-screen__mark" aria-hidden="true" />
          <div>
            <h1 className="auth-screen__title">Kanban Logístico</h1>
            <p className="auth-screen__subtitle">Gestão operacional de fretes da transportadora</p>
          </div>
        </div>

        {modo === 'login' && (
          <LoginForm
            onIrParaRegistro={() => setModo('registrar')}
            onIrParaAcessoSenhas={() => setModo('acesso-senhas')}
          />
        )}

        {modo === 'registrar' && <RegisterForm onIrParaLogin={() => setModo('login')} />}

        {modo === 'acesso-senhas' && (
          <PasswordAccessScreen onVoltar={() => setModo('login')} />
        )}
      </div>
    </div>
  );
}
