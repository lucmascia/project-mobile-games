# Créditos das artes

Os personagens, partículas, lua e nuvens vêm de pacotes gratuitos do **Kenney** (www.kenney.nl), com licença **CC0** (domínio público). Dá para usar, modificar e compartilhar sem pedir permissão. O crédito não é obrigatório, mas é legal dar.

| Pacote | O que usamos |
|---|---|
| Toon Characters | Craque (Male adventurer, camisa recolorida), Juiz Apitão (Male person, colete rosa), Goleirão Bigodão (Male person, careca e bigodão) e bandeirinha (Female person) |
| Particle Pack | fumaça, terra, estrelas, faíscas, anéis, fogo e redemoinho |
| Background Elements Remastered | lua e nuvens |

O estádio, os cartões, a bola, o VAR, o spray e os botões são desenhados no próprio código. O **Goleirão Bigodão** (Fase 2) foi feito a partir do arquivo vetorial do personagem *Male person* do Toon Characters: `ferramentas/goleiro_svg.py` tira o cabelo, põe a careca e o bigodão, troca as cores (camisa verde-limão, luvas laranja) e `ferramentas/svg_para_png.cjs` desenha as poses em alta resolução. Para gerar: `python3 ferramentas/goleiro_svg.py character_malePerson.svg goleiro.svg`, `node ferramentas/svg_para_png.cjs goleiro.svg goleiro3x.png 864 640 3` e `GOLEIRO_PNG=goleiro3x.png python3 ferramentas/montar_sprites.py pacotes sprites.js`.

## Como refazer a folha de sprites
1. `craque/ferramentas/baixar_kenney.sh toon-characters` (e o mesmo para `particle-pack` e `background-elements-remastered`), numa pasta de trabalho. Depois descompacte cada `pacote.zip` em `pacotes/<nome>/x/`.
2. `python3 craque/ferramentas/montar_sprites.py pacotes sprites.js` (precisa de Pillow e NumPy).
3. Cole o conteúdo de `sprites.js` no bloco `<script id="sprites">` de `site/craque/index.html`.
