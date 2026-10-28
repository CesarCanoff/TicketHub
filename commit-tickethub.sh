#!/usr/bin/env bash
# ==============================================================================
# commit-tickethub.sh
# Cria o histórico do TicketHub em commits pequenos e padronizados
# (Conventional Commits), na ordem em que o projeto seria construído.
#
# Uso:
#   ./commit-tickethub.sh [opções]
#
# Opções:
#   --dry-run          Só mostra os commits que seriam feitos (não altera nada)
#   --remote <url>     Define/atualiza o remote "origin" (ex.: URL do GitHub)
#   --push             Envia a branch para o origin ao final (git push -u)
#   --branch <nome>    Nome da branch (padrão: main)
#   -h, --help         Mostra esta ajuda
#
# Exemplos:
#   ./commit-tickethub.sh --dry-run
#   ./commit-tickethub.sh --remote https://github.com/usuario/tickethub.git --push
#
# Características:
#   * Idempotente: se um grupo de arquivos não tem alterações, o commit é pulado.
#   * Seguro: aborta se já existirem arquivos em stage, para não misturar commits.
#   * Nunca usa --force nem reescreve histórico.
#
# No Windows, execute pelo Git Bash.
# ==============================================================================
set -euo pipefail

BRANCH="main"
REMOTE_URL=""
DO_PUSH=false
DRY_RUN=false

# ---------- cores (desativadas se não for terminal) ----------
if [[ -t 1 ]]; then
  C_RESET=$'\033[0m'; C_GREEN=$'\033[32m'; C_YELLOW=$'\033[33m'
  C_RED=$'\033[31m'; C_CYAN=$'\033[36m'; C_DIM=$'\033[2m'
else
  C_RESET=""; C_GREEN=""; C_YELLOW=""; C_RED=""; C_CYAN=""; C_DIM=""
fi

info()  { printf '%s\n' "${C_CYAN}[info]${C_RESET} $*"; }
ok()    { printf '%s\n' "${C_GREEN}[ ok ]${C_RESET} $*"; }
warn()  { printf '%s\n' "${C_YELLOW}[warn]${C_RESET} $*" >&2; }
fail()  { printf '%s\n' "${C_RED}[erro]${C_RESET} $*" >&2; exit 1; }

