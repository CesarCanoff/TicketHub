# 06 — Referência da API

API REST em JSON. URL base em desenvolvimento: `http://localhost:3000`.

## 1. Convenções

| Item | Valor |
|------|-------|
| Prefixo | `/api` (exceto `/health`) |
| Formato | `application/json` (requisição e resposta) |
| Autenticação | Header `Authorization: Bearer <token>` |
| Campos do banco | Retornados em `snake_case` (`criado_em`, `tecnico_nome`...) |
| Campos de entrada | `camelCase` (`categoriaId`) |
| Erros | `{ "erro": "mensagem em português" }` |
| Datas | ISO 8601 na resposta (ex.: `2026-10-27T13:21:00.000Z`) |

### Códigos de status usados

| Código | Quando |
|--------|--------|
| 200 | Sucesso em leitura ou atualização |
| 201 | Chamado criado |
| 400 | Dados inválidos / ausentes |
| 401 | Credenciais inválidas, token ausente, inválido ou expirado |
| 403 | Perfil sem permissão ou recurso de outro usuário |
| 404 | Chamado ou rota inexistente |
| 409 | Conflito de estado (ex.: assumir chamado já em atendimento) |
| 500 | Erro interno |

## 2. Resumo dos endpoints

| Método | Rota | Autenticação | Perfil | Descrição |
|--------|------|:------------:|--------|-----------|
| GET | `/health` | ❌ | — | Verifica se a API está no ar |
| POST | `/api/auth/login` | ❌ | — | Autentica e devolve o JWT |
| GET | `/api/categorias` | ✅ | Qualquer | Lista categorias ativas |
| GET | `/api/chamados` | ✅ | Qualquer | Lista chamados (filtrada por perfil) |
| GET | `/api/chamados/:id` | ✅ | Dono ou técnico | Detalhes do chamado |
| POST | `/api/chamados` | ✅ | `CLIENTE` | Abre um chamado |
| PATCH | `/api/chamados/:id/assumir` | ✅ | `TECNICO` | Assume um chamado `ABERTO` |
| PATCH | `/api/chamados/:id/encerrar` | ✅ | `TECNICO` responsável | Encerra o chamado |

## 3. Objeto `Chamado`

Retornado por todas as rotas de chamados:

```json
{
  "id": 1,
  "titulo": "Backup nao esta funcionando",
  "descricao": "O sistema de backup automatico parou de funcionar...",
  "status": "ABERTO",
  "criado_em": "2026-10-27T13:21:00.000Z",
  "atualizado_em": "2026-10-27T13:21:00.000Z",
  "categoria_id": 2,
  "categoria_nome": "Recuperacao de dados",
  "cliente_id": 1,
  "cliente_nome": "Antonio Carlos Silveira",
  "tecnico_id": null,
  "tecnico_nome": null
}
```

| Campo | Tipo | Observação |
|-------|------|------------|
| `status` | string | `ABERTO`, `EM_ATENDIMENTO` ou `FECHADO` |
| `tecnico_id`, `tecnico_nome` | number/string \| null | `null` enquanto não assumido |

---

## 4. Endpoints

### 4.1 `GET /health`

Sem autenticação.

**200**
```json
{ "status": "ok" }
```

---

### 4.2 `POST /api/auth/login`

Autentica um usuário **ativo**.

**Corpo**

| Campo | Tipo | Obrigatório |
|-------|------|:-----------:|
| `email` | string | ✅ |
| `senha` | string | ✅ |

```json
{ "email": "carlos.silva@test.com", "senha": "123456" }
```

