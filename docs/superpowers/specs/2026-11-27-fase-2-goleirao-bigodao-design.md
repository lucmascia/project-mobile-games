# Fase 2: Goleirão Bigodão — Documento de Design

## 1. Intenção

O jogo **Craque vs. Juiz Apitão** ganha uma continuação. Depois de vencer o Juiz Apitão (Fase 1), o Craque enfrenta o **Goleirão Bigodão** (Fase 2): um goleiro careca, com um bigodão preto de pontas curvadas (inspirado na imagem enviada pelo Luc), e poderes ligados ao gol.

O jogo continua sendo feito **com** os sobrinhos (10 e 12 anos) e jogado no celular deitado, pelo link do GitHub Pages ou pelo app instalado.

## 2. Objetivos, não-objetivos e anti-objetivos

**Objetivos**
- Uma segunda fase com chefão novo, vencida por **barra de vida**, igual ao juiz.
- **Fases** são chefões e **níveis** são os tempos de cada fase (1º tempo, 2º tempo e prorrogação). Cada nível é mais difícil que o anterior.
- A Fase 2 é liberada ao vencer a Fase 1. Perder na Fase 2 recomeça só a Fase 2, com os corações cheios.
- Um "molde de chefão" único, para que uma Fase 3 seja barata de fazer.

**Não-objetivos (agora)**
- Fase 3, marcar gols como forma de vencer, multiplayer, loja.

**Anti-objetivos (seria um fracasso se...)**
- A Fase 1 mudar de comportamento por causa da reforma.
- A rede prender o Craque enquanto outro ataque o acerta sem chance de reação.
- A defesa do goleiro deixar a luta "travada", sem como causar dano por muito tempo.
- Usar símbolos nacionais, times ou pessoas reais. O bigode é só um estilo de bigode.

## 3. Restrições (as mesmas do jogo atual)

- Tudo fica em `site/craque/index.html`: lógica, desenho e sons, sem dependências externas. As artes são do Kenney (CC0) e ficam embutidas no arquivo.
- Resolução lógica 960×540, celular na horizontal, toque e teclado.
- Todo ataque tem aviso de **pelo menos 0,6 s**. No Amador, os avisos duram 1,5× mais.
- A publicação é automática a partir do `main` (GitHub Pages) e precisa continuar funcionando sem internet (service worker).
- A interface e os comentários do código ficam em português.

## 4. Abordagens consideradas

| Abordagem | Vantagem | Desvantagem |
|---|---|---|
| **A) Molde de chefão único** (escolhida pelo Luc) | Um motor só para níveis, avisos, sorteio e troca de nível. Fase 3 barata. A Fase 1 é protegida pelos testes que já existem | Mais trabalho agora (reorganizar a lógica do juiz) |
| B) Copiar o código do juiz para o goleiro | Mais rápido hoje | Tudo duplicado, e cada ajuste precisa ser feito duas vezes |
| C) Um arquivo por fase | Mexe pouco no jogo atual | Progresso, recordes, controles e sons separados e divergindo |

## 5. Estrutura de fases e níveis

| | Fase 1 | Fase 2 |
|---|---|---|
| Chefão | Juiz Apitão | Goleirão Bigodão |
| Nível 1 | 1º tempo | 1º tempo |
| Nível 2 | 2º tempo | 2º tempo |
| Nível 3 | Prorrogação | Prorrogação |

- O HUD mostra "FASE 2 · NÍVEL 1 – 1º TEMPO" e o nome do chefão na barra de vida.
- A vida é dividida em 40% / 35% / 25%, com pausa de ~1,5 s e letreiro na troca de nível (como hoje). No Amador, o intervalo devolve 1 coração.
- Os mesmos controles, especial, drible e OLÉ! valem nas duas fases.

## 6. Progresso, menu e telas

