import { AuthProvider } from '@/context/AuthContext';
import { useAuth } from '@/hooks/useAuth';
import { AuthScreen } from '@/components/auth/AuthScreen';
import { KanbanProvider } from '@/context/KanbanContext';
import { Board } from '@/components/Board/Board';
import { UserMenu } from '@/components/UserMenu/UserMenu';
import { ToastHost } from '@/components/common/ToastHost';
import './App.css';

function AppConteudo() {
  const { usuarioAtual, carregando } = useAuth();

  if (carregando) {
    return (
      <div className="app-boot">
        <p>Carregando...</p>
      </div>
    );
  }

  if (!usuarioAtual) {
    return <AuthScreen />;
  }

  return (
    <KanbanProvider>
      <div className="app">
        <header className="app-header">
          <div className="app-header__brand">
            <span className="app-header__mark" aria-hidden="true" />
            <div>
              <h1 className="app-header__title">Kanban Logístico</h1>
              <p className="app-header__subtitle">Gestão operacional de fretes da transportadora</p>
            </div>
          </div>

          <UserMenu />
        </header>

        <main className="app-main">
          <Board />
        </main>
      </div>
    </KanbanProvider>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppConteudo />
      <ToastHost />
    </AuthProvider>
  );
}

export default App;
