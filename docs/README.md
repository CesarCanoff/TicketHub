# Documentação do TicketHub

Índice completo da documentação técnica e funcional do projeto. Os documentos
estão numerados na ordem sugerida de leitura.

| # | Documento | Para quem | O que você encontra |
|---|-----------|-----------|---------------------|
| 01 | [Visão geral](01-visao-geral.md) | Todos | Objetivo, escopo, perfis, stack, glossário |
| 02 | [Requisitos](02-requisitos.md) | Todos | Requisitos funcionais, regras de negócio e rastreabilidade |
| 03 | [Casos de uso](03-casos-de-uso.md) | Todos | UC01–UC07 com fluxos e mapeamento para o código |
| 04 | [Arquitetura](04-arquitetura.md) | Devs | Camadas, injeção de dependência, fluxos e diagramas |
| 05 | [Banco de dados](05-banco-de-dados.md) | Devs / DBA | Modelo ER, dicionário de dados, constraints, trigger, seed |
| 06 | [Referência da API](06-api.md) | Devs | Todos os endpoints, payloads, erros e exemplos `curl` |
| 07 | [Backend](07-backend.md) | Devs | Referência módulo a módulo (controllers, services, repositories) |
| 08 | [Frontend](08-frontend.md) | Devs | Telas, navegação, contexto de autenticação, tema |
| 09 | [Instalação e configuração](09-instalacao-e-configuracao.md) | Devs | Passo a passo detalhado, variáveis de ambiente, troubleshooting |
| 10 | [Testes](10-testes.md) | Devs / QA | Estratégia, inventário dos testes, cobertura e lacunas |
| 11 | [Segurança e LGPD](11-seguranca-e-lgpd.md) | Todos | Medidas implementadas, lacunas e plano de adequação |
| 12 | [Limitações e roadmap](12-limitacoes-e-roadmap.md) | Todos | Problemas conhecidos e evolução planejada |
| 13 | [Contribuição e convenções](13-contribuicao.md) | Devs | Padrão de commits, branches e estilo de código |

## Como esta documentação foi construída

O conteúdo foi produzido a partir de três fontes, todas do próprio projeto:

1. **Código-fonte** (`backend/` e `frontend/`) — fonte da verdade para
   comportamento, mensagens de erro e códigos HTTP.
2. **Documento da Etapa 3 do TCC** — casos de uso, diagrama de classes e
   modelagem do banco.
3. **Relatório LGPD** — análise de proteção de dados e lacunas identificadas.

> Sempre que houver divergência entre a documentação e o código, **o código
> prevalece**. Se encontrar uma divergência, abra uma issue ou corrija o
> documento junto com a alteração de código.

## Convenções usadas nos documentos

- Os nomes de tabelas, colunas, rotas e mensagens de erro são mantidos em
  **português**, exatamente como aparecem no código.
- Diagramas usam [Mermaid](https://mermaid.js.org/), renderizado nativamente
  pelo GitHub.
- Caminhos de arquivo são relativos à raiz do repositório.