- **Menu:** botões **FASE 1** e **FASE 2**. A Fase 2 aparece com um cadeado até o juiz ser vencido (em qualquer dificuldade). A liberação fica guardada no aparelho; se o navegador não deixar guardar, a liberação vale só até fechar o jogo.
- **Vitória na Fase 1:** a tela "GOOOL!" ganha o botão principal **PRÓXIMA FASE**, que vai direto para a Fase 2, na mesma dificuldade e com corações cheios.
- **Derrota na Fase 2:** "Tentar de novo" recomeça a Fase 2 com corações cheios.
- **Vitória na Fase 2:** tela de **CAMPEÃO** com taça, confete, nota e tempo da fase. Se as duas fases foram jogadas em seguida, também mostra o tempo total.
- **Recordes:** por fase e por dificuldade.
- **"Como jogar":** ganha uma linha sobre a defesa do goleiro ("a Bomba de Ouro fura a defesa") e sobre a rede ("toque nos botões para se soltar").

## 7. O Goleirão Bigodão

- **Visual:** careca brilhante, bigodão preto e grosso com as pontas enroladas para cima, uniforme de goleiro verde-limão, luvas grandes laranja e calção preto. Tem o tamanho do juiz (~300 de altura lógica).
- **Arte:** o corpo vem das partes do pacote Toon Characters do Kenney (tronco, braços, mãos, pernas), recoloridas e montadas num esqueleto animado. A cabeça careca com o bigode é desenhada em código, no estilo do Kenney (sem contorno, sombreado suave). Ele precisa ter pose de descanso, de aviso, de cada poder, de defesa, de troca de nível e de derrota.
- **Arena:** o mesmo estádio ao **entardecer** (céu laranja e roxo), com um **gol e rede atrás do goleiro**, do lado direito.
- **Posição:** fica parado na frente do gol, como o juiz. Encostar nele machuca, exceto durante a pausa de troca de nível.
- **Vida:** perto da do juiz (ponto de partida: 1700), ajustada pelo teste de pressão (§10).

## 8. Os poderes

Cada poder tem aviso (pose + "!" + som) de pelo menos 0,6 s.

1. **Luva bumerangue**
   - Uma luva sai da mão do goleiro, voa para a esquerda numa altura (alta ou baixa, avisada pela pose) e volta pelo mesmo caminho.
   - Para desviar, o Craque pula, agacha ou dribla, na ida e na volta.
   - No Nível 2, são duas luvas em alturas diferentes, uma depois da outra, e mais rápidas.
2. **Tiro de meta**
   - Ele chuta uma bola alta que atravessa a arena para a esquerda quicando 3 a 4 vezes, cada quique mais baixo.
   - Uma sombra no chão mostra a bola. Dá para passar por baixo dos arcos ou pular.
   - No Nível 3, são duas bolas, com um pequeno intervalo entre elas.
3. **Defesa + rebote**
   - Ele abre os braços em posição de defesa por ~2 s. O bloqueio começa quando a defesa começa, não durante o aviso. Os chutes que batem nele não tiram vida: aparece "DEFENDEU!" e um efeito de batida na luva.
   - **A Bomba de Ouro fura a defesa** e tira vida normalmente.
   - No fim, ele devolve uma **bola de fogo** que atravessa a arena para a esquerda, quicando entre o chão e o alto da tela em zigue-zague.
   - No Nível 3, são duas bolas de fogo.
4. **Rede-arapuca**
   - Uma sombra quadriculada marca o chão onde o Craque está e acompanha o Craque por um instante; depois congela e a rede cai.
   - Se pegar o Craque, ele fica **preso**: não anda, não pula e não chuta. Ele se solta com 4 toques em qualquer botão (ou teclas, no computador) ou sozinho depois de 2 s. A rede não tira coração.
   - **Regra de justiça:** enquanto o Craque estiver preso, o goleiro não começa outro ataque.
5. **Barreira**
   - Três jogadores de papelão aparecem entre o Craque e o goleiro e bloqueiam os chutes. Cada um cai com 4 chutes.
   - Eles não machucam e não impedem o Craque de passar. Pulando, dá para chutar por cima deles.
   - A Bomba de Ouro derruba todos no caminho. Eles somem sozinhos depois de ~8 s.
   - Não aparece outra barreira enquanto houver uma de pé.
6. **Saco de bolas**
   - Bolas caem do alto em vários pontos, cada uma com sombra no chão antes de cair. Ao tocar o chão, quicam uma vez e somem.
   - No Nível 3, caem mais bolas e mais rápido.
