/**
 * Usuário do sistema de login. `UsuarioPublico` é o que circula pela
 * aplicação normalmente (sessão atual, autor de ações). `UsuarioComSenha`
 * só é usado pela tela administrativa "Acesso de senhas", que exige
 * exibir as senhas originais dos usuários cadastrados.
 */
export interface UsuarioPublico {
  id: string;
  nome: string;
}

export interface UsuarioComSenha extends UsuarioPublico {
  senha: string;
  criadoEm: string;
}
