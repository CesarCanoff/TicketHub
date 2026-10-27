# 02 — Requisitos

Este documento consolida os requisitos funcionais (RF), as regras de negócio
(RN) e os requisitos não funcionais observáveis no sistema, com a
rastreabilidade até os casos de uso e ao código que os implementa.

## 1. Requisitos funcionais

A numeração e os nomes abaixo seguem a tabela de rastreabilidade do documento
da Etapa 3 do TCC.

| ID | Requisito | Casos de uso | Onde está implementado |
|----|-----------|--------------|------------------------|
| RF01 | Autenticação de usuários | UC01, UC02 | `authService.js`, `authController.js`, `LoginScreen.js`, `AuthContext.js` |
| RF02 | Controle de acesso por perfil | UC03, UC05, UC06, UC07 | `middlewares/auth.js`, `middlewares/authorize.js`, `chamadoService.js` |
| RF03 | Gerenciamento de chamados | UC03, UC05, UC06, UC07 | `chamadoService.js`, `chamadoRepository.js` |
| RF04 | Visualização de chamados | UC03 | `chamadoService.listar`, `ChamadosListScreen.js` |
| RF05 | Criação de chamado | UC05 | `chamadoService.criar`, `CreateChamadoScreen.js` |
| RF06 | Visualização da última atualização | UC03, UC04 | coluna `atualizado_em` + trigger; telas de lista e detalhes |
| RF07 | Visualização do status | UC03, UC04 | coluna `status`; `statusInfo` em `theme/colors.js` |
| RF08 | Visualização dos detalhes do chamado | UC04 | `chamadoService.buscarDetalhes`, `ChamadoDetailsScreen.js` |
| RF09 | Atribuição de técnico | UC06 | `chamadoService.assumir`, `chamadoRepository.atribuirTecnico` |
| RF10 | Encerramento de chamado | UC07 | `chamadoService.encerrar`, `chamadoRepository.atualizarStatus` |
| RF11 | Restrição de encerramento | UC07 | verificação de `tecnico_id` em `chamadoService.encerrar` |

### Critérios de aceite resumidos

| ID | Critério de aceite |
|----|--------------------|
| RF01 | Com e-mail e senha válidos de uma conta ativa, o usuário recebe um JWT e entra no app; com dados inválidos, recebe "Credenciais inválidas." |
| RF02 | Rotas protegidas retornam 401 sem token válido e 403 quando o perfil não tem permissão |
| RF04 | Cliente vê apenas seus chamados; técnico vê os chamados não encerrados |
| RF05 | Chamado só é criado com título, descrição e categoria ativa; nasce `ABERTO` e sem técnico |
| RF06/RF07 | Lista e detalhes exibem data de atualização e status com cor/rótulo |
| RF08 | Detalhes mostram número, título, status, descrição, categoria, datas e técnico (ou "Ainda não atribuído") |
| RF09 | Só técnicos assumem; só chamados `ABERTO`; o status passa a `EM_ATENDIMENTO` |
| RF10/RF11 | Só o técnico responsável encerra; o status passa a `FECHADO`; chamado já fechado não é encerrado de novo |

## 2. Regras de negócio