7. **Careca reluzente**
   - O holofote acende e a careca brilha (aviso com reflexo piscando).
   - Um feixe sai da cabeça e cria uma **mancha de luz no chão** (~60 de largura, ~50 de altura) que corre da direita para a esquerda. Só a mancha machuca: o feixe no ar é só desenho.
   - Para desviar, o Craque pula por cima ou dribla.
   - No Nível 3, a mancha vai e volta.

**Poderes por nível** (com peso no sorteio, sem repetir o mesmo seguido):

| Nível | Poderes |
|---|---|
| 1 (1º tempo) | luva bumerangue (3), tiro de meta (2), defesa + rebote (2) |
| 2 (2º tempo) | barreira (2), rede-arapuca (2), saco de bolas (2), luva dupla (2) |
| 3 (prorrogação) | careca reluzente (3), defesa + 2 bolas de fogo (2), tiro de meta duplo (2), saco de bolas rápido (1) |

## 9. Organização do código (molde de chefão)

- Cada chefão vira uma **ficha**: nome, vida, posição e caixa de colisão, poderes por nível, tempos de aviso, textos dos letreiros e funções de desenho.
- O motor que existe hoje (estados entrada → descanso → aviso → ataque → descanso, troca de nível, sorteio com peso e sem repetir, regras de aviso mínimo) passa a funcionar para qualquer ficha.
- No código, "fase" passa a ser o chefão e "nível" o tempo. Hoje o campo `fase` do juiz guarda o tempo e precisa ser renomeado para `nivel`; os testes são atualizados junto, sem mudar o comportamento.
- **Estados novos:**
  - Craque **preso** (rede).
  - Goleiro **defendendo**: um chute normal não tira vida, a Bomba de Ouro tira, e aparece o evento `defendeu`.
  - Barreira como obstáculo que bloqueia chutes.
- **Progresso:** o jogo (`criarJogo`) passa a receber qual fase jogar. A liberação da Fase 2 e os recordes ficam guardados no aparelho (com proteção para quando não der para guardar).

## 10. Como saber que deu certo

- Todos os testes atuais da Fase 1 continuam passando, apenas com os nomes atualizados.
- **Teste de pressão** (o mesmo usado no ajuste do juiz): em cada nível do goleiro, a quantidade de golpes que um Craque parado leva em 30 s fica até 1,3× a do Nível 1 do goleiro. O Nível 1 do goleiro fica até 1,3× o Nível 1 do juiz.
- Testes novos:
  - Cada poder termina em tempo finito e cada um pode ser desviado (luva, tiro de meta, fogo do rebote e mancha de luz, pulando, agachando ou driblando, conforme o caso).
  - A defesa bloqueia chutes normais e a Bomba de Ouro fura.
  - A rede prende, solta com 4 toques ou em 2 s, e o goleiro não ataca enquanto o Craque está preso.
  - A barreira bloqueia chutes e cai com 4.
  - A Fase 2 fica trancada antes e liberada depois de vencer o juiz.
  - A derrota na Fase 2 recomeça a Fase 2.
- No navegador: menu com as duas fases, botão "PRÓXIMA FASE", tela de campeão, sem erros, funcionando sem internet.
- Os meninos vencem a Fase 2 no Amador em algumas tentativas.

## 11. O que fica a cargo de quem constrói

Números exatos (velocidades, alturas, tempos, vida), animações, cores do entardecer, sons novos (batida na luva, rede, "plim" da careca), efeitos de partículas e o desenho da taça.

---

### Decisões que foram minhas (para revisar)
- Os nomes **fase** (chefão) e **nível** (tempo) aparecem no HUD como "FASE 2 · NÍVEL 1 – 1º TEMPO".
- A Fase 2 é liberada ao vencer o juiz em qualquer dificuldade.
- A Bomba de Ouro fura a defesa.
- A rede solta com 4 toques ou em 2 s, não tira coração, e o goleiro espera enquanto o Craque está preso.
- A barreira não é sólida, e dá para chutar por cima pulando.
- A mancha de luz no chão é o que machuca na careca reluzente (o feixe é só visual).
- O poder da luva vira só a luva bumerangue (a luva lançada e a bumerangue são o mesmo poder).
- Arena ao entardecer, gol do lado direito, goleiro verde-limão com luvas laranja.
- Vida inicial do goleiro: 1700, ajustada pelo teste de pressão.
