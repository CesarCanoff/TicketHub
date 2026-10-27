# 12 — Limitações conhecidas e roadmap

Transparência sobre o estado do MVP: o que ainda não funciona como deveria e o
que está planejado. Itens de segurança estão detalhados em
[11 — Segurança e LGPD](11-seguranca-e-lgpd.md).

## 1. Limitações conhecidas

### 1.1 Backend

| ID | Limitação | Impacto | Onde |
|----|-----------|---------|------|
| L01 | `listarParaTecnico` retorna todos os chamados não fechados (inclusive os em atendimento por outros técnicos); o comentário no código indica outra intenção | Visibilidade além da regra de negócio | `chamadoRepository.js` |
| L02 | **Corrida em `assumir`**: lê o chamado e depois faz `UPDATE` sem condicionar ao status. Dois técnicos simultâneos podem assumir o mesmo chamado (o último vence) | Inconsistência de responsável | `chamadoService.js`, `chamadoRepository.js` |
| L03 | `id` de rota não validado: `Number('abc')` vira `NaN` e o erro do `pg` retorna como 500 com a mensagem interna | Resposta imprópria e vazamento de detalhe | `chamadoController.js` |
| L04 | `categoriaId` não validado quanto ao tipo | Mesmo efeito de L03 | `chamadoService.criar` |
| L05 | Erros inesperados devolvem `err.message` ao cliente | Vazamento de detalhes internos | controllers |
| L06 | JSON malformado no corpo cai no tratador padrão do Express (fora do formato `{ erro }`) | Resposta inconsistente | `app.js` |
| L07 | Sem paginação nas listagens | Lentidão com muitos chamados | `chamadoRepository.js` |
| L08 | Sem limite de tamanho de `descricao` na API (campo `TEXT`) e `titulo` acima de 150 caracteres gera erro de banco (500) | Erro genérico para o usuário | `chamadoService.criar` |
| L09 | JWT sem revogação; logout apenas local | Token válido até expirar | `authService.js` |
| L10 | Sem refresh token: após o prazo (8h) o usuário precisa logar de novo | UX | — |
| L11 | Sem logs estruturados nem auditoria | Difícil investigar incidentes | — |
| L12 | O banco não garante que `cliente_id` seja `CLIENTE` e `tecnico_id` seja `TECNICO` | Depende da camada de services | `schema.sql` |
| L13 | Sem migrations; o `schema.sql` recria tudo (`DROP TABLE`) | Não serve para evoluir um banco com dados | `schema.sql` |
| L14 | `usuarioRepository.buscarPorId` existe, mas não é usado | Código ocioso | `usuarioRepository.js` |
| L15 | `supertest` está em `devDependencies` sem uso | Dependência ociosa | `package.json` |

### 1.2 Frontend

| ID | Limitação | Impacto | Onde |
|----|-----------|---------|------|
| L16 | `BASE_URL` fixa no código | Troca manual por ambiente | `api.js` |
| L17 | Token expirado (401) não desloga automaticamente; o usuário vê erros até sair manualmente | UX ruim após 8h | `api.js`, `AuthContext.js` |
| L18 | Sessão restaurada sem validar o token no servidor | Entra logado com token vencido | `AuthContext.js` |
| L19 | Erros ao carregar a lista vão só para `console.warn` | Falha silenciosa | `ChamadosListScreen.js` |
| L20 | Token em `AsyncStorage` (sem criptografia) | Segurança | `AuthContext.js` |
| L21 | Sem confirmação antes de assumir/fechar chamado | Cliques acidentais | `ChamadoDetailsScreen.js` |
| L22 | Em telas com cabeçalho nativo, há também um "‹ Voltar" e títulos desenhados na própria tela | Redundância visual | `ChamadoDetailsScreen.js`, `CreateChamadoScreen.js` |
| L23 | Sem testes automatizados de interface | Regressões visuais não detectadas | — |
| L24 | Sem tela de recuperação/troca de senha | Depende do T.I. | — |
| L25 | `colors.primaryDark` e a pasta `components/` não são utilizados | Código ocioso | `theme/colors.js` |

### 1.3 Produto

- Sem comentários, anexos, notificações, prioridade, SLA ou relatórios.
- Sem reabertura de chamado e sem devolução de chamado à fila.
- Sem gestão de usuários e categorias pela interface (feita por SQL).
- Sem perfil administrador.

## 2. Roadmap sugerido

### Fase 1 — Correções e robustez

- [ ] Corrigir `listarParaTecnico` (L01) e atualizar testes/UC03.
- [ ] Tornar `assumir` atômico: `UPDATE ... WHERE id = $1 AND status = 'ABERTO'` e tratar 0 linhas afetadas como 409 (L02).
- [ ] Validar `id` e `categoriaId` (L03, L04) e limitar tamanhos (L08).
- [ ] Middleware global de erros com resposta genérica no 500 (L05, L06).
- [ ] Tratar 401 no app com logout automático (L17, L18).
- [ ] Exibir erros de carregamento na lista (L19).

### Fase 2 — Segurança e LGPD

- [ ] HTTPS, `helmet`, CORS restrito, `express-rate-limit`.
- [ ] `expo-secure-store` para o token.
- [ ] Política de privacidade no app e aviso no campo de descrição.
- [ ] Rotinas de retenção e anonimização.

### Fase 3 — Qualidade

- [ ] Testes de middlewares e de integração (`supertest` + banco de teste).
- [ ] Testes de componentes no app.
- [ ] Migrations (ex.: `node-pg-migrate`) no lugar do `DROP TABLE`.
- [ ] CI com GitHub Actions (lint + testes).
- [ ] Configuração por ambiente (`expo-constants`/`.env`) para `BASE_URL`.

### Fase 4 — Funcionalidades

- [ ] Comentários/histórico de atendimento.
- [ ] Anexos (imagens).
- [ ] Notificações push (Expo Notifications).
- [ ] Prioridade e SLA.
- [ ] Filtros e busca; paginação.
- [ ] Perfil administrador e gestão de usuários/categorias.
- [ ] Reabertura de chamado.
