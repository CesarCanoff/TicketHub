# 11 — Segurança e LGPD

Este documento resume as medidas de segurança do TicketHub, as lacunas
identificadas e o plano de adequação à **LGPD** (Lei nº 13.709/2018). Ele é
baseado no *Relatório LGPD* do TCC e foi conferido contra o código.

> Este material tem finalidade técnica e acadêmica e **não constitui parecer
> jurídico**. A conformidade integral depende também de decisões
> organizacionais (bases legais, políticas, ambiente de implantação) que
> extrapolam o código.

## 1. Dados pessoais tratados

| Dado | Onde | Titular | Observação |
|------|------|---------|------------|
| Nome | `usuario.nome` | Usuário (cliente/técnico) | Dado pessoal |
| E-mail | `usuario.email` | Usuário | Dado pessoal; identificador de login |
| Hash da senha | `usuario.senha_hash` | Usuário | Credencial protegida por bcrypt |
| Perfil e situação da conta | `usuario.tipo`, `ativo` | Usuário | Dado associado ao titular |
| Datas de criação | `usuario.criado_em` | Usuário | — |
| Título e descrição do chamado | `chamado.titulo`, `descricao` | Cliente | **Texto livre**: pode conter dados pessoais ou sensíveis digitados pelo usuário |
| Vínculos cliente/técnico | `chamado.cliente_id`, `tecnico_id` | Ambos | Registro de quem atendeu quem |

Não há coleta de dados sensíveis por campos estruturados, mas o texto livre da
descrição exige atenção (princípios da **necessidade** e da **segurança**).

## 2. Medidas implementadas

| Medida | Implementação | Arquivo |
|--------|---------------|---------|
| Senhas com hash bcrypt | `bcrypt.compare` contra `senha_hash`; senha nunca armazenada em claro | `authService.js` |
| Hash nunca exposto | O login retorna apenas `id`, `nome`, `email`, `tipo` | `authService.js` |
| Mensagem de login genérica | "Credenciais inválidas." para e-mail ou senha errados (evita enumeração de contas) | `authService.js` |
| Contas inativas bloqueadas | `WHERE ativo = TRUE` | `usuarioRepository.js` |
| Autenticação por JWT | Token assinado, com expiração configurável | `authService.js`, `middlewares/auth.js` |
| Controle de acesso por perfil | `authorize(...)` nas rotas sensíveis | `middlewares/authorize.js`, `chamadoRoutes.js` |
| Isolamento de dados do cliente | Cliente só lista e vê os próprios chamados | `chamadoService.js` |
| Defesa em profundidade | Perfil validado na rota **e** no service | `chamadoRoutes.js`, `chamadoService.js` |
| SQL parametrizado | `$1, $2…` em todas as consultas (mitiga SQL Injection) | `repositories/*.js` |
| Validação de entrada | Título, descrição e categoria validados antes de gravar | `chamadoService.js` |
| Sem autocadastro | Contas só criadas pelo T.I. | Arquitetura |
| Segredos fora do código | `.env` ignorado pelo Git; apenas `.env.example` versionado | `.gitignore` |

## 3. Lacunas e riscos identificados

Classificação de prioridade: 🔴 alta · 🟠 média · 🟡 baixa.

| # | Prioridade | Lacuna | Detalhe | Onde |
|---|:----------:|--------|---------|------|
| 1 | 🔴 | **Visibilidade excessiva do técnico** | `listarParaTecnico()` retorna todos os chamados não fechados, mas o comentário do método diz "não atribuídos ou atribuídos a ele mesmo". Um técnico vê chamados em atendimento por colegas | `chamadoRepository.js` |
| 2 | 🔴 | **Tráfego sem criptografia** | O app usa `http://`. Em produção, credenciais e dados trafegariam em texto claro | `frontend/src/services/api.js` |
| 3 | 🔴 | **Token em armazenamento não seguro** | JWT salvo em `AsyncStorage` (não criptografado) | `AuthContext.js`, `api.js` |
| 4 | 🟠 | **Sem limite de tentativas de login** | Permite força bruta | `authRoutes.js` |
| 5 | 🟠 | **Mensagens de erro internas expostas** | Em erros inesperados, `err.message` (inclusive de banco) vai ao cliente | controllers |
| 6 | 🟠 | **CORS aberto** | `cors()` sem restrição de origem | `app.js` |
| 7 | 🟠 | **Sem política de privacidade / transparência** | O app não informa finalidade, bases legais, compartilhamento, retenção nem direitos | frontend |
| 8 | 🟠 | **Sem fluxo de direitos do titular** | Sem acesso, correção, anonimização, eliminação ou portabilidade | geral |
| 9 | 🟠 | **Sem retenção/eliminação** | Não há política nem rotina de expurgo ou anonimização | banco |
| 10 | 🟡 | **Sem auditoria/log de segurança** | Sem registro de eventos relevantes para apurar incidentes | backend |
| 11 | 🟡 | **Sem logout no servidor** | Token continua válido até expirar | backend |
| 12 | 🟡 | **Sem cabeçalhos de segurança** | Sem `helmet` | `app.js` |

