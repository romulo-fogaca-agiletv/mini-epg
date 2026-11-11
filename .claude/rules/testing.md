---
paths:
  - "tests/**"
  - "**/*.test.js"
---

# Regras de teste

- Use **jest** e, para rotas HTTP, **supertest** contra `require('../src/app')`. Não use outro framework de teste ou de asserção.
- **Um comportamento por teste.** Se o nome precisa de "e", separe em dois testes.
- **Nome no formato "unidade faz o quê quando condição"**, por exemplo:
  - `describe('favorites.add')` + `it('rejects the channel when the user already has 50 favorites')`
  - `describe('GET /channels/:id/schedule')` + `it('returns 404 when the channel does not exist')`
- **Nunca apague nem enfraqueça uma asserção para o teste passar.** Isso inclui trocar o valor esperado pelo resultado errado, afrouxar o matcher (`toBe` → `toBeTruthy`), usar `.skip`/`.only` ou remover o teste. Corrija o código. Só mude o valor esperado se o usuário confirmar que o comportamento esperado mudou.
