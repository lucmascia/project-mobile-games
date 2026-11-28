# Jogos da família

Jogos para celular feitos em família, publicados como app: abrem por um link, sem login, e podem ser instalados na tela inicial.

**Endereço:** https://lucmascia.github.io/project-mobile-games/

| Jogo | Link direto |
|---|---|
| Craque (Fase 1: Juiz Apitão · Fase 2: Goleirão Bigodão) | https://lucmascia.github.io/project-mobile-games/craque/ |

## Instalar no celular
1. Abra o link do jogo no navegador (ou aponte a câmera para o QR code da página inicial).
2. No menu do jogo, toque em **INSTALAR**. **Android:** aparece a janela oficial de instalação. **iPhone:** o jogo mostra os 3 passos (a Apple não deixa sites se instalarem sozinhos).
3. Abra pelo ícone. Assim o jogo abre em tela cheia e funciona sem internet. Quando o jogo já está instalado, o botão some.

Quando o jogo é atualizado, a versão nova aparece na **segunda vez** que ele é aberto (a primeira baixa a atualização em segundo plano).

## Como está organizado
- `site/`: o que é publicado (a página inicial e uma pasta por jogo).
  - `site/craque/`: o jogo. Tudo em `index.html` (lógica, desenho e sons), mais `manifest.webmanifest` (nome, ícone, tela cheia e horizontal), `sw.js` (guarda o jogo no celular) e `icones/`.
- `craque/`: testes, ferramentas e créditos do jogo (não são publicados).

## Publicação
Cada mudança no branch `main` roda os testes e publica a pasta `site/` no GitHub Pages (leva um ou dois minutos; o andamento aparece na aba **Actions**).

Configuração feita uma vez: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

## Testes
- `npm test`: testes da lógica (rodam também antes de cada publicação).
- `npm run test:navegador`: abre o jogo num navegador de celular simulado e testa toque, telas, instalação e uso sem internet (precisa do Playwright com Chromium).
