# Kanban Logístico — Transportadora

Sistema Kanban para gerenciamento logístico de uma transportadora, construído em
**Vite + React + TypeScript** no frontend (CSS separado, sem Tailwind) e
**Node.js + Express + MongoDB (Atlas)** no backend. Toda a persistência —
Pedidos, Tarefas, Pendências, Checklists, Sessões, Histórico, Observações e
Anexos — é feita no MongoDB; o `localStorage` não é mais usado para dados da
aplicação.

## Como rodar

O projeto tem **dois processos**: o backend (API + MongoDB) e o frontend
(Vite). Rode cada um em um terminal.

**1) Backend** (`server/`):

```bash
cd server
npm install
npm run dev
```

Isso conecta ao MongoDB Atlas usando a connection string em `server/.env`
(já preenchida com as credenciais fornecidas) e sobe a API em
`http://localhost:4000/api`. Verifique com `GET http://localhost:4000/api/health`.

**2) Frontend** (raiz do projeto):

```bash
npm install
npm run dev
```

Por padrão o frontend aponta para `http://localhost:4000/api` (ver
`src/config/api.ts`); para apontar para outro endereço, crie um `.env` na raiz
com `VITE_API_BASE_URL=...` (veja `.env.example`).

**Atalho**: depois de rodar `npm install` na raiz e em `server/` pelo menos
uma vez, `npm run dev:all` (na raiz) sobe os dois processos juntos, em um só
terminal, usando `concurrently`.

Build de produção do frontend:

```bash
npm run build
npm run preview
```

## Stack

- **Frontend**: React 18 + TypeScript (Vite), CSS puro (um arquivo por
  componente, sem Tailwind/CSS-in-JS), **@dnd-kit** para o drag and drop,
  Context API + `useReducer` para o estado do Kanban.
- **Backend**: Node.js + Express (`server/`), API REST simples que espelha
  exatamente os métodos de `IStorageService<T>` do frontend.
- **Persistência**: MongoDB Atlas. Documentos das entidades de domínio
  (Pedido, Tarefa, Pendência, Checklist, Sessão, Histórico, Observação) em
  coleções JSON simples; anexos de arquivo armazenados via **GridFS**
  (binário dividido em chunks, sem limite de 16 MB por documento).

## Estrutura de pastas

