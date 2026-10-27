# 10 — Testes

## 1. Estratégia

Os testes são **unitários** e focam nos **services** (`authService` e
`chamadoService`), que concentram toda a regra de negócio. Os repositories são
substituídos por mocks do Jest (`jest.fn()`), portanto:

- **não é necessário banco de dados** nem servidor rodando;
- os testes são rápidos e determinísticos;
- cada teste verifica uma regra de negócio específica, inclusive o código HTTP
  esperado (`statusCode`).

Isso é possível graças à injeção de dependência por factory
(veja [04 — Arquitetura](04-arquitetura.md#3-injeção-de-dependência-factory-functions)).

## 2. Como executar

```bash
cd backend
npm install
npm test               # execução única (jest --runInBand)
npm run test:watch     # reexecuta ao salvar arquivos
npx jest --coverage    # relatório de cobertura
npx jest tests/services/chamadoService.test.js   # um arquivo
npx jest -t "assume"   # testes cujo nome contém "assume"
```

## 3. Inventário dos testes (18)

### `tests/services/authService.test.js` — 4 testes

| Teste | Regra verificada |
|-------|------------------|
| autentica com credenciais válidas e retorna token | Devolve `token` e dados do usuário; **`senha_hash` nunca é retornado** |
| rejeita e-mail inexistente | 401 |
| rejeita senha incorreta | 401 |
| rejeita quando e-mail ou senha não são informados | 400 e **não consulta o banco** |

### `tests/services/chamadoService.test.js` — 14 testes

| Grupo | Teste | Regra |
|-------|-------|-------|
| `criar` | cliente consegue abrir chamado com dados válidos | Cria com `clienteId` do usuário; status `ABERTO` |
| | técnico não pode abrir chamado | 403 e não grava |
| | rejeita chamado sem título | 400 (título só com espaços) |
| | rejeita categoria inexistente ou inativa | 400 |
| `listar` | cliente vê apenas os próprios chamados | Usa `listarPorCliente(id)` |
| | técnico vê a fila de chamados disponíveis | Usa `listarParaTecnico()` |
| `buscarDetalhes` | cliente não pode ver chamado de outro cliente | 403 |
| | lança 404 quando o chamado não existe | 404 |
| `assumir` | técnico assume um chamado aberto | `atribuirTecnico`; status `EM_ATENDIMENTO` |
| | não permite assumir chamado em atendimento | 409 |
| | cliente não pode assumir chamado | 403 |
| `encerrar` | técnico responsável encerra o chamado | Status `FECHADO` |
| | técnico que não é o responsável não pode encerrar | 403 |
| | não permite encerrar chamado já fechado | 409 |

## 4. Padrão usado nos testes

```js
function criarMocks() {
  const chamadoRepository = { criar: jest.fn(), buscarPorId: jest.fn(), /* ... */ };
  const categoriaRepository = { buscarPorId: jest.fn() };
  return { chamadoRepository, categoriaRepository };
}

test('técnico assume um chamado aberto', async () => {
  const { chamadoRepository, categoriaRepository } = criarMocks();
  chamadoRepository.buscarPorId.mockResolvedValue({ id: 1, status: STATUS.ABERTO });
  chamadoRepository.atribuirTecnico.mockResolvedValue({ id: 1, status: STATUS.EM_ATENDIMENTO });

  const service = createChamadoService({ chamadoRepository, categoriaRepository });
  const resultado = await service.assumir(1, TECNICO);

  expect(chamadoRepository.atribuirTecnico).toHaveBeenCalledWith(1, TECNICO.id);
  expect(resultado.status).toBe(STATUS.EM_ATENDIMENTO);
});
```

Para erros de negócio, o padrão é:

```js
await expect(service.assumir(1, CLIENTE)).rejects.toMatchObject({ statusCode: 403 });
```

## 5. O que NÃO está coberto (lacunas conhecidas)

| Área | Situação | Sugestão |
|------|----------|----------|
| Middlewares `auth` e `authorize` | Sem testes | Testes unitários com `req/res/next` falsos |
| Controllers e rotas (HTTP) | Sem testes | Testes de integração com `supertest` (já está em `devDependencies`, ainda sem uso) |
| Repositories (SQL real) | Sem testes | Testes de integração com um PostgreSQL de teste (ex.: Docker) |
| Trigger `atualizado_em` | Sem testes | Teste de integração com banco |
| Frontend | Sem testes | `jest-expo` + React Native Testing Library |
| `listarParaTecnico` | Mockado nos testes de `listar` | Teste de integração que valide o filtro de visibilidade do técnico |

## 6. Matriz de regras × testes

| Regra | Coberta por |
|-------|-------------|
| RN03/RN17 Login sem vazar hash e com erro genérico | `authService` (testes 1–3) |
| RN04 Só cliente abre chamado | `criar` › técnico não pode abrir |
| RN05 Título obrigatório | `criar` › rejeita chamado sem título |
| RN06 Categoria válida | `criar` › rejeita categoria inexistente |
| RN08 Cliente só vê os seus | `listar` e `buscarDetalhes` |
| RN10/RN11 Assumir | `assumir` (3 testes) |
| RN13/RN14 Encerrar | `encerrar` (3 testes) |
| RN05 Descrição obrigatória | ⚠️ sem teste dedicado |
| RN09 Técnico vê qualquer chamado | ⚠️ sem teste dedicado |
| RN02 Só usuários ativos logam | ⚠️ regra está no SQL do repository; sem teste |

## 7. Teste manual / integração

Para validar o sistema ponta a ponta, siga o roteiro de
[09 — Instalação, seção 6](09-instalacao-e-configuracao.md#6-roteiro-de-teste-manual-smoke-test)
ou use os exemplos `curl` de [06 — API](06-api.md#6-exemplos-com-curl).
