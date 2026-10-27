# 07 — Backend

Referência módulo a módulo de `backend/`. Para a visão arquitetural, veja
[04 — Arquitetura](04-arquitetura.md); para as rotas, [06 — API](06-api.md).

## 1. Scripts npm

| Comando | O que faz |
|---------|-----------|
| `npm start` | `node server.js` — produção/execução simples |
| `npm run dev` | `nodemon server.js` — reinicia ao salvar arquivos |
| `npm test` | `jest --runInBand` — roda os testes unitários |
| `npm run test:watch` | `jest --watch` — testes em modo observação |

## 2. Variáveis de ambiente

Definidas em `backend/.env` (modelo em `.env.example`):

| Variável | Obrigatória | Padrão | Descrição |
|----------|:-----------:|--------|-----------|
| `PORT` | ❌ | `3000` | Porta HTTP |
| `DATABASE_URL` | ✅ | — | String de conexão: `postgresql://usuario:senha@host:5432/tickethub` |
| `JWT_SECRET` | ✅ | — | Segredo de assinatura dos tokens. **Use um valor longo e aleatório** |
| `JWT_EXPIRES_IN` | ❌ | `8h` | Validade do token (formato do `jsonwebtoken`: `15m`, `8h`, `7d`) |

Gerar um segredo forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> O `dotenv` lê o `.env` do **diretório de trabalho atual**. Execute os comandos
> sempre de dentro de `backend/`.

## 3. Ponto de entrada

### `server.js`
Importa `src/app.js` e chama `app.listen(PORT)`. Separar `app` de `server`
permite importar o `app` em testes (ex.: com `supertest`) sem abrir porta.

### `src/app.js`
Configura o Express:

1. `dotenv.config()` — carrega variáveis antes de carregar as rotas.
2. `cors()` — libera todas as origens (adequado ao MVP; restrinja em produção).
3. `express.json()` — parse de corpo JSON.
4. `GET /health` — verificação de saúde.
5. `app.use('/api', routes)` — rotas da aplicação.
6. Handler final de 404: `{ "erro": "Rota não encontrada." }`.

## 4. `src/config/db.js`

Cria um `Pool` do `pg` com `DATABASE_URL` e registra um listener de `error`
no pool. Exporta o pool; os repositories chamam `db.query(sql, params)`.

## 5. `src/utils/AppError.js`

```js
new AppError(message, statusCode = 400)
```

Erro de aplicação com `statusCode` e `name = 'AppError'`. Lançado pelos
services; traduzido em resposta HTTP pelos controllers.

## 6. Middlewares

### `middlewares/auth.js`
1. Exige `Authorization: Bearer <token>`; senão 401 `Token não informado.`
2. Verifica o JWT com `JWT_SECRET`; falha → 401 `Token inválido ou expirado.`
3. Coloca o payload em `req.usuario` (`{ id, tipo, iat, exp }`) e chama `next()`.

### `middlewares/authorize.js`
```js
authorize('TECNICO')               // só técnicos
authorize('CLIENTE', 'TECNICO')    // ambos
```
Fábrica de middleware: compara `req.usuario.tipo` com os perfis permitidos;
senão 403 `Você não tem permissão para esta ação.` Deve vir **depois** de `auth`.

## 7. Rotas

| Arquivo | Prefixo | Rotas |
|---------|---------|-------|
| `routes/index.js` | `/api` | Agrega as três abaixo |
| `routes/authRoutes.js` | `/api/auth` | `POST /login` (pública) |
| `routes/categoriaRoutes.js` | `/api/categorias` | `GET /` (`auth`) |
| `routes/chamadoRoutes.js` | `/api/chamados` | `GET /`, `GET /:id`, `POST /` (`CLIENTE`), `PATCH /:id/assumir` (`TECNICO`), `PATCH /:id/encerrar` (`TECNICO`) |

Em `chamadoRoutes.js`, `router.use(auth)` protege todas as rotas do arquivo.

## 8. Controllers

Finos por definição: extraem dados da requisição, chamam o service e formatam a
resposta.

