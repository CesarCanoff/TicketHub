<div align="center">

# 🎫 TicketHub

**Sistema de gerenciamento de chamados com app mobile, API REST e PostgreSQL.**

![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-13%2B-4169E1?logo=postgresql&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.74-61DAFB?logo=react&logoColor=black)
![Expo](https://img.shields.io/badge/Expo-SDK%2051-000020?logo=expo&logoColor=white)
![Jest](https://img.shields.io/badge/tests-Jest-C21325?logo=jest&logoColor=white)
![Status](https://img.shields.io/badge/status-MVP-orange)

</div>

---

## 📖 Sobre o projeto

O **TicketHub** é um MVP desenvolvido como Trabalho de Conclusão de Curso (TCC).
Ele organiza o suporte de T.I. de uma empresa em um fluxo simples e rastreável:

> **Cliente abre o chamado → Técnico assume → Técnico encerra**

Existem dois perfis, com permissões distintas:

| Perfil | Pode |
|--------|------|
| **Cliente** | Abrir chamados e acompanhar **apenas os seus** |
| **Técnico** | Ver a fila, assumir chamados abertos e encerrar os que assumiu |

As contas são **provisionadas internamente pelo T.I.** — não há cadastro público.

## ✨ Funcionalidades

- 🔐 Autenticação por e-mail e senha com **JWT** e senhas protegidas com **bcrypt**
- 👥 Controle de acesso por perfil (cliente / técnico)
- 📝 Abertura de chamados com título, descrição e categoria de serviço
- 📋 Listagem filtrada por perfil, com status colorido e data da última atualização
- 🔎 Detalhes do chamado, incluindo o técnico responsável
- 🙋 Atribuição (assumir) e ✅ encerramento de chamados, com regras de negócio protegidas no backend
- 🧪 Regras de negócio cobertas por testes unitários, **sem precisar de banco**

## 🧱 Tecnologias

| Camada | Tecnologias |
|--------|-------------|
| **App mobile** | React Native, Expo SDK 51, React Navigation, AsyncStorage |
| **API** | Node.js, Express, `pg`, `jsonwebtoken`, `bcryptjs`, `cors`, `dotenv` |
| **Banco de dados** | PostgreSQL (constraints, índices e trigger) |
| **Testes** | Jest |

## 🏗️ Arquitetura

```mermaid
flowchart LR
    APP["📱 App React Native"] -- "HTTP/JSON + JWT" --> API["⚙️ API Express"]
    API -- "SQL parametrizado" --> DB[("🐘 PostgreSQL")]
```

O backend segue uma arquitetura em camadas, com injeção de dependência nos
services para permitir testes sem banco:

```
Rotas → Middlewares (auth/authorize) → Controllers → Services → Repositories → PostgreSQL
```

## 📁 Estrutura do repositório

```
tickethub/
├── backend/            API REST (Node.js + Express)
│   ├── server.js
│   ├── src/            routes · middlewares · controllers · services · repositories
│   └── tests/          testes unitários (Jest)
├── frontend/           App mobile (React Native + Expo)
│   └── src/            screens · navigation · context · services · theme
├── docs/               Documentação completa
├── schema.sql          Criação do banco + dados de teste
└── README.md
```

---

## 🚀 Como executar

### Pré-requisitos

- [Node.js](https://nodejs.org/) **18 ou superior** e npm
- [PostgreSQL](https://www.postgresql.org/download/) **13 ou superior**
- [Git](https://git-scm.com/)
- App **Expo Go** no celular (Android/iOS) **ou** um emulador/simulador

### Passo 1 — Clonar o repositório

```bash
git clone https://github.com/<seu-usuario>/tickethub.git
cd tickethub
```

### Passo 2 — Criar o banco de dados

```bash
createdb -U postgres tickethub
psql -U postgres -d tickethub -f schema.sql
```

> ⚠️ O `schema.sql` recria as tabelas (`DROP TABLE IF EXISTS`). Use somente em desenvolvimento.

### Passo 3 — Configurar e iniciar o backend

```bash
cd backend
npm install
cp .env.example .env          # Windows (cmd): copy .env.example .env
```

Edite o arquivo `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/tickethub
JWT_SECRET=troque_por_um_segredo_longo_e_aleatorio
JWT_EXPIRES_IN=8h
```

> 💡 Gere um segredo forte com:
> `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`

Inicie a API:

```bash
npm run dev
```

Verifique: <http://localhost:3000/health> deve responder `{"status":"ok"}`.

### Passo 4 — Configurar e iniciar o app

Em **outro terminal**:

```bash
cd frontend
npm install
```

Abra `frontend/src/services/api.js` e ajuste a `BASE_URL` conforme onde o app vai rodar:

| Onde o app roda | `BASE_URL` |
|-----------------|------------|
| Emulador iOS | `http://localhost:3000/api` |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Celular físico (Expo Go) | `http://<IP-DA-SUA-MÁQUINA>:3000/api` |

> No celular físico, o aparelho e o computador devem estar na **mesma rede Wi-Fi**
> e a porta `3000` liberada no firewall.

Inicie o Expo:

```bash
npx expo start
```

Escaneie o QR Code com o Expo Go, ou pressione `a` (Android) / `i` (iOS).

### Passo 5 — Entrar no app

| Perfil | E-mail | Senha |
|--------|--------|-------|
| 👤 Cliente | `antonio@test.com` | `123456` |
| 🛠️ Técnico | `carlos.silva@test.com` | `123456` |

> 🔒 Credenciais **somente para desenvolvimento**. Não use em produção.

### Roteiro rápido para validar

1. Entre como **cliente**, toque em **+ Novo chamado** e crie um chamado.
2. Saia e entre como **técnico**.
3. Abra o chamado → **Assumir chamado** → **Fechar chamado**.
4. Volte como cliente e veja o status *Fechado*.

---

## 🧪 Testes

```bash
cd backend
npm test
```

Os testes cobrem os *services* (`authService` e `chamadoService`), onde estão as
regras de negócio. Os repositories são substituídos por mocks, portanto **não é
preciso ter o PostgreSQL rodando**.

Regras verificadas: só cliente abre chamado · só técnico assume/encerra · chamado
em atendimento não pode ser reassumido · só o técnico responsável encerra · cliente
só vê os próprios chamados · login nunca devolve o hash da senha.

## 🔌 API em resumo

| Método | Rota | Acesso |
|--------|------|--------|
| `POST` | `/api/auth/login` | Público |
| `GET` | `/api/categorias` | Autenticado |
| `GET` | `/api/chamados` | Autenticado (filtrado por perfil) |
| `GET` | `/api/chamados/:id` | Dono do chamado ou técnico |
| `POST` | `/api/chamados` | Cliente |
| `PATCH` | `/api/chamados/:id/assumir` | Técnico |
| `PATCH` | `/api/chamados/:id/encerrar` | Técnico responsável |
| `GET` | `/health` | Público |

Exemplo rápido:

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"antonio@test.com","senha":"123456"}'
```

📘 Referência completa com payloads e erros: [`docs/06-api.md`](docs/06-api.md).

## 📚 Documentação

| Documento | Conteúdo |
|-----------|----------|
| [Visão geral](docs/01-visao-geral.md) | Escopo, perfis, stack, glossário |
| [Requisitos](docs/02-requisitos.md) | RFs, regras de negócio e rastreabilidade |
| [Casos de uso](docs/03-casos-de-uso.md) | UC01–UC07 com fluxos e código correspondente |
| [Arquitetura](docs/04-arquitetura.md) | Camadas, diagramas de sequência, decisões |
| [Banco de dados](docs/05-banco-de-dados.md) | Modelo ER, dicionário de dados, trigger |
| [API](docs/06-api.md) | Endpoints, payloads e erros |
| [Backend](docs/07-backend.md) | Referência módulo a módulo |
| [Frontend](docs/08-frontend.md) | Telas, navegação e sessão |
| [Instalação](docs/09-instalacao-e-configuracao.md) | Passo a passo e troubleshooting |
| [Testes](docs/10-testes.md) | Estratégia, inventário e lacunas |
| [Segurança e LGPD](docs/11-seguranca-e-lgpd.md) | Medidas, riscos e plano de adequação |
| [Limitações e roadmap](docs/12-limitacoes-e-roadmap.md) | Problemas conhecidos e próximos passos |
| [Contribuição](docs/13-contribuicao.md) | Padrão de commits, branches e estilo |

Índice completo em [`docs/README.md`](docs/README.md).

## 🔐 Segurança e LGPD

Medidas já implementadas: hash bcrypt, JWT com expiração, autorização por perfil,
isolamento dos dados do cliente e consultas SQL parametrizadas.

Por ser um MVP, existem pontos a evoluir antes de qualquer uso em produção (HTTPS,
armazenamento seguro do token, limitação de tentativas de login, política de
privacidade e retenção de dados). Veja a análise em
[`docs/11-seguranca-e-lgpd.md`](docs/11-seguranca-e-lgpd.md) e os problemas
conhecidos em [`docs/12-limitacoes-e-roadmap.md`](docs/12-limitacoes-e-roadmap.md).

## 🗺️ Roadmap

- [ ] Fila do técnico restrita a chamados disponíveis ou atribuídos a ele
- [ ] Atribuição de chamado atômica (evitar disputa entre técnicos)
- [ ] HTTPS, `helmet`, rate limiting e `expo-secure-store`
- [ ] Testes de integração (`supertest`) e de interface
- [ ] Comentários, anexos e notificações push
- [ ] Prioridade, SLA e perfil administrador

## 🤝 Contribuindo

Contribuições são bem-vindas. Leia o [guia de contribuição](docs/13-contribuicao.md):
usamos **Conventional Commits** (`feat(chamados): ...`) e branches por tipo
(`feat/`, `fix/`, `docs/`).

## 👤 Autor

**César Eduardo de Almeida Canoff**
Projeto desenvolvido como Trabalho de Conclusão de Curso — polo Naviraí.

---

<div align="center">
Feito com ☕ e muito React Native.
</div>
