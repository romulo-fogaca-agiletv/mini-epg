# PRODUCT.md

Comportamento de produto do mini-epg, confirmado no código do branch `lab2/rfogaca`.
O que o código não confirma está em [Perguntas abertas](#perguntas-abertas).

## Fluxos de usuário

### Guia web (`public/`)
1. **Ver canais.** Ao abrir a página, a lista de canais aparece ordenada pelo número do canal, e cada um tem uma estrela de favorito.
2. **Ver a grade de um canal.** Clicar no nome do canal mostra os programas do dia, cada um com horário de início e fim, título e selo de classificação.
   - O dia é fixo em `2026-10-20` (`TODAY` em `public/app.js`). Não há seletor de data.
3. **Favoritar.** Clicar na estrela adiciona ou remove o canal dos favoritos. O usuário é fixo, `demo-user`.
   - Se a API recusar (limite atingido), a estrela acende do mesmo jeito: a interface não verifica a resposta.
4. **Buscar.** Digitar no campo de busca dispara a consulta 250 ms depois da última tecla.
   - Mostra a contagem de canais e de programas encontrados e até 8 nomes.
   - Campo vazio limpa o resultado.

### API (sem interface no guia)
- **Programação do dia:** `GET /channels/:id/schedule?date=YYYY-MM-DD`.
  - O dia é o dia civil de São Paulo, e um programa entra se qualquer parte dele cair nesse dia.
  - Sem `date`, o servidor usa a data UTC atual.
  - Canal inexistente retorna 404.
- **No ar agora:** `GET /now-playing?at=<ISO>` retorna, para cada canal, o programa em exibição ou `null`.
  - Esse fluxo não é usado pelo guia web.
  - Neste branch ele não retorna nada entre 21h e meia-noite de São Paulo. O bug está corrigido no `lab1/rfogaca`.
- **Busca:** `GET /search?q=` procura no nome do canal e no título do programa.
  - Usa substring simples, que diferencia maiúsculas e acentos.
  - Retorna no máximo 20 programas e não limita os canais.
- **Favoritos:** `GET`, `POST` e `DELETE` em `/users/:userId/favorites`. As regras estão abaixo.

## Classificação indicativa (ClassInd)

| Código | Idade mínima | Texto exibido |
|---|---|---|
| `L` | 0 | Livre para todos os públicos |
| `10` | 10 | Não recomendado para menores de 10 anos |
| `12` | 12 | Não recomendado para menores de 12 anos |
| `14` | 14 | Não recomendado para menores de 14 anos |
| `16` | 16 | Não recomendado para menores de 16 anos |
| `18` | 18 | Não recomendado para menores de 18 anos |

- Programas sem classificação no feed entram como `L` (regra do importer).
- O guia mostra apenas o código (ex.: `14`) num selo. O texto e a idade mínima de `src/epg/ratings.js` não são usados por nenhuma rota nem pela interface.
- Nenhum fluxo filtra por classificação hoje.
- **Regra obrigatória (jurídico):** um programa `18` nunca pode aparecer no perfil infantil. O perfil infantil ainda não existe.

## Favoritos

- **Limite de 50 canais por usuário.** Passar disso retorna 409 com `Favorites limit reached (50)`.
  - **Atenção:** neste branch a checagem usa `>` e deixa salvar até **51**. A correção está no `lab1/rfogaca`.
- Só é possível favoritar canais existentes. Um `channelId` desconhecido retorna 400.
- Favoritar de novo um canal que já está na lista não dá erro e não duplica.
- Remover um canal que não está na lista também não dá erro.
- A ordem dos favoritos é a ordem em que foram adicionados.
- Os favoritos ficam só na memória do servidor e se perdem quando ele reinicia.
- Não há autenticação: qualquer cliente lê e altera os favoritos de qualquer `userId`.

## Glossário

- **EPG (Electronic Program Guide):** o guia de programação, com a grade de horários dos canais lineares. É o que este serviço entrega: canais, grade diária, no ar agora e busca.
- **VOD (Video on Demand):** conteúdo assistido quando o usuário quiser, fora da grade linear. **Não existe no código deste serviço** e aparece aqui só para diferenciar de EPG.
- **ClassInd (Classificação Indicativa):** sistema oficial brasileiro de classificação etária, do Ministério da Justiça, com as faixas `L`, `10`, `12`, `14`, `16` e `18`.
- **Ao vivo (`live`):** um programa transmitido ao vivo. Quando dois programas se sobrepõem no feed, o ao vivo prevalece. A interface não mostra essa marcação.

## Perguntas abertas

1. **Perfil infantil:** como ele será identificado (usuário, perfil, dispositivo)? O bloqueio vale só para `18` ou deve seguir uma idade máxima configurável? Também deve valer na busca e no now-playing?
2. **Canal infantil:** o canal `infmu` (Infantil Mundo) tem programas `10`. Isso é aceitável, ou o canal infantil deveria ser só `L`?
3. **Programas `18` de dia:** "Tropa de Elite" (`18`) passa às 05h e às 16h no Cine Clássico. Existe regra de faixa horária por classificação? O código não aplica nenhuma.
4. **Excesso no limite de favoritos:** o que o guia web deve mostrar ao usuário quando o limite é atingido? Hoje a estrela acende mesmo com erro.
5. **Os 50 favoritos:** o limite é por usuário ou por perfil? Ele mudará quando os favoritos forem para um armazenamento persistente (Redis é citado como "próximo trimestre")?
6. **Identidade:** quem pode ler ou alterar os favoritos de um `userId`? Hoje não há autenticação.
7. **Datas no guia web:** o usuário deveria poder navegar entre dias? Hoje a data está fixa no código.
8. **Data padrão da API:** sem `?date=`, a grade usa a data UTC, que depois das 21h de São Paulo já é o dia seguinte. É intencional?
9. **Busca:** o produto quer busca que ignore maiúsculas e acentos neste branch? (Ela já existe no `lab1/rfogaca`.) Os canais encontrados também deveriam ter limite?
10. **Prime-time e `score`:** o importer calcula um `score` com boost no horário nobre (20h–23h), mas o `data/schedule.json` atual não tem esse campo e a API não o expõe. Qual é o uso esperado?
11. **VOD:** está no escopo deste serviço no futuro, ou fica em outro sistema?
