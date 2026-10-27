# 04 — Arquitetura

## 1. Visão macro

```mermaid
flowchart LR
    subgraph MOBILE["Dispositivo do usuário"]
        APP["App React Native (Expo)"]
        STORE[("AsyncStorage<br/>token + usuário")]
        APP <--> STORE
    end

    subgraph SERVIDOR["Servidor"]
        API["API REST<br/>Node.js + Express"]
    end

    DB[("PostgreSQL<br/>usuario · categoria_servico · chamado")]

    APP -- "HTTP/JSON<br/>Authorization: Bearer JWT" --> API
    API -- "SQL parametrizado (pg)" --> DB
```

- O app e a API se comunicam **exclusivamente por HTTP/JSON**.
- A autenticação é **stateless**: cada requisição carrega o JWT; o servidor
  não guarda sessão.
- Só a API acessa o banco. O app nunca fala direto com o PostgreSQL.

## 2. Arquitetura do backend em camadas

O backend segue uma arquitetura em camadas com responsabilidades bem separadas:

```mermaid
flowchart TB
    REQ["Requisição HTTP"] --> ROUTES
    ROUTES["Routes<br/>mapeia método + caminho"] --> MW
    MW["Middlewares<br/>auth (JWT) · authorize (perfil)"] --> CTRL
    CTRL["Controllers<br/>lê req, devolve res, traduz erros"] --> SVC
    SVC["Services<br/>regras de negócio"] --> REPO
    REPO["Repositories<br/>SQL via pg"] --> DB[("PostgreSQL")]
```

| Camada | Pasta | Responsabilidade | Conhece HTTP? | Conhece SQL? |
|--------|-------|------------------|:-------------:|:------------:|
| Routes | `src/routes/` | Associar rotas a controllers e middlewares | ✅ | ❌ |
| Middlewares | `src/middlewares/` | Autenticar (JWT) e autorizar (perfil) | ✅ | ❌ |
| Controllers | `src/controllers/` | Extrair dados da requisição e formatar a resposta/erro | ✅ | ❌ |
| Services | `src/services/` | **Regras de negócio** e validações | ❌ | ❌ |
| Repositories | `src/repositories/` | Consultas SQL | ❌ | ✅ |
| Config | `src/config/` | Pool de conexão com o PostgreSQL | ❌ | ✅ |
| Utils | `src/utils/` | `AppError` | ❌ | ❌ |

**Regra de dependência:** cada camada só conhece a imediatamente abaixo.
Services nunca importam `express`; repositories nunca conhecem regras de negócio.
Isso é o que torna os services testáveis sem HTTP e sem banco.

## 3. Injeção de dependência (factory functions)

Os services são criados por **funções fábrica** que recebem suas dependências
por parâmetro:

```js
// authService.js
function createAuthService({ usuarioRepository, bcryptLib = bcrypt, jwtLib = jwt } = {}) { ... }

// chamadoService.js
function createChamadoService({ chamadoRepository, categoriaRepository }) { ... }
```

A **montagem real** (service + repository de verdade) acontece em um único
lugar, nos arquivos `*Instance.js`:

```js
// chamadoServiceInstance.js
module.exports = createChamadoService({ chamadoRepository, categoriaRepository });
```

Nos testes, o service é criado manualmente com repositories falsos (mocks de
Jest), sem tocar no PostgreSQL:

```mermaid
flowchart LR
    subgraph PROD["Produção"]
        C1["chamadoController"] --> I["chamadoServiceInstance"]
        I --> S1["createChamadoService(...)"]
        S1 --> R1["chamadoRepository (real, pg)"]
    end
    subgraph TESTE["Teste unitário"]
        T["chamadoService.test.js"] --> S2["createChamadoService(...)"]
        S2 --> R2["repositories mockados (jest.fn)"]
    end
```

Benefícios: testes rápidos e determinísticos, sem infraestrutura, e baixo
acoplamento entre regra de negócio e persistência.

## 4. Tratamento de erros

`AppError` (`src/utils/AppError.js`) estende `Error` com um `statusCode` HTTP.
Os services lançam `AppError` para falhas de regra; os controllers capturam e
respondem:

```js
catch (err) {
  return res.status(err.statusCode || 500).json({ erro: err.message });
}
```

| Origem do erro | Status | Corpo |
|----------------|--------|-------|
| `AppError` lançado pelo service | `statusCode` do erro | `{ "erro": "<mensagem>" }` |
| Middleware `auth` | 401 | `{ "erro": "Token não informado." }` ou `"Token inválido ou expirado."` |
| Middleware `authorize` | 403 | `{ "erro": "Você não tem permissão para esta ação." }` |
| Rota inexistente | 404 | `{ "erro": "Rota não encontrada." }` |
| Erro inesperado (ex.: falha de banco) | 500 | `{ "erro": "<err.message>" }` (ver [limitações](12-limitacoes-e-roadmap.md)) |

Todas as respostas de erro usam a chave `erro` em português, o que simplifica o
tratamento no app (`api.js` lê `dados.erro`).