```
server/                    # Backend: API REST + MongoDB (Node + Express)
  .env                     # Connection string do MongoDB Atlas (não versionar)
  src/
    db.js                  # Conexão única com o MongoDB
    genericCrudRouter.js   # Fábrica de rotas CRUD genéricas (uma por coleção)
    index.js               # Setup do Express, monta todas as rotas
    routes/
      arquivos.js          # Upload/download/exclusão de anexos via GridFS
      auth.js               # Login, registro e verificação da senha mestre
      usuarios.js            # Listagem/exclusão de usuários (tela "Acesso de senhas")

src/
  types/                  # Interfaces de domínio (Pedido, Tarefa, Pendência,
                           # Checklist, Sessão, Histórico, Observação, Anexo,
                           # Usuario...)
  config/
    api.ts                # URL base da API (VITE_API_BASE_URL)
    columns.ts            # Configuração estática das 10 colunas do Kanban
  services/
    idGenerator.ts         # Geração de IDs e timestamps
    rules/
      movementRules.ts     # Regras de quais movimentos de drag são permitidos
    notifications/          # Barramento de notificações (toasts)
    anexos/
      anexosService.ts      # Upload/download/exclusão de anexos (multipart)
    auth/
      authService.ts         # Login, registro, senha mestre, admin de usuários
    storage/
      IStorageService.ts     # Contrato genérico de persistência
      LocalStorageService.ts # Implementação alternativa (localStorage, não usada em produção)
      ApiStorageService.ts   # Implementação ativa — fala com a API REST (server/)
      index.ts                # Instâncias por entidade — ÚNICO ponto de troca
                               # de mecanismo de persistência
  context/
    kanbanReducer.ts       # Reducer puro com todas as transições de estado
    KanbanContext.tsx      # Provider: carrega dados, expõe ações de domínio
    AuthContext.tsx         # Provider: sessão do usuário logado (login/registro/logout)
  hooks/
    useKanban.ts            # Hook de acesso ao contexto do Kanban
    useAnexos.ts             # Hook de anexos de uma tarefa (usado por AnexosPanel)
    useAuth.ts               # Hook de acesso à sessão (usado por KanbanContext e UI)
  components/
    Board/                  # Quadro completo + DndContext
    Column/                 # Uma das 10 colunas (cabeçalho + subcolunas + pendentes)
    SubColumn/               # "A Fazer" / "Fazendo" (área de drop ordenável)
    PendingBox/              # Caixa "Pendentes" na base de cada coluna
    TaskCard/                # Cartão de tarefa (arrastável) + ações + responsáveis
    CreateOrderButton/       # Botão "Criar Pedido" fixo à esquerda
    UserMenu/                # Nome do usuário logado no cabeçalho + menu "Sair"
    auth/
      AuthScreen.tsx          # Tela cheia exibida enquanto não há login
      LoginForm.tsx           # Usuário + senha
      RegisterForm.tsx        # Nome, senha, confirmar senha
      PasswordAccessScreen.tsx # "Acesso de senhas" (senha mestre + lista + exclusão)
    modals/
      Modal.tsx               # Wrapper genérico de modal
      ConfirmDeleteModal.tsx  # "Tem certeza que deseja excluir a tarefa?"
      ConfirmActionModal.tsx  # Confirmação genérica (ex.: excluir anexo/usuário)
      TaskInfoModal.tsx       # "Ver Informações" (anexos, pedido, checklist...)
      OpenTaskModal.tsx       # "Abrir Tarefa" — host dos formulários de etapa
      PendingReasonModal.tsx  # Motivo ao marcar uma tarefa como pendente
      CreatePedidoModal.tsx   # Formulário de criação de Pedido
      stageForms/             # Formulários das 10 etapas + registro de exibição
    common/
      Button.tsx               # Botão reutilizável com variantes
      StatusCheckField.tsx      # Campo de preenchimento em barra de status
      AnexosPanel.tsx           # Painel de anexos (upload múltiplo + lista)
      ToastHost.tsx             # Host global de notificações
```

## Modelo de dados (resumo)

- **Pedido**: a unidade de negócio (frete) que percorre as 10 colunas.
- **Tarefa**: o cartão do Kanban; pertence a um Pedido, vive em uma coluna e em
  uma subcoluna ("A Fazer" ou "Fazendo"), e pode estar `pendente`. Possui um
  campo `dadosEtapa` indexado por coluna, com os dados de cada formulário de
  etapa preservados conforme a tarefa avança, além de `criadoPor` (fixo,
  desde a criação até a finalização) e `fazendoPor` (quem está com a tarefa
  em "Fazendo" no momento — ver seção "Login e usuários" abaixo).
- **Pendência**: criada ao marcar uma Tarefa como pendente; guarda motivo e
  status de resolução.
