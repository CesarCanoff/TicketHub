# 09 — Instalação e configuração

Guia completo para rodar o TicketHub do zero. Tempo estimado: 15 a 20 minutos.

## 1. Pré-requisitos

| Ferramenta | Versão | Para quê | Verificar |
|------------|--------|----------|-----------|
| Node.js | 18 ou superior (LTS) | Backend e Expo | `node -v` |
| npm | 9+ | Dependências | `npm -v` |
| PostgreSQL | 13+ | Banco de dados | `psql --version` |
| Git | qualquer recente | Clonar o repositório | `git --version` |
| Expo Go (celular) **ou** emulador | — | Executar o app | — |

Para o app você precisa de **um** destes:

- **Celular físico:** instale o *Expo Go* (Play Store / App Store).
- **Android:** Android Studio com um emulador (AVD).
- **iOS:** Xcode e simulador (somente macOS).

## 2. Clonar o repositório

```bash
git clone https://github.com/<seu-usuario>/tickethub.git
cd tickethub
```

## 3. Banco de dados

### 3.1 Criar o banco

```bash
createdb -U postgres tickethub
```

Se o `createdb` não estiver no PATH, use o `psql`:

```bash
psql -U postgres -c "CREATE DATABASE tickethub;"
```

### 3.2 Criar as tabelas e os dados iniciais

Na raiz do repositório:

```bash
psql -U postgres -d tickethub -f schema.sql
```

### 3.3 Conferir

```bash
psql -U postgres -d tickethub -c "SELECT id, nome, email, tipo FROM usuario;"
```

Deve listar Antonio (`CLIENTE`) e Carlos (`TECNICO`).

> **Windows:** se `psql` não for reconhecido, adicione
> `C:\Program Files\PostgreSQL\<versão>\bin` ao PATH, ou abra o *SQL Shell
> (psql)* instalado com o PostgreSQL. No pgAdmin, também é possível abrir o
> `schema.sql` na *Query Tool* e executá-lo.

## 4. Backend

```bash
cd backend
npm install
cp .env.example .env        # Windows (cmd): copy .env.example .env
```

Edite `backend/.env`:

```env
PORT=3000
DATABASE_URL=postgresql://postgres:SUA_SENHA@localhost:5432/tickethub
JWT_SECRET=<um segredo longo e aleatório>
JWT_EXPIRES_IN=8h
```

Gere um `JWT_SECRET` seguro:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

> Se a senha do PostgreSQL tiver caracteres especiais (`@`, `:`, `/`, `#`),
> codifique-os na URL (ex.: `@` → `%40`).

Inicie a API:

```bash
npm run dev
```

Saída esperada: `TicketHub API rodando na porta 3000`.

### 4.1 Testar a API

```bash
curl http://localhost:3000/health
# {"status":"ok"}

curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"antonio@test.com","senha":"123456"}'
```

A segunda chamada deve retornar um `token` e os dados do usuário.

## 5. Frontend (app)

Em **outro terminal**, a partir da raiz do repositório:

```bash
cd frontend
npm install
```

### 5.1 Ajustar a URL da API

Edite `frontend/src/services/api.js` conforme seu ambiente:

| Onde o app roda | `BASE_URL` |
|-----------------|------------|
| Emulador iOS | `http://localhost:3000/api` |
| Emulador Android | `http://10.0.2.2:3000/api` |
| Celular físico | `http://<IP-DA-SUA-MÁQUINA>:3000/api` |

Descobrir o IP da máquina:

```bash
# Windows
ipconfig          # procure "Endereço IPv4"
# macOS
ipconfig getifaddr en0
# Linux
hostname -I
```

### 5.2 Iniciar o Expo

```bash
npx expo start
```

- **Celular:** escaneie o QR Code com o Expo Go (Android) ou com a câmera (iOS).
- **Emulador Android:** pressione `a` no terminal.
- **Simulador iOS:** pressione `i` (macOS).

### 5.3 Entrar no app

| Perfil | E-mail | Senha |
|--------|--------|-------|
| Cliente | `antonio@test.com` | `123456` |
| Técnico | `carlos.silva@test.com` | `123456` |

## 6. Roteiro de teste manual (smoke test)

1. Entre como **Antonio (cliente)** → deve ver "Backup nao esta funcionando" (Aberto).
2. Toque em **+ Novo chamado**, preencha título, descrição, escolha uma categoria e crie.
3. O novo chamado aparece na lista. Toque **Sair**.
4. Entre como **Carlos (técnico)** → vê os dois chamados abertos (mais antigo primeiro).
5. Abra um chamado → **Assumir chamado** → status passa para *Em atendimento*.
6. Toque **Fechar chamado** → status passa para *Fechado*.
7. Volte à lista: o chamado fechado sai da fila do técnico.
8. Entre novamente como Antonio: o chamado aparece como *Fechado* na lista dele.

## 7. Rodar os testes

```bash
cd backend
npm test
```

Não precisa de banco rodando. Veja [10 — Testes](10-testes.md).

## 8. Troubleshooting

| Sintoma | Causa provável | Solução |
|---------|----------------|---------|
| `ECONNREFUSED` ao subir/usar a API | PostgreSQL parado ou `DATABASE_URL` errada | Inicie o serviço do PostgreSQL; confira usuário, senha, host, porta e nome do banco |
| `password authentication failed` | Senha incorreta na `DATABASE_URL` | Corrija o `.env` (codifique caracteres especiais) |
| `relation "usuario" does not exist` | `schema.sql` não foi executado | Rode o passo 3.2 no banco correto |
| `secretOrPrivateKey must have a value` | `JWT_SECRET` ausente | Defina no `.env` e reinicie a API |
| `.env` ignorado | Comando executado fora de `backend/` | Rode `npm run dev` dentro de `backend/` |
| Login retorna "Credenciais inválidas." com a senha certa | Seed antigo com hash fictício | Reexecute o `schema.sql` atual (ou gere novo hash e faça `UPDATE`) |
| `Network request failed` no app | `BASE_URL` incorreta, API fora do ar ou redes diferentes | Use o IP da máquina; confirme mesma rede Wi-Fi; teste `http://IP:3000/health` no navegador do celular |
| Funciona no navegador do celular mas não no app | Firewall bloqueando a porta 3000 | Libere a porta 3000 no firewall |
| `Unable to resolve module expo-status-bar` | Dependência não instalada | `cd frontend && npm install` (já consta no `package.json`) |
| Tela branca / erro estranho após trocar dependências | Cache do Metro | `npx expo start -c` |
| `Port 3000 is already in use` | Outro processo na porta | Mude `PORT` no `.env` e ajuste a `BASE_URL` |
| `npm test` falha com "jest não encontrado" | Dependências não instaladas | `cd backend && npm install` |
| Aviso de versões incompatíveis do Expo | Pacotes fora do SDK 51 | `npx expo install --check` |

## 9. Executando em produção (visão geral)

O projeto é um MVP acadêmico. Antes de qualquer implantação real, leia
[11 — Segurança e LGPD](11-seguranca-e-lgpd.md) e
[12 — Limitações](12-limitacoes-e-roadmap.md). No mínimo:

- Servir a API **somente via HTTPS** (proxy reverso, p.ex. Nginx).
- Usar `JWT_SECRET` forte, único e fora do repositório.
- Restringir o CORS às origens necessárias.
- Usar um usuário de banco com privilégios mínimos (não `postgres`).
- Fazer backup do banco e definir política de retenção.
- Gerar um *build* do app com `eas build` (Expo Application Services).