| ID | Regra | Aplicada em |
|----|-------|-------------|
| RN01 | Não existe cadastro público; contas são criadas pelo T.I. | Ausência de rota/tela de registro; `schema.sql` |
| RN02 | Somente usuários **ativos** (`ativo = TRUE`) conseguem autenticar-se | `usuarioRepository.buscarPorEmail` |
| RN03 | A mensagem de falha de login é única ("Credenciais inválidas.") para não revelar se o e-mail existe | `authService.login` |
| RN04 | Somente **clientes** abrem chamados | `authorize('CLIENTE')` + `chamadoService.criar` |
| RN05 | Título e descrição são obrigatórios e não podem ser só espaços | `chamadoService.criar` |
| RN06 | A categoria deve existir e estar **ativa** | `chamadoService.criar` |
| RN07 | Todo chamado nasce com status `ABERTO` e sem técnico | Default do banco + `chamadoRepository.criar` |
| RN08 | Cliente só visualiza chamados que ele mesmo abriu | `chamadoService.listar` e `buscarDetalhes` |
| RN09 | Técnico visualiza qualquer chamado (detalhes) | `chamadoService.buscarDetalhes` |
| RN10 | Somente **técnicos** assumem chamados | `authorize('TECNICO')` + `chamadoService.assumir` |
| RN11 | Só é possível assumir chamados com status `ABERTO` | `chamadoService.assumir` (409 caso contrário) |
| RN12 | Um chamado tem no máximo **um** técnico responsável | Coluna única `tecnico_id` |
| RN13 | Somente o **técnico responsável** encerra o chamado | `chamadoService.encerrar` |
| RN14 | Chamado já `FECHADO` não pode ser encerrado novamente | `chamadoService.encerrar` (409) |
| RN15 | A data de atualização é renovada automaticamente a cada alteração | Trigger `trg_chamado_atualizado_em` |
| RN16 | Categorias inativas somem das listagens, mas o histórico é preservado | `categoriaRepository.listarAtivas` |
| RN17 | O hash da senha nunca é retornado pela API | `authService.login` |

## 3. Requisitos não funcionais

A especificação original numera requisitos não funcionais (os casos de uso
citam **RNF01** e **RNF06**). O texto integral dessa lista pertence às etapas
anteriores do TCC e **não está reproduzido no código**. O quadro abaixo traz o
que é **verificável na implementação atual**, associando a referência RNF
quando ela é citada nos casos de uso.

| Categoria | Requisito observado | Referência | Evidência |
|-----------|---------------------|------------|-----------|
| Controle de acesso | Acesso restrito por perfil; cliente isolado dos dados de outros clientes | RNF01 (citado em UC01–UC04) | `authorize.js`, `chamadoService.js` |
| Autenticação | Credenciais fornecidas pela empresa; sem autocadastro | RNF06 (citado em UC01) | Ausência de rota de registro |
| Segurança | Senhas armazenadas apenas como hash bcrypt | — | `authService.js`, `schema.sql` |
| Segurança | Sessão por token JWT com expiração configurável (padrão 8h) | — | `authService.js`, `.env.example` |
| Segurança | Consultas SQL parametrizadas (mitiga SQL Injection) | — | `repositories/*.js` |
| Portabilidade | Aplicativo multiplataforma (Android/iOS) | — | Expo / React Native |
| Manutenibilidade | Camadas separadas (rota → controller → service → repository) | — | `backend/src/` |
| Testabilidade | Regra de negócio testável sem banco (injeção de dependência) | — | `services/*.js`, `tests/` |
| Usabilidade | Interface em português, status com cor e rótulo | — | `theme/colors.js`, telas |
| Disponibilidade | Endpoint de verificação de saúde | — | `GET /health` |

> **Nota:** se a banca ou a documentação oficial do TCC exigir a lista
> completa RNF01–RNFxx, complemente este quadro com o texto original.

## 4. Matriz de rastreabilidade requisito × caso de uso

|  | UC01 | UC02 | UC03 | UC04 | UC05 | UC06 | UC07 |
|--|:----:|:----:|:----:|:----:|:----:|:----:|:----:|
| RF01 | ● | ● | | | | | |
| RF02 | | | ● | | ● | ● | ● |
| RF03 | | | ● | | ● | ● | ● |
| RF04 | | | ● | | | | |
| RF05 | | | | | ● | | |
| RF06 | | | ● | ● | | | |
| RF07 | | | ● | ● | | | |
| RF08 | | | | ● | | | |
| RF09 | | | | | | ● | |
| RF10 | | | | | | | ● |
| RF11 | | | | | | | ● |