- **Checklist**: lista de verificação genérica associável a uma Tarefa.
- **Sessão**: conjunto de passos operacionais de uma etapa (ex.: "Cadastro
  Komando"), criado pelos formulários que assim exigem.
- **Histórico**: trilha de auditoria genérica para qualquer entidade.
- **Observação**: anotação textual livre vinculada a qualquer entidade.
- **Anexo**: arquivo (imagem, PDF, TXT, etc.) enviado e vinculado a uma
  Tarefa; metadados no MongoDB, binário armazenado via GridFS (ver seção
  "Anexos de arquivo" abaixo).
- **Usuario**: login do sistema (nome + senha); ver seção "Login e usuários"
  abaixo.

## Regras de movimentação (drag and drop)

A movimentação por arraste é **unidirecional** e **restrita à mesma coluna**:

- É permitido arrastar uma Tarefa **apenas de "A Fazer" para "Fazendo"**,
  dentro da mesma coluna.
- **Não é permitido** o retorno manual de "Fazendo" para "A Fazer" por
  arraste — a tentativa é bloqueada e um aviso é exibido.
- A **única forma de uma tarefa "retornar"** é através da caixa **Pendentes**:
  ao clicar em "Pendente" e descrever a pendência, a tarefa é **removida do
  quadro** (some de "A Fazer"/"Fazendo") e passa a existir apenas na caixa
  Pendentes **daquela coluna**. Ao finalizar a pendência ("Pendência
  Finalizada"), a tarefa retorna **exatamente para a coluna de origem**,
  **sempre na subcoluna "Fazendo"** (nunca em "A Fazer"), e o texto da
  pendência é apagado automaticamente.
- Cada coluna tem sua própria caixa Pendentes, que exibe apenas um
  **contador**; clicar nela abre um modal com todas as tarefas pendentes
  daquela coluna, cada uma com: Abrir Tarefa, Ver Informações, Pendente
  (edita o texto da pendência), Excluir, Ver Pendência e Pendência
  Finalizada.
- A movimentação **entre colunas diferentes** acontece por ação explícita
  (botão "Próxima Etapa" de cada formulário, ou roteamento condicional — ex.:
  pular a Guia quando não há ICMS), nunca por drag and drop. Toda essa lógica
  está centralizada em `src/services/rules/movementRules.ts` (regras de drag)
  e `avancarParaColuna`/`enviarParaRetificacao` no `KanbanContext` (avanço de
  etapa).

## Persistência: MongoDB (via API própria)

Toda a persistência migrou de `localStorage` para **MongoDB Atlas**, através
de um backend Express dedicado (`server/`). Nenhum componente, hook ou
contexto do frontend fala com o banco diretamente — tudo passa por
`IStorageService<T>` (`src/services/storage/IStorageService.ts`), cuja
implementação ativa hoje é `ApiStorageService` (chamadas `fetch` para a API).

- **Coleções simples** (Pedido, Tarefa, Pendência, Checklist, Sessão,
  Histórico, Observação): cada uma vira uma coleção no MongoDB com o mesmo
  formato do objeto TypeScript correspondente, identificada pelo campo `id`
  (string gerada no frontend, não o `_id` nativo do Mongo). O backend expõe,
  para cada uma, uma rota REST genérica (`server/src/genericCrudRouter.js`)
  que espelha exatamente os métodos de `IStorageService`: `GET /` (getAll),
  `GET /:id` (getById), `POST /` (create), `PATCH /:id` (update parcial),
  `DELETE /:id` (remove) e `PUT /` (replaceAll).
- **Anexos de arquivo**: ver seção dedicada abaixo — usam GridFS em vez da
  coleção genérica, pois envolvem upload binário (`multipart/form-data`), não
  JSON puro.

> **Detalhe importante em `ApiStorageService.update`**: campos com valor
> `undefined` (usados em vários pontos do `KanbanContext` para "limpar" um
> campo — ex.: `retificacao: undefined` ao concluir uma retificação,
> `fazendoPor: undefined` ao avançar de coluna) são convertidos para `null`
> antes de serializar. Sem essa conversão, `JSON.stringify` descarta essas
> chaves silenciosamente, a informação nunca chegaria ao backend, e o valor
> antigo permaneceria no MongoDB para sempre — o backend já esperava `null`
> como pedido de remoção (`$unset`), mas o frontend nunca chegou a enviá-lo.

Para trocar novamente o mecanismo de persistência (ex.: outro banco, ou
voltar a `localStorage` para desenvolvimento offline), basta trocar as
instâncias em `src/services/storage/index.ts` — nenhum outro arquivo do
frontend precisa mudar. `LocalStorageService` continua disponível no projeto
para esse cenário.

### Variáveis de ambiente

- `server/.env` — `MONGODB_URI` (connection string do Atlas), `MONGODB_DB_NAME`,
  `PORT` (padrão `4000`). Veja `server/.env.example`.
- `.env` (raiz, frontend) — `VITE_API_BASE_URL` (padrão
  `http://localhost:4000/api`, já funciona sem criar o arquivo). Veja
  `.env.example`.

## Anexos de arquivo

Cada Tarefa tem um painel de anexos (`AnexosPanel`, alimentado pelo hook
`useAnexos`), reaproveitado em vários lugares:

- **No topo** do modal "Ver Informações" (antes de qualquer outra seção).
- **Ao final** da tela de confirmação exibida após "Salvar e criar sessão",
  nos formulários de "Prospecção de Motorista" e "Cadastramento" — assim dá
  para anexar documentos assim que a etapa é registrada, sem precisar abrir
  "Ver Informações" à parte.
- Na etapa **"Guia"** (só acessível com a tarefa em "Fazendo", já que "Abrir
  Tarefa" fica desabilitado em "A Fazer"), para anexar a **duplicata
  (comprovante de pagamento da Guia)**.
- Na etapa **"Carregamento/Documentação"**, condicionalmente: só aparece
  depois que a pergunta "Haverá Guia de ICMS?" é respondida **Sim**, para
  anexar a guia junto aos demais documentos da etapa.

Comportamento:

- **Upload múltiplo em uma única ação**: o campo de arquivo aceita seleção
  múltipla (clique ou arraste-e-solte) e envia **todos os arquivos
  selecionados em uma única requisição** (`multipart/form-data` com vários
  campos `arquivos`) — não é preciso repetir o processo um arquivo por vez.
  Qualquer tipo de arquivo é aceito (imagem, PDF, TXT, etc.).
- Cada arquivo anexado tem três ações: **Ver Arquivo** (abre em nova aba,
  com `Content-Disposition: inline` — o navegador pré-visualiza imagens,
  PDFs e textos), **Baixar Arquivo** (força o download,
  `Content-Disposition: attachment`) e **Excluir Arquivo** (com confirmação).
- O binário é armazenado no MongoDB via **GridFS** (bucket `anexos`), que
  divide o arquivo em chunks e não tem o limite de 16 MB de um documento
  comum — adequado para anexos de tamanho variável. Os metadados (nome,
  tipo MIME, tamanho, tarefa vinculada, data de envio) ficam no próprio
  GridFS (`anexos.files`), lidos pela rota `server/src/routes/arquivos.js`.
- A lista de anexos também entra no texto copiado pelo botão **"Copiar
  Tudo"** do "Ver Informações".

## Login e usuários

O acesso ao Kanban exige login. `AuthProvider`/`useAuth`
(`src/context/AuthContext.tsx`) controlam a sessão; `KanbanProvider` só é
montado depois que há um usuário logado, então qualquer ação do Kanban
(`KanbanContext`) já tem acesso ao usuário atual via `useAuth()`.

- **Login**: apenas usuário e senha (`LoginForm`). Autentica contra
  `POST /api/auth/login`, que confere `nome`+`senha` na coleção `usuarios`
  do MongoDB.
- **Cadastro**: botão "Não tem login? Cadastre-se" abre `RegisterForm`, com
  apenas **nome, senha e confirmar senha**. `POST /api/auth/registrar`
  valida que as senhas coincidem e que o nome ainda não existe.
- **"Acesso de senhas"**: link na tela de login abre `PasswordAccessScreen`,
  protegida por uma senha mestre fixa (`1335T@l2076`, guardada só no
  backend — `server/src/routes/auth.js`). Uma vez liberado, mostra **todos
  os usuários cadastrados com a senha em texto puro** e permite excluir
  qualquer login (`DELETE /api/usuarios/:id`, também exige a senha mestre no
  corpo da requisição).
- **Sessão**: a identidade do usuário logado (`{ id, nome }`, sem senha)
  fica em `localStorage` só para lembrar quem está usando aquela aba/
  navegador entre recarregamentos — os dados do Kanban em si continuam 100%
  no MongoDB. `UserMenu`, no cabeçalho, mostra o nome logado; clicar nele
  abre um menu com **Sair** (logoff).

> **Aviso de segurança**: este login é deliberadamente simples (senha em
> texto puro, sem hashing, sem tokens de sessão) porque o próprio requisito
> pede uma tela administrativa que exiba as senhas originais. Não é um
> padrão adequado para dados sensíveis reais — serve para controle de
> acesso interno e simples deste projeto.

### Responsáveis fixados na Tarefa

Dois campos em `Tarefa` (`types/tarefa.ts`) guardam automaticamente quem
mexeu na tarefa, exibidos no cabeçalho do cartão (`TaskCard`/
`PendingTaskRow`) e em "Ver Informações":

> Além disso, assim que o formulário de "Prospecção de Motorista" é salvo,
> o nome do motorista (`dadosEtapa['prospeccao-motorista'].nomeMotorista`)
> passa a aparecer como um selo 🚚 no cartão, em qualquer coluna do Kanban,
> para identificação rápida.

- **`criadoPor`**: preenchido uma única vez, em `criarPedido`, com o nome de
  quem criou o Pedido. Nunca mais é alterado — fica fixo na tarefa em
  **todas** as etapas até a finalização.
- **`fazendoPor`**: preenchido com o nome de quem arrastou a tarefa de "A
  Fazer" para "Fazendo" (`moverTarefa`) — ou de quem finalizou uma
  pendência, já que isso também devolve a tarefa para "Fazendo"
  (`resolverPendente`). É **limpo automaticamente** sempre que a tarefa
  avança para a próxima coluna (`avancarParaColuna`/`enviarParaRetificacao`,
  que sempre pousam em "A Fazer"), liberando a etapa para o próximo
  responsável assumir. Por isso só é exibido enquanto
  `subColumnId === 'fazendo'` — nunca em "A Fazer".

## Refinamentos de interface

- **Campos de preenchimento em barra de status** (`StatusCheckField`,
  `components/common/`): todos os campos de marcação dentro dos formulários
  de "Abrir Tarefa" (Cadastramento, Carregamento/Documentação, Adiantamento,
  Descarga, Saldo, Agendamento, Viagem, Avaliação Toxicológico) usam esse
  componente em vez de um checkbox simples — uma barra que se preenche ao
  marcar, com o rótulo "Pendente"/"Preenchido".
- **Checklist de Sessão** (`SessionChecklist`, exibido após "Salvar e criar
  sessão" e em "Ver Informações"): continua com checkbox nativo simples, sem
  risco (`line-through`) nem esmaecimento do texto ao marcar — só o estado
  marcado importa.
- **Agendamento**: o campo "Ordem de Carregamento" agora é sempre exibido
  (Frota e Terceiro) como um campo editável de verdade (barra de status),
  em vez de um checkbox travado herdado da etapa de Cadastramento.
- **Coluna "Histórico/Finalização"**: não tem mais subcolunas "A Fazer"/
  "Fazendo" — mostra uma única lista "Finalizado", com os cartões em tom
  esverdeado e sem o botão "Abrir Tarefa" (nada mais a preencher nesta
  etapa). A caixa "Pendentes" continua funcionando normalmente.
- **Layout das subcolunas**: "A Fazer" e "Fazendo" ficam lado a lado (uma
  ao lado da outra, com uma linha divisória pontilhada), reforçando a
  sensação de continuidade do fluxo dentro da coluna.



Todas as **10 colunas** já possuem formulário próprio em "Abrir Tarefa"
(`src/components/modals/stageForms/`):

**1 — Prospecção de Motorista** (`ProspeccaoMotorista.tsx`)
- Escolha entre **Frota** ou **Terceiro**.
- Terceiro: Nome do motorista, Conjunto de placas, Valor de frete acordado,
  checkbox "Avaliação Toxicológico" e checkbox "EAR na Carteira" (essas duas
  sempre com o rótulo "Validado").
- Frota: Nome do motorista, Conjunto de placas.
- **Checklist de seleção**: os passos operacionais da etapa (diferentes para
  Terceiro/Frota) aparecem como uma lista marcável, com o rótulo
  "Solicitar" quando marcado. Para Frota vêm todos marcados por padrão;
  para Terceiro vêm todos **desmarcados** por padrão. Não cria mais Sessão
  — os itens marcados são salvos em `dadosEtapa.itensSolicitados`, e é isso
  que determina se o passo será pedido de novo em etapas seguintes (ex.:
  "Fazer Monitoramento" em "Carregamento/Documentação", "Ordem de
  Carregamento" e os cadastros Komando/Bounny/Otnet/Rodopar em etapas
  posteriores) — o que não for marcado aqui, não é pedido depois.
- Painel de anexos na tela de confirmação para qualquer documento. Botão
  **"Próxima Etapa"** avança para "Cadastramento".

**2 — Cadastramento** (`Cadastramento.tsx`)
- Terceiro: mostra somente os pares "Fazer Cadastro"/"Aprovado" (Komando,
  Bounny, Otnet) e "Fazer Cadastro Rodopar" cujo item correspondente tenha
  sido marcado no checklist de seleção da Prospecção — o que não foi
  marcado lá não aparece aqui.
- Frota: "Conjunto de placas validado para viagem".
- Em ambos os casos, "Agendamento de Carregamento" aparece como campo de
  barra de status ("Solicitar"), que define se a etapa "Agendamento" vai
  pedir a data/hora e o local do carregamento.
- Não cria mais Sessão. Botão **"Próxima Etapa"** avança para "Agendamento".

**3 — Agendamento** (`Agendamento.tsx`)
- "Agendamento de Carregamento" (com Data/Hora e Local) só aparece se foi
  solicitado no Cadastramento; "Ordem de Carregamento" (com painel de
  anexo) só aparece se foi marcado no checklist da Prospecção. Se nenhum
  dos dois foi solicitado, o formulário mostra só um painel de anexo
  genérico e o botão "Próxima Etapa" liberado direto.
- Não cria sessão. Botão **"Próxima Etapa"** avança manualmente para
  "Carregamento/Documentação".

**4 — Carregamento/Documentação** (`CarregamentoDocumentacao.tsx`)
- Terceiro: Fazer CTe, Fazer MDFe, Fazer Contrato. Frota: Fazer CTe, Fazer
  MDFe. "Fazer Monitoramento" reaparece se esse passo foi marcado na
  Prospecção — quando validado, revela um campo obrigatório **"Número do
  Monitoramento"**.
- Painel de anexos **"Documentos"**, sempre visível, logo antes da pergunta
  "Haverá Guia de ICMS?" (Sim/Não) — para anexar a documentação da etapa em
  geral. Respondendo "Sim" à pergunta, aparece um segundo painel de anexos
  específico para a guia.
- Não cria sessão. Botão **"Próxima Etapa"** decide o destino: Sim → "Guia";
  Não → "Adiantamento" (Terceiro) ou "Viagem" (Frota).

**5 — Guia** (`Guia.tsx`)
- "Validação e Pagamento da Guia": **Concluído** avança para "Adiantamento"
  (Terceiro) ou "Viagem" (Frota); **Retificar** abre uma textarea para o
  motivo e devolve a tarefa automaticamente para "Carregamento/Documentação"
  (A Fazer), sinalizando a tarefa com o indicador **"A Retificar"** (visível
  no cartão, com o motivo consultável) e uma notificação-toast.

**6 — Adiantamento** (`Adiantamento.tsx`)
- Aplicável apenas a **Terceiro** (tarefas de Frota nunca chegam nesta
  coluna, pois as etapas 4 e 5 já as roteiam direto para "Viagem").
- Checkboxes "Adiantamento Pago" e "Planilha Atualizada" (ambos
  obrigatórios). Botão **"Próxima Etapa"** avança para "Viagem".

**7 — Viagem** (`Viagem.tsx`)
- Aplicável a **Frota e Terceiro**.
- Checkbox "Agendamento de Descarga"; se marcado, revela Data/Hora e Local.
- Botão **"Próxima Etapa"** avança para "Descarga".

**8 — Descarga** (`Descarga.tsx`)
- Aplicável a **Frota e Terceiro**: três checkboxes obrigatórios — "Canhotos
  enviados", "Descarga Concluída", "Manifesto Encerrado".
- Botão **"Próxima Etapa"** roteia: Terceiro → "Saldo"; Frota → direto para
  "Histórico/Finalização" (pula o Saldo, que não se aplica a Frota).

**9 — Saldo** (`Saldo.tsx`)
- Aplicável apenas a **Terceiro** (Frota nunca chega aqui, pois a Descarga já
  a roteia direto para o Histórico).
- Checkbox "Pagamento de Saldo" (obrigatório). Botão **"Próxima Etapa"**
  avança para "Histórico/Finalização".

**10 — Histórico/Finalização** (`HistoricoFinalizacao.tsx`)
- Etapa final: não recebe novos campos de formulário — em vez disso, exibe
  um **resumo completo e somente leitura** de tudo o que foi salvo em todas
  as etapas anteriores (dados do Pedido, dados de cada etapa preenchida e
  todas as Sessões com seus passos), reaproveitando o mesmo utilitário
  (`stageForms/summary.ts`) usado pelo "Ver Informações".
- Botão **"Finalizar Pedido"**: marca o Pedido como `finalizado`
  (`finalizarPedido` no `KanbanContext`), registra o Histórico e dispara uma
  notificação de sucesso. Uma vez finalizado, o botão fica desabilitado.

Com isso, **todas as 10 colunas** do Kanban possuem formulário próprio em
"Abrir Tarefa".

### Avanço entre colunas (fora do drag and drop)

Como o arraste manual entre colunas continua bloqueado (ver seção acima), o
avanço de etapa acontece **sempre por ação explícita do usuário**, nunca
automaticamente — mesmo nas etapas que criam uma Sessão (1 e 2), é preciso
clicar em **"Próxima Etapa"** depois de revisar o checklist da sessão; a
conclusão dos itens da sessão não move a tarefa sozinha, por ser um
comportamento implícito e pouco visível ao usuário. Todo avanço passa pela
mesma função centralizada `avancarParaColuna` (`KanbanContext`), inclusive
com roteamento condicional (ex.: pular a Guia quando não há ICMS), e gera
uma entrada no Histórico.

### Retificar (botão geral, em qualquer "A Fazer")

Além do fluxo específico "Concluído/Retificar" da etapa "Guia" (acima),
**todo** cartão parado em "A Fazer" — em qualquer uma das 10 colunas, exceto
a primeira ("Prospecção de Motorista", que não tem para onde voltar) — tem
um botão "↩" no cabeçalho (`RetificarTarefaModal`). Ao confirmar:

- `enviarParaRetificacao` devolve a tarefa para "A Fazer" da coluna de
  origem — não a anterior na ordem fixa das 10 colunas, e sim
  `tarefa.colunaAnterior`, gravada dinamicamente a cada `avancarParaColuna`.
  Isso importa porque tarefas de Frota pulam "Guia", "Adiantamento" e
  "Saldo": retificar a partir de "Viagem" devolve corretamente para
  "Carregamento/Documentação", não para "Adiantamento" (que a tarefa nunca
  visitou).
- Grava `tarefa.retificacao` (motivo + coluna de origem + data), exibe o
  rótulo **"A Retificar"** no cartão (clicável para ver o motivo) e dispara
  uma notificação-toast.
- O sinalizador é limpo **automaticamente** por `avancarParaColuna` na
  próxima vez que a tarefa avançar de coluna — não importa de qual coluna
  ela tenha sido devolvida, então não é preciso nenhuma lógica extra em
  cada formulário de etapa.

### `dadosEtapa` por coluna

`tarefa.dadosEtapa` é indexado por coluna
(`Partial<Record<ColumnId, Record<string, unknown>>>`), preservando os dados
de **todas** as etapas já preenchidas conforme a tarefa avança — nada é
sobrescrito. Os formulários leem/gravam através de `atualizarDadosEtapa`,
que mescla apenas o namespace da coluna atual.

## Kanban dinâmico

- **Rolagem horizontal pelo mouse**: dentro da área das colunas (`Board`), a
  rolagem do mouse (naturalmente vertical) é redirecionada para mover as
  colunas na horizontal — desce a roda, o quadro anda para a direita; sobe,
  anda para a esquerda. Usa um listener nativo de `wheel` (não o `onWheel`
  passivo do React) para poder chamar `preventDefault()`, anexado via
  **`ref` de callback** — importante porque o elemento `.board` só existe
  na renderização "pronta"; um `useEffect` de dependências vazias rodaria
  ainda na tela de "Carregando..." (sem o elemento) e nunca reanexaria o
  listener depois.
- **Colunas mais largas**: 560px (300px na coluna final "Histórico/
  Finalização"), para os cartões ficarem com formato retangular em vez de
  espremidos.
- **Scroll normal dentro de modais**: qualquer modal (`Modal.tsx`) é
  renderizado via `createPortal` direto em `document.body`, fora da árvore
  DOM do `.board`. Isso é o que garante que rolar o mouse com um modal
  aberto role o conteúdo dele normalmente (para cima/para baixo), sem ser
  sequestrado pelo redirecionamento horizontal do quadro — que só se aplica
  a elementos realmente dentro de `.board`.
- **Cartão da tarefa simplificado**: número do pedido e rota aparecem cada
  um **uma única vez** no cabeçalho do cartão (antes apareciam duplicados,
  vindos do título da tarefa *e* de campos separados).
- **Temporizador por subcoluna** (`useElapsedMs`): cada tarefa guarda
  `subColunaDesde` (ISO), reiniciado toda vez que muda de subcoluna — por
  arraste (A Fazer → Fazendo), avanço de etapa, retorno de pendência ou
  retificação. O cartão mostra há quanto tempo está ali, atualizado
  sozinho a cada 30s.
- **Destaque de atraso**: nas colunas "Cadastramento", "Carregamento/
  Documentação", "Guia", "Adiantamento" e "Saldo"
  (`COLUNAS_COM_PRAZO_DE_ATRASO`), uma tarefa parada há mais de 1 hora
  (`LIMITE_ATRASO_MS`) na subcoluna atual fica com destaque vermelho.
- **Urgência (🚩)**: botão no cartão, habilitado só em "A Fazer"
  (`alternarUrgencia`, também validado no `KanbanContext` e não só na UI).
  Marca a tarefa em laranja e prioriza sua ordenação.
- **Ordenação por prioridade** (`ordenarPorPrioridade`): dentro de cada
  subcoluna, urgentes sempre primeiro; dentro do mesmo grupo (urgente ou
  não), quem está há mais tempo parado vem primeiro.
- **Filtro por coluna**: ícone de funil no cabeçalho de cada coluna
  (`ColumnFilterModal`) filtra por número do pedido, usuário que criou,
  motorista ou rota — opções calculadas dinamicamente a partir das tarefas
  presentes na própria coluna. Clicar no ícone novamente (com filtro ativo)
  remove o filtro.
- **Atualização automática**: o `KanbanProvider` recarrega os dados da API
  silenciosamente a cada 15s (`INTERVALO_ATUALIZACAO_MS`), sem afetar a
  tela caso a chamada falhe (só a carga inicial pode mostrar erro) — assim,
  mudanças feitas por outros usuários aparecem sem precisar recarregar a
  página.

## Arquitetura de extensão dos formulários de etapa

Todas as 10 colunas já têm formulário, mas a arquitetura de registro
continua sendo o caminho para qualquer ajuste ou nova etapa futura. O botão
**"Abrir Tarefa"** de cada cartão abre `OpenTaskModal`, que consulta
`STAGE_FORM_REGISTRY` (`src/components/modals/stageForms/registry.ts`) para
encontrar o formulário da coluna correspondente. Para adicionar ou substituir
o formulário de uma etapa, basta:

1. Criar o componente do formulário (`stageForms/<Etapa>.tsx`) e registrá-lo
   em `STAGE_FORM_REGISTRY`;
2. Criar os metadados de exibição (`stageForms/<Etapa>.campos.ts`, um array
   de `CampoExibicao`) e registrá-los em `STAGE_FIELDS_REGISTRY`.

Assim que ambos existirem, o "Abrir Tarefa" passa a renderizar o formulário
automaticamente **e** o modal "Ver Informações" passa a exibir os dados
preenchidos automaticamente — nenhuma alteração em `OpenTaskModal`,
`TaskInfoModal`, `TaskCard`, `Board` ou `KanbanContext` é necessária.

## Modal "Ver Informações"

Reúne **tudo** o que existe sobre a tarefa e o pedido associado:

- Dados da Tarefa e do Pedido.
- **Dados das Etapas**: renderização genérica e **cumulativa** de
  `tarefa.dadosEtapa` — uma subseção por coluna já preenchida (não apenas a
  atual), a partir do `STAGE_FIELDS_REGISTRY` de cada coluna. Segue a regra
  do projeto: todo campo do tipo checkbox aparece como `"Sim: Rótulo"`
  (marcado) ou `"Não: Rótulo"` (não marcado); os demais campos aparecem como
  `"Rótulo: valor"`.
- Checklist, Sessões (com os passos marcáveis), Histórico.
- **Observações Permanentes**: campo único, editável a qualquer momento e em
  qualquer etapa do Kanban (persistido em `pedido.observacoesGerais`).
- Registro de Observações: log de anotações datadas, mantido à parte do
  campo permanente acima.
- Botão **"Copiar Tudo"** no cabeçalho do modal: copia para a área de
  transferência uma versão em texto puro de tudo o que está sendo exibido.