| Arquivo | Funções | Observação |
|---------|---------|------------|
| `authController.js` | `login` | Lê `email`, `senha` do corpo; 200 com o resultado |
| `categoriaController.js` | `listar` | Chama **direto o repository** (sem service, pois não há regra de negócio); 500 genérico em erro |
| `chamadoController.js` | `criar`, `listar`, `detalhes`, `assumir`, `encerrar` | Converte `req.params.id` com `Number()`; usa `req.usuario` como usuário logado; `criar` responde 201 |

## 9. Services (regras de negócio)

### `authService.js` — `createAuthService({ usuarioRepository, bcryptLib, jwtLib })`

`login(email, senha)`:

1. Falta e-mail ou senha → `AppError 400`.
2. `usuarioRepository.buscarPorEmail` (só usuários ativos); não achou → `401`.
3. `bcrypt.compare`; inválido → `401` (mesma mensagem).
4. `jwt.sign({ id, tipo }, JWT_SECRET, { expiresIn })`.
5. Retorna `{ token, usuario: { id, nome, email, tipo } }`.

`bcryptLib` e `jwtLib` são injetáveis (com padrão para as bibliotecas reais),
o que permite testar sem hash real.

### `chamadoService.js` — `createChamadoService({ chamadoRepository, categoriaRepository })`

Exporta também a constante `STATUS = { ABERTO, EM_ATENDIMENTO, FECHADO }`.

| Método | Regras |
|--------|--------|
| `criar({titulo, descricao, categoriaId}, usuario)` | Só `CLIENTE` (403); título e descrição não vazios após `trim` (400); categoria existente e ativa (400); cria com `clienteId = usuario.id` |
| `listar(usuario)` | `CLIENTE` → `listarPorCliente(id)`; senão → `listarParaTecnico()` |
| `buscarDetalhes(id, usuario)` | 404 se não existe; permite se for o cliente dono **ou** técnico; senão 403 |
| `assumir(id, usuario)` | Só `TECNICO` (403); 404; status deve ser `ABERTO` (409); `atribuirTecnico` |
| `encerrar(id, usuario)` | Só `TECNICO` (403); 404; `tecnico_id` deve ser o do usuário (403); não pode estar `FECHADO` (409); `atualizarStatus(FECHADO)` |

### `authServiceInstance.js` e `chamadoServiceInstance.js`
Compõem os services reais com os repositories reais. São os arquivos que os
controllers importam.

## 10. Repositories (acesso a dados)

Todas as consultas usam **parâmetros posicionais** (`$1`, `$2`...), nunca
concatenação de strings.

| Arquivo | Métodos |
|---------|---------|
| `usuarioRepository.js` | `buscarPorEmail(email)` (apenas ativos), `buscarPorId(id)` |
| `categoriaRepository.js` | `listarAtivas()`, `buscarPorId(id)` |
| `chamadoRepository.js` | `criar`, `buscarPorId`, `listarPorCliente`, `listarParaTecnico`, `atualizarStatus`, `atribuirTecnico` |

Em `chamadoRepository`, `criar`, `atualizarStatus` e `atribuirTecnico` executam
a escrita e depois chamam `buscarPorId` para devolver o chamado completo (com
nomes de categoria, cliente e técnico).

## 11. Checklist para adicionar uma nova funcionalidade

Exemplo: "cancelar chamado".

1. **Banco:** se necessário, ajustar `schema.sql` (ex.: novo valor no `CHECK` de `status`).
2. **Repository:** adicionar o método SQL em `chamadoRepository.js`.
3. **Service:** implementar a regra em `chamadoService.js` lançando `AppError`.
4. **Teste:** cobrir os cenários em `tests/services/chamadoService.test.js`.
5. **Controller + rota:** expor em `chamadoController.js` e `chamadoRoutes.js`, com `authorize(...)` se restrito a perfil.
6. **Documentação:** atualizar [06 — API](06-api.md) e os casos de uso.
7. **Frontend:** adicionar a função em `api.js` e a ação na tela.
