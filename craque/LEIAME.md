# Craque vs. Juiz Apitão

Um jogo de chefões com tema de futebol, para jogar no celular deitado.

- **Fase 1:** Juiz Apitão. **Fase 2:** Goleirão Bigodão (liberada ao vencer o juiz).
- Cada fase tem 3 níveis: 1º tempo, 2º tempo e prorrogação. Os chefões ficam em `CHEFOES`; os ataques em `ATAQUES`.

- O jogo inteiro está em `site/craque/index.html`.
- **Para mudar o jogo:** abra `site/craque/index.html` e procure `var AJUSTES`. Lá estão a vida do juiz e do goleiro, a velocidade do Craque, o dano do chute, a cor e o número da camisa, e os corações de cada dificuldade.
- **Para usar desenhos de vocês:** procure `var IMAGENS` e siga o exemplo do comentário (nomes aceitos: `craque`, `juiz`, `bandeirinha`).
- **Drible:** arrancada rápida em que o Craque fica invencível e atravessa ataques. Driblar através de um ataque dá OLÉ! e enche a barra ⚡.
- **Artes:** personagens e efeitos do Kenney (CC0). Veja `CREDITOS.md`.
- **Testes:** `npm test` (lógica) e `npm run test:navegador` (navegador; salva prints em `craque/testes/prints/`).

Controles no teclado: setas (andar, mirar e agachar), Z chute, X pulo, C drible, V especial, Esc pausa.