## 5. Fluxos principais (diagramas de sequência)

### 5.1 Login

```mermaid
sequenceDiagram
    actor U as Usuário
    participant A as App (LoginScreen)
    participant API as API (authController)
    participant S as authService
    participant R as usuarioRepository
    participant DB as PostgreSQL

    U->>A: informa e-mail e senha e toca em Entrar
    A->>API: POST /api/auth/login
    API->>S: login(email, senha)
    S->>R: buscarPorEmail(email)
    R->>DB: SELECT * FROM usuario WHERE email = $1 AND ativo = TRUE
    DB-->>R: linha ou vazio
    R-->>S: usuario ou null
    S->>S: bcrypt.compare(senha, senha_hash)
    S->>S: jwt.sign com id e tipo
    S-->>API: token e dados do usuário (sem hash)
    API-->>A: 200 token e usuario
    A->>A: salva token e usuario no AsyncStorage
    A-->>U: exibe a lista de chamados
```

### 5.2 Abrir chamado

```mermaid
sequenceDiagram
    actor C as Cliente
    participant A as App (CreateChamadoScreen)
    participant API as API
    participant MW as auth + authorize CLIENTE
    participant S as chamadoService
    participant CR as categoriaRepository
    participant HR as chamadoRepository

    C->>A: preenche formulário e toca em Criar chamado
    A->>API: POST /api/chamados com Bearer token
    API->>MW: valida JWT e perfil
    MW->>S: criar(body, usuario)
    S->>S: valida título e descrição
    S->>CR: buscarPorId(categoriaId)
    CR-->>S: categoria ativa
    S->>HR: criar(titulo, descricao, categoriaId, clienteId)
    HR-->>S: chamado criado (status ABERTO)
    S-->>API: chamado
    API-->>A: 201 chamado
    A-->>C: volta para a lista
```

### 5.3 Assumir e encerrar chamado

```mermaid
sequenceDiagram
    actor T as Técnico
    participant A as App (ChamadoDetailsScreen)
    participant API as API
    participant S as chamadoService
    participant R as chamadoRepository

    T->>A: toca em Assumir chamado
    A->>API: PATCH /api/chamados/:id/assumir
    API->>S: assumir(id, usuario)
    S->>R: buscarPorId(id)
    R-->>S: chamado com status ABERTO
    S->>R: atribuirTecnico(id, tecnicoId)
    R-->>S: chamado EM_ATENDIMENTO
    S-->>API: chamado
    API-->>A: 200 chamado
    A->>API: GET /api/chamados/:id (recarrega)

    T->>A: toca em Fechar chamado
    A->>API: PATCH /api/chamados/:id/encerrar
    API->>S: encerrar(id, usuario)
    S->>R: buscarPorId(id)
    S->>S: confere tecnico_id e status
    S->>R: atualizarStatus(id, FECHADO)
    R-->>S: chamado FECHADO
    S-->>API: chamado
    API-->>A: 200 chamado
```

## 6. Arquitetura do frontend

```mermaid
flowchart TB
    APP["App.js"] --> AP["AuthProvider (AuthContext)"]
    AP --> NAV["AppNavigator"]
    NAV -- "sem usuário" --> LOGIN["LoginScreen"]
    NAV -- "com usuário" --> LIST["ChamadosListScreen"]
    LIST --> CREATE["CreateChamadoScreen"]
    LIST --> DET["ChamadoDetailsScreen"]
    LOGIN --> API["services/api.js"]
    LIST --> API
    CREATE --> API
    DET --> API
    AP --> API
    API --> AS[("AsyncStorage")]
```

- **Estado global** mínimo: apenas a sessão (`usuario`), via Context API. Não há
  Redux nem outra biblioteca de estado.
- **Estado de tela** (listas, formulários, loading, erro) fica em `useState`
  local de cada tela.
- **Navegação condicional:** o `AppNavigator` monta pilhas diferentes conforme
  exista ou não `usuario`. Ao fazer login/logout, a troca de tela é automática.
- **Camada de rede única:** todas as chamadas passam por `services/api.js`, que
  injeta o token e padroniza erros.

Detalhes em [08 — Frontend](08-frontend.md).

## 7. Decisões de projeto

| Decisão | Motivo |
|---------|--------|
| Camadas + factory functions | Regra de negócio testável sem banco nem HTTP |
| `AppError` com `statusCode` | Services expressam falhas de negócio sem conhecer HTTP |
| JWT stateless | Simplicidade; sem tabela de sessões no MVP |
| `usuario` única para cliente e técnico (coluna `tipo`) | Evita duplicação; perfis têm os mesmos dados cadastrais |
| Enums como `VARCHAR` + `CHECK` | Portável e simples; evita `CREATE TYPE` no MVP |
| SQL puro com `pg` (sem ORM) | Controle total das consultas e menos dependências |
| `atualizado_em` por trigger | Garante consistência independentemente de quem altera os dados |
| Sem cadastro público | Requisito de controle de acesso: contas criadas pelo T.I. |
| Sem `components/` compartilhados | Telas pequenas e independentes no MVP |