usage() { sed -n '3,26p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

# ---------- argumentos ----------
while [[ $# -gt 0 ]]; do
  case "$1" in
    --dry-run) DRY_RUN=true ;;
    --push)    DO_PUSH=true ;;
    --remote)  [[ $# -ge 2 ]] || fail "--remote exige uma URL"; REMOTE_URL="$2"; shift ;;
    --branch)  [[ $# -ge 2 ]] || fail "--branch exige um nome"; BRANCH="$2"; shift ;;
    -h|--help) usage ;;
    *) fail "Opção desconhecida: $1 (use --help)" ;;
  esac
  shift
done

# Executa sempre a partir da pasta do script (raiz do repositório)
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCRIPT_NAME="$(basename "${BASH_SOURCE[0]}")"

# ---------- pré-requisitos ----------
if ! $DRY_RUN; then
  command -v git >/dev/null 2>&1 || fail "Git não encontrado. Instale em https://git-scm.com/"

  if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
    info "Inicializando repositório Git (branch: $BRANCH)"
    if ! git init -q -b "$BRANCH" 2>/dev/null; then
      git init -q
      git symbolic-ref HEAD "refs/heads/$BRANCH"
    fi
  fi

  [[ -n "$(git config user.name  || true)" ]] || fail 'Configure seu nome:  git config --global user.name  "Seu Nome"'
  [[ -n "$(git config user.email || true)" ]] || fail 'Configure seu e-mail: git config --global user.email "voce@exemplo.com"'

  if ! git diff --cached --quiet 2>/dev/null; then
    fail "Há arquivos em stage. Faça commit ou 'git restore --staged .' antes de rodar este script."
  fi

  current_branch="$(git symbolic-ref --short HEAD 2>/dev/null || true)"
  if [[ -n "$current_branch" && "$current_branch" != "$BRANCH" ]]; then
    warn "Branch atual é '$current_branch' (esperado: '$BRANCH'). Os commits serão feitos nela."
    BRANCH="$current_branch"
  fi
fi

# ---------- helper de commit ----------
TOTAL=0
CREATED=0
SKIPPED=0

# commit "<mensagem>" "<corpo ou vazio>" <caminho>...
commit() {
  local msg="$1" body="$2"; shift 2
  local paths=() p
  for p in "$@"; do
    if [[ -e "$p" ]]; then paths+=("$p"); else warn "caminho não existe, ignorado: $p"; fi
  done
  TOTAL=$((TOTAL + 1))

  if (( ${#paths[@]} == 0 )); then
    warn "nenhum arquivo para: $msg"; SKIPPED=$((SKIPPED + 1)); return
  fi

  if $DRY_RUN; then
    printf '%s\n' "${C_GREEN}$(printf '%02d' "$TOTAL")${C_RESET} $msg"
    printf '%s\n' "${C_DIM}     ${paths[*]}${C_RESET}"
    return
  fi

  git add -- "${paths[@]}"
  if git diff --cached --quiet; then
    printf '%s\n' "${C_DIM}-- sem alterações, pulado: $msg${C_RESET}"
    SKIPPED=$((SKIPPED + 1)); return
  fi

  if [[ -n "$body" ]]; then
    git commit -q -m "$msg" -m "$body"
  else
    git commit -q -m "$msg"
  fi
  CREATED=$((CREATED + 1))
  ok "$msg"
}

info "Criando commits do TicketHub..."
$DRY_RUN && info "(modo --dry-run: nada será alterado)"
echo

# ==============================================================================
# 1. Base do repositório
# ==============================================================================
commit "chore: adiciona configuração base do repositório" \
  "Inclui .gitignore (node_modules, .env, builds do Expo), .gitattributes para normalizar finais de linha e .editorconfig." \
  .gitignore .gitattributes .editorconfig

# ==============================================================================
# 2. Banco de dados
# ==============================================================================
commit "feat(db): adiciona schema PostgreSQL e dados iniciais" \
  "Cria as tabelas usuario, categoria_servico e chamado com constraints, índices e trigger de atualizado_em. Seed com 2 usuários de teste (senha 123456), 7 categorias e 1 chamado de exemplo." \
  schema.sql

# ==============================================================================
# 3. Backend
# ==============================================================================
commit "chore(backend): inicializa projeto Node.js" \
  "Adiciona package.json (Express, pg, jsonwebtoken, bcryptjs, Jest) e .env.example." \
  backend/package.json backend/.env.example

commit "feat(backend): adiciona conexão com PostgreSQL e AppError" \
  "Pool do pg configurado via DATABASE_URL e erro de aplicação com status HTTP." \
  backend/src/config backend/src/utils

commit "feat(auth): adiciona serviço de autenticação" \
  "Login com bcrypt e JWT, sem expor o hash da senha. Service criado por factory para permitir mocks nos testes." \
  backend/src/repositories/usuarioRepository.js \
  backend/src/services/authService.js \
  backend/src/services/authServiceInstance.js

commit "test(auth): cobre login do authService" \
  "Credenciais válidas, e-mail inexistente, senha incorreta e campos vazios." \
  backend/tests/services/authService.test.js

commit "feat(middlewares): adiciona autenticação JWT e autorização por perfil" \
  "auth valida o Bearer token; authorize restringe rotas por tipo de usuário." \
  backend/src/middlewares

commit "feat(auth): expõe rota de login" \
  "" \
  backend/src/controllers/authController.js \
  backend/src/routes/authRoutes.js

commit "feat(categorias): adiciona listagem de categorias de serviço" \
  "Repository, controller e rota GET /api/categorias (apenas categorias ativas)." \
  backend/src/repositories/categoriaRepository.js \
  backend/src/controllers/categoriaController.js \
  backend/src/routes/categoriaRoutes.js

commit "feat(chamados): adiciona repository de chamados" \
  "Consultas parametrizadas com JOIN de categoria, cliente e técnico (LEFT JOIN)." \
  backend/src/repositories/chamadoRepository.js

commit "feat(chamados): adiciona regras de negócio de chamados" \
  "Criar, listar por perfil, ver detalhes, assumir e encerrar, com validação de perfil, status e responsável." \
  backend/src/services/chamadoService.js \
  backend/src/services/chamadoServiceInstance.js

commit "test(chamados): cobre regras do chamadoService" \
  "14 testes: criação, listagem por perfil, permissão de detalhes, assumir e encerrar." \
  backend/tests/services/chamadoService.test.js

commit "feat(chamados): expõe rotas de chamados" \
  "POST / (cliente), GET /, GET /:id, PATCH /:id/assumir e /:id/encerrar (técnico)." \
  backend/src/controllers/chamadoController.js \
  backend/src/routes/chamadoRoutes.js

commit "feat(api): monta aplicação Express e inicia servidor" \
  "Agrega as rotas em /api, adiciona /health, CORS, JSON e handler de 404." \
  backend/src/routes/index.js \
  backend/src/app.js \
  backend/server.js

# ==============================================================================
# 4. Frontend
# ==============================================================================
commit "chore(frontend): inicializa app React Native com Expo" \
  "Adiciona package.json (Expo SDK 51, React Navigation, AsyncStorage, expo-status-bar) e app.json." \
  frontend/package.json frontend/app.json

commit "feat(frontend): adiciona tema e cliente HTTP" \
  "Paleta de cores, rótulos e cores de status e api.js com injeção automática do token." \
  frontend/src/theme frontend/src/services

commit "feat(frontend): adiciona contexto de autenticação" \
  "Sessão persistida no AsyncStorage com login, logout e restauração ao abrir o app." \
  frontend/src/context

commit "feat(frontend): adiciona tela de login" \
  "" \
  frontend/src/screens/LoginScreen.js

commit "feat(frontend): adiciona listagem de chamados" \
  "Lista com pull-to-refresh, status colorido e botão de novo chamado para clientes." \
  frontend/src/screens/ChamadosListScreen.js

commit "feat(frontend): adiciona tela de novo chamado" \
  "Formulário com título, descrição e categorias carregadas da API." \
  frontend/src/screens/CreateChamadoScreen.js

commit "feat(frontend): adiciona detalhes do chamado com ações do técnico" \
  "Botões Assumir e Fechar exibidos conforme perfil, status e responsável." \
  frontend/src/screens/ChamadoDetailsScreen.js

commit "feat(frontend): adiciona navegação e ponto de entrada do app" \
  "Pilha condicional (login x telas autenticadas) e AuthProvider na raiz." \
  frontend/src/navigation frontend/App.js

# ==============================================================================
# 5. Documentação
# ==============================================================================
commit "docs(requisitos): adiciona visão geral e requisitos" \
  "Escopo, perfis, stack, glossário, requisitos funcionais, regras de negócio e rastreabilidade." \
  docs/01-visao-geral.md docs/02-requisitos.md

commit "docs(casos-de-uso): documenta UC01 a UC07" \
  "Fluxos principais e alternativos com o mapeamento para o código." \
  docs/03-casos-de-uso.md

commit "docs(arquitetura): descreve camadas, injeção de dependência e fluxos" \
  "Diagramas Mermaid de arquitetura e de sequência." \
  docs/04-arquitetura.md

commit "docs(db): documenta modelo de dados" \
  "Diagrama ER e de classes, dicionário de dados, constraints, índices, trigger e seed." \
  docs/05-banco-de-dados.md

commit "docs(api): adiciona referência dos endpoints" \
  "Payloads, códigos de status, mensagens de erro e exemplos com curl." \
  docs/06-api.md

commit "docs(codigo): adiciona referência de backend e frontend" \
  "" \
  docs/07-backend.md docs/08-frontend.md

commit "docs(setup): adiciona guia de instalação e documentação de testes" \
  "Passo a passo, variáveis de ambiente, troubleshooting, roteiro de teste manual e inventário dos testes." \
  docs/09-instalacao-e-configuracao.md docs/10-testes.md

commit "docs(seguranca): adiciona análise de segurança e LGPD" \
  "Dados tratados, medidas implementadas, lacunas e plano de adequação." \
  docs/11-seguranca-e-lgpd.md

commit "docs: adiciona limitações conhecidas, roadmap e guia de contribuição" \
  "Inclui padrão de commits (Conventional Commits), branches e checklist de PR." \
  docs/12-limitacoes-e-roadmap.md docs/13-contribuicao.md

commit "docs: adiciona índice da documentação" \
  "" \
  docs/README.md

commit "docs: adiciona README do projeto" \
  "Apresentação, tecnologias, arquitetura, passo a passo para executar, testes, API, roadmap e contribuição." \
  README.md

# ==============================================================================
# Finalização
# ==============================================================================
echo
if $DRY_RUN; then
  info "Dry-run concluído: $TOTAL commits planejados."
  exit 0
fi

ok "Commits criados: $CREATED | pulados: $SKIPPED | total de grupos: $TOTAL"

# Arquivos que ficaram de fora (exceto este script)
leftovers="$(git status --porcelain | grep -v " $SCRIPT_NAME\$" || true)"
if [[ -n "$leftovers" ]]; then
  warn "Arquivos fora dos commits acima:"
  printf '%s\n' "$leftovers" >&2
  warn "Adicione-os manualmente com: git add <arquivo> && git commit -m \"tipo(escopo): descrição\""
fi

echo
git --no-pager log --oneline --reverse | tail -n "$((CREATED > 0 ? CREATED : 10))"

# ---------- remote / push ----------
if [[ -n "$REMOTE_URL" ]]; then
  if git remote get-url origin >/dev/null 2>&1; then
    [[ "$(git remote get-url origin)" == "$REMOTE_URL" ]] || { git remote set-url origin "$REMOTE_URL"; info "origin atualizado para $REMOTE_URL"; }
  else
    git remote add origin "$REMOTE_URL"
    info "origin configurado: $REMOTE_URL"
  fi
fi

if $DO_PUSH; then
  git remote get-url origin >/dev/null 2>&1 || fail "Sem remote 'origin'. Use --remote <url>."
  info "Enviando '$BRANCH' para origin..."
  git push -u origin "$BRANCH"
  ok "Push concluído."
else
  echo
  info "Para publicar no GitHub:"
  echo "  git remote add origin https://github.com/<seu-usuario>/tickethub.git"
  echo "  git push -u origin $BRANCH"
  echo "  (ou rode novamente com: --remote <url> --push)"
fi
