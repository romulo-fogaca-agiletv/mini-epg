# ARCHITECTURE.md

Arquitetura atual do mini-epg, descrita a partir do código do branch `lab2/rfogaca`. Onde o código e a documentação divergem, vale o código.
O antigo `docs/architecture-old.md` (março de 2023) está desatualizado; as contradições estão listadas [no fim](#contradições-com-docsarchitecture-oldmd).

## Visão geral

```
 provedor ──feed (arquivo)──▶ src/legacy/importer.js ──escreve──▶ data/schedule.json
 (cron noturno, epg-batch-01)                                       │
                                                  data/channels.json│
                                                         ▼          ▼
 navegador ──HTTP──▶ src/server.js ─▶ src/app.js ─▶ src/epg/* ─▶ src/epg/store.js
   public/ (estático)                    │
                                         └────────▶ src/users/favorites.js (memória)
```

Há dois processos independentes, que só se comunicam pelo arquivo `data/schedule.json`:
- o **servidor da API**, que é Express e só lê esse arquivo;
- o **importer**, um script Node avulso que só escreve nele.

## Módulos e limites

| Módulo | Responsabilidade | Depende de | Não deve |
|---|---|---|---|
| `src/server.js` | Abre a porta (`PORT`, padrão 3000). | `app.js` | Ter lógica ou rotas. |
| `src/app.js` | Cria o app Express: JSON, estáticos de `public/`, todas as rotas e o handler de erro 500. Exporta `app` sem chamar `listen`, para os testes usarem supertest. | `epg/*`, `users/favorites` | Ler arquivos de dados diretamente. |
| `src/epg/store.js` | Carrega `channels.json` e `schedule.json` uma única vez, com `require`, na inicialização. Expõe `getChannels()` (ordenados por número), `getChannel(id)` e `getProgrammes()`. É a **única porta de acesso aos dados de guia**. | `data/*.json` | Ser chamado com escrita (os dados são só leitura em runtime). |
| `src/epg/schedule.js` | A grade de um canal num dia civil de São Paulo (03:00Z a 03:00Z). | `store` | |
| `src/epg/nowPlaying.js` | O programa no ar em cada canal num instante; exporta também `saoPauloDate()`, que hoje não é usado. | `store` | |
| `src/epg/reminders.js` | Os programas que começam nos próximos 10 minutos nos canais informados (`upcomingReminders`). Módulo puro: compara instantes `Date`, devolve `minutesRemaining` e a classificação, sem filtrar por ela. | `store` | |
| `src/epg/search.js` | Substring em nome de canal e título de programa; no máximo 20 programas. | `store` | |
| `src/epg/ratings.js` | A escala ClassInd, a idade mínima e os textos oficiais. Módulo puro, **ainda não importado por ninguém**. | nada | |
| `src/users/favorites.js` | Favoritos por `userId` num `Map` em memória, com limite de 50. `_reset()` existe só para testes. | nada | Validar se o canal existe; isso fica em `app.js`. |
| `src/legacy/importer.js` | Lê o feed (uma linha por `<programme>`), limpa títulos, resolve sobreposições, calcula o `score` com boost de prime-time e grava o JSON. Roda pela linha de comando (`npm run import`, ou o cron em produção). | `fs`, `data/channels.json` | **Ser alterado** (regras não documentadas). Não é importado pela API. |
| `public/` | O guia web em JS puro, sem build: lista de canais, grade de `2026-10-20` fixa, favoritos de `demo-user`, busca e avisos de lembrete (consulta `/users/:userId/reminders` a cada 15 s; `?now=<ISO>` na URL fixa o "agora" do guia). | só a API HTTP | |

### Regras que atravessam módulos
- **Tempo:** todos os horários são strings ISO com offset fixo `-03:00`, gravadas assim pelo importer. As comparações são feitas como instantes `Date`, e não há biblioteca de fuso horário. O guia web só recorta `HH:MM` da string.
- **Validação de favoritos:** a checagem de canal existente fica em `app.js`, via `store.getChannel`. O limite e a deduplicação ficam em `favorites.js`.
- **Persistência:** não há banco nem cache. Programação e canais vêm de arquivo, carregado só na inicialização. Um novo `schedule.json` só entra em vigor quando o servidor reinicia. Os favoritos se perdem ao reiniciar. Os lembretes não são armazenados: são calculados a cada consulta a partir dos favoritos e da programação.
- **Dependências de runtime:** apenas `express` (`package.json:16-18`).

## Contradições com `docs/architecture-old.md`

| # | O doc antigo diz | O código mostra | Evidência |
|---|---|---|---|
| 1 | O app Express fica em `src/index.js`. | O app está em `src/app.js`, e o ponto de entrada é `src/server.js`. `src/index.js` não existe. | `docs/architecture-old.md:7`; `src/app.js:10`, `src/app.js:58`; `src/server.js:2-5`; `package.json:5`, `package.json:9` |
| 2 | As rotas ficam em `src/routes/`. | Todas as rotas estão em `src/app.js`. O diretório `src/routes/` não existe. | `docs/architecture-old.md:7`; `src/app.js:14-50` |
| 3 | Favoritos ficam no Redis (`REDIS_URL`). | Ficam num `Map` em memória. Não há cliente Redis nem `REDIS_URL`. | `docs/architecture-old.md:8`; `src/users/favorites.js:2-4`; `package.json:16-18` |
| 4 | A programação fica no Redis. | Vem de `data/schedule.json`, carregado com `require`. | `docs/architecture-old.md:8`; `src/epg/store.js:4-5` |
| 5 | O importer roda de hora em hora dentro do processo da API (`setInterval`). | É um script avulso, executado só como `main`, com cron noturno em epg-batch-01. A API não o importa e não há `setInterval`. | `docs/architecture-old.md:9-10`; `src/legacy/importer.js:4`, `src/legacy/importer.js:132-134`; `src/app.js:1-8` |
| 6 | O importer baixa o feed por FTP. | Lê um arquivo local cujo caminho vem pela linha de comando. Não há código de FTP. | `docs/architecture-old.md:10`; `src/legacy/importer.js:124-126`; `package.json:13` |
| 7 | A busca usa o índice `epg-programmes` do Elasticsearch. | É um `filter` + `includes` em memória sobre os dados do `store`. Não há cliente Elasticsearch. | `docs/architecture-old.md:11`; `src/epg/search.js:11-18`; `package.json:16-18` |
| 8 | A busca ignora acentos (`asciifolding`). | Neste branch ela diferencia acentos **e** maiúsculas (`includes` puro). | `docs/architecture-old.md:11-12`; `src/epg/search.js:9`, `src/epg/search.js:13`, `src/epg/search.js:17` |
| 9 | Os horários são guardados em UTC. | São guardados com offset `-03:00`, já em horário de São Paulo. | `docs/architecture-old.md:16`; `data/schedule.json:8`; `src/legacy/importer.js:28`, `src/legacy/importer.js:36-41` |
| 10 | O frontend converte para São Paulo com moment-timezone. | O frontend só recorta a string (`slice(11, 16)`). moment-timezone não é dependência. | `docs/architecture-old.md:16-17`; `public/app.js:10-11`; `package.json:16-23` |
| 11 | A classificação segue a US TV Parental Guidelines (TV-Y, TV-PG, TV-14, TV-MA). | Segue a ClassInd: `L`, `10`, `12`, `14`, `16`, `18`. O padrão do importer é `L`. | `docs/architecture-old.md:21`; `src/epg/ratings.js:2-4`; `src/legacy/importer.js:30` |
| 12 | Pergunta aberta: levar os favoritos para Postgres. | O código fala em migrar para Redis, não Postgres. Nenhum dos dois existe hoje. | `docs/architecture-old.md:25`; `src/users/favorites.js:2` |

O único ponto do doc antigo que ainda vale é o perfil infantil com filtro de classificação (`docs/architecture-old.md:26`): continua sendo um pedido do jurídico e continua sem implementação. `src/epg/ratings.js` existe, mas nenhuma rota o usa.

## Pontos que o código não esclarece
- O importer calcula `p.score` (`src/legacy/importer.js:119`), mas o `data/schedule.json` versionado não tem esse campo. Não dá para saber se o arquivo foi gerado por outra versão do importer ou se foi editado depois.
- O doc antigo não diz quando deixou de valer. O comentário em `src/users/favorites.js:2` ainda aponta para ele como referência.