> Estas lacunas **não** significam que todos os princípios da LGPD estejam
> violados; indicam pontos a avaliar e aprimorar, como aponta o relatório.

## 4. Plano de adequação

### 4.1 Correções técnicas (curto prazo)

| Ação | Resolve | Como |
|------|---------|------|
| Corrigir a consulta do técnico | #1 | `WHERE status = 'ABERTO' OR tecnico_id = $1` e passar o `id` do técnico desde o service |
| HTTPS em produção | #2 | Proxy reverso com TLS; trocar `BASE_URL` para `https://` |
| Armazenamento seguro | #3 | `expo-secure-store` no lugar do `AsyncStorage` para o token |
| Rate limiting no login | #4 | `express-rate-limit` na rota `/api/auth/login` |
| Handler global de erros | #5 | Middleware de erro que loga internamente e devolve mensagem genérica no 500 |
| CORS restrito | #6 | `cors({ origin: [...] })` |
| Cabeçalhos de segurança | #12 | `helmet()` |
| Validação robusta de entrada | #5 | Validar tipos de `id` e `categoriaId` (`Number.isInteger`) → 400 |

Exemplo de correção da consulta (item #1):

```js
// repository
async listarParaTecnico(tecnicoId) {
  const { rows } = await db.query(
    `${SELECT_BASE}
     WHERE c.status = 'ABERTO' OR (c.status = 'EM_ATENDIMENTO' AND c.tecnico_id = $1)
     ORDER BY c.criado_em ASC`,
    [tecnicoId]
  );
  return rows;
}
```

Atenção: essa mudança também altera o comportamento descrito em UC03 e nos
testes de `listar`; atualize-os junto.

### 4.2 Governança e transparência (médio prazo)

| Ação | Detalhe |
|------|---------|
| Mapear dados e finalidades | Inventário de dados pessoais por operação (tabela da seção 1 é o ponto de partida) |
| Definir bases legais | Escolha pela organização (ex.: execução de contrato, legítimo interesse, consentimento — conforme o caso) |
| Política de privacidade | Tela/aviso no app informando finalidade, compartilhamento, retenção e direitos |
| Aviso no campo de descrição | Orientar o usuário a **não** inserir dados pessoais desnecessários ou sensíveis |
| Canal do titular | Procedimento para localizar, corrigir e avaliar pedidos de eliminação/anonimização |
| Política de retenção | Prazo por finalidade; rotina de anonimização/eliminação de chamados antigos |
| Resposta a incidentes | Plano e responsáveis; avaliar comunicação à ANPD e aos titulares quando aplicável |
| Encarregado (DPO) | Avaliar a necessidade conforme a LGPD e as regras da ANPD |
| Revisão periódica | Reavaliar riscos e eficácia dos controles |

### 4.3 Direitos dos titulares × suporte técnico

| Direito (LGPD arts. 17–22) | Situação atual | Para atender |
|----------------------------|----------------|--------------|
| Confirmação de tratamento | ❌ | Procedimento administrativo |
| Acesso aos dados | ❌ | Consulta SQL por `usuario.id` ou rota de exportação |
| Correção | ❌ | Rota/rotina de edição de cadastro pelo T.I. |
| Anonimização/eliminação | ❌ | Rotina que anonimiza `nome`/`email` e preserva integridade dos chamados |
| Portabilidade | ❌ | Exportação em JSON/CSV |
| Informação sobre compartilhamento | ❌ | Política de privacidade |

## 5. Boas práticas de operação

- Nunca versionar `.env`; rotacionar `JWT_SECRET` se for exposto (invalida todos os tokens).
- Trocar as senhas de teste (`123456`) e **remover os usuários de seed** fora do ambiente de desenvolvimento.
- Banco com usuário de menor privilégio e backups criptografados.
- Manter dependências atualizadas (`npm audit`).
- Não registrar senhas, tokens ou descrições de chamados em logs.

## 6. Referências

- BRASIL. Lei nº 13.709/2018 — Lei Geral de Proteção de Dados Pessoais (LGPD).
- ANPD — materiais de orientação sobre direitos dos titulares, segurança da informação e comunicação de incidentes.
- UNIÃO EUROPEIA. Regulamento (UE) 2016/679 — GDPR.