**200**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "usuario": {
    "id": 2,
    "nome": "Carlos Silva",
    "email": "carlos.silva@test.com",
    "tipo": "TECNICO"
  }
}
```

O token contém `{ id, tipo }` e expira conforme `JWT_EXPIRES_IN` (padrão `8h`).
O hash da senha **nunca** é retornado.

**Erros**

| Status | `erro` | Causa |
|--------|--------|-------|
| 400 | `Informe e-mail e senha.` | Campo ausente ou vazio |
| 401 | `Credenciais inválidas.` | E-mail inexistente, conta inativa ou senha errada |

---

### 4.3 `GET /api/categorias`

Lista categorias **ativas**, ordenadas por nome.

**200**
```json
[
  { "id": 3, "nome": "Hardware" },
  { "id": 5, "nome": "Acesso e senha" }
]
```

| Status | `erro` |
|--------|--------|
| 401 | `Token não informado.` / `Token inválido ou expirado.` |
| 500 | `Erro ao listar categorias.` |

---

### 4.4 `GET /api/chamados`

Comportamento por perfil:

| Perfil | Retorna | Ordenação |
|--------|---------|-----------|
| `CLIENTE` | Somente chamados em que `cliente_id` = usuário logado | `atualizado_em` **decrescente** |
| `TECNICO` | Todos com `status != 'FECHADO'` | `criado_em` **crescente** |

**200:** array de [`Chamado`](#3-objeto-chamado) (vazio se não houver).

---

### 4.5 `GET /api/chamados/:id`

**Parâmetro:** `id` — número do chamado.

**200:** objeto [`Chamado`](#3-objeto-chamado).

| Status | `erro` | Causa |
|--------|--------|-------|
| 404 | `Chamado não encontrado.` | Não existe |
| 403 | `Você não tem permissão para ver este chamado.` | Cliente tentando ver chamado de outro |

---

### 4.6 `POST /api/chamados`

Perfil: **`CLIENTE`**.

**Corpo**

| Campo | Tipo | Regra |
|-------|------|-------|
| `titulo` | string | Obrigatório, sem ser só espaços (máx. 150 no banco) |
| `descricao` | string | Obrigatório, sem ser só espaços |
| `categoriaId` | number | Deve existir e estar ativa |

```json
{
  "titulo": "Impressora não imprime",
  "descricao": "Aparece erro de papel atolado, mas não há papel preso.",
  "categoriaId": 6
}
```

**201:** o [`Chamado`](#3-objeto-chamado) criado (`status: "ABERTO"`, `tecnico_id: null`).

| Status | `erro` | Causa |
|--------|--------|-------|
| 403 | `Você não tem permissão para esta ação.` | Usuário é técnico |
| 400 | `O título é obrigatório.` | Título vazio |
| 400 | `A descrição é obrigatória.` | Descrição vazia |
| 400 | `Categoria de serviço inválida.` | Categoria inexistente ou inativa |

> `titulo` e `descricao` são gravados com `trim()` aplicado.

---

### 4.7 `PATCH /api/chamados/:id/assumir`

Perfil: **`TECNICO`**. Sem corpo.

Define o técnico logado como responsável e muda o status para `EM_ATENDIMENTO`.

**200:** o [`Chamado`](#3-objeto-chamado) atualizado.

| Status | `erro` | Causa |
|--------|--------|-------|
| 403 | `Você não tem permissão para esta ação.` | Usuário é cliente |
| 404 | `Chamado não encontrado.` | Não existe |
| 409 | `Este chamado já está em atendimento ou foi encerrado.` | Status diferente de `ABERTO` |

---

### 4.8 `PATCH /api/chamados/:id/encerrar`

Perfil: **`TECNICO`** responsável. Sem corpo.

**200:** o [`Chamado`](#3-objeto-chamado) com `status: "FECHADO"`.

| Status | `erro` | Causa |
|--------|--------|-------|
| 403 | `Você não tem permissão para esta ação.` | Usuário é cliente |
| 404 | `Chamado não encontrado.` | Não existe |
| 403 | `Apenas o técnico responsável pode encerrar este chamado.` | Outro técnico, ou chamado ainda sem responsável |
| 409 | `Este chamado já está encerrado.` | Já `FECHADO` |

---

## 5. Erros de autenticação (todas as rotas protegidas)

| Status | `erro` | Causa |
|--------|--------|-------|
| 401 | `Token não informado.` | Header ausente ou sem prefixo `Bearer ` |
| 401 | `Token inválido ou expirado.` | Assinatura inválida ou token vencido |
| 403 | `Você não tem permissão para esta ação.` | Perfil não autorizado para a rota |

## 6. Exemplos com `curl`

```bash
# 1) Login (guarde o token)
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"antonio@test.com","senha":"123456"}'

# 2) Exporte o token retornado
TOKEN="cole_o_token_aqui"

# 3) Listar categorias
curl -s http://localhost:3000/api/categorias -H "Authorization: Bearer $TOKEN"

# 4) Abrir chamado (como cliente)
curl -s -X POST http://localhost:3000/api/chamados \
  -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" \
  -d '{"titulo":"Rede lenta","descricao":"Internet caindo direto","categoriaId":1}'

# 5) Listar meus chamados
curl -s http://localhost:3000/api/chamados -H "Authorization: Bearer $TOKEN"
```

Fluxo completo como técnico (faça login com `carlos.silva@test.com`):

```bash
curl -s -X PATCH http://localhost:3000/api/chamados/1/assumir  -H "Authorization: Bearer $TOKEN_TECNICO"
curl -s -X PATCH http://localhost:3000/api/chamados/1/encerrar -H "Authorization: Bearer $TOKEN_TECNICO"
```

> No Windows PowerShell, use `curl.exe` (o `curl` é um alias de
> `Invoke-WebRequest`) e aspas duplas escapadas, ou prefira o Git Bash,
> Insomnia ou Postman.

## 7. Cliente HTTP do app

O app consome esta API pelo módulo `frontend/src/services/api.js`:

| Função | Chamada |
|--------|---------|
| `api.login(email, senha)` | `POST /auth/login` |
| `api.listarCategorias()` | `GET /categorias` |
| `api.listarChamados()` | `GET /chamados` |
| `api.buscarChamado(id)` | `GET /chamados/:id` |
| `api.criarChamado(dados)` | `POST /chamados` |
| `api.assumirChamado(id)` | `PATCH /chamados/:id/assumir` |
| `api.encerrarChamado(id)` | `PATCH /chamados/:id/encerrar` |
