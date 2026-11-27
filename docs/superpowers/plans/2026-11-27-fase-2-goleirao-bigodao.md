# Fase 2: Goleirão Bigodão — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the single-boss game into a "molde de chefão" engine and add Fase 2 (Goleirão Bigodão) with 7 powers, progression, menu and art.

**Architecture:** Everything stays in `site/craque/index.html`. `<script id="logica">` gets a boss registry (`CHEFOES`) and a generic boss engine; all attacks live in one global `ATAQUES` registry (unique names). `<script id="app">` picks art, banners and HUD text from the boss definition. Tests load the `logica` block in Node; the browser test drives the page.

**Tech Stack:** HTML + Canvas 2D + JS; `node --test`; Playwright (pre-installed Chromium); Python + Pillow/NumPy for the sprite sheet.

**Spec:** `docs/superpowers/specs/2026-11-27-fase-2-goleirao-bigodao-design.md`

## Global Constraints

- One file `site/craque/index.html`, no external dependencies; Kenney CC0 art embedded.
- Every attack has warning ≥ 0.6 s; Amador × 1.5.
- Levels split life 40% / 35% / 25%; ~1.5 s break with banner; Amador heals 1 heart per level change.
- "Fase" = boss (1 Juiz, 2 Goleirão); "nível" = tempo (1º tempo, 2º tempo, prorrogação). HUD: "FASE 2 · NÍVEL 1 – 1º TEMPO".
- Fase 2 unlocks after beating the juiz on any difficulty; "PRÓXIMA FASE" keeps difficulty, full hearts; Fase 2 defeat restarts Fase 2 with full hearts.
- No national symbols; the mustache is only a mustache style.
- Fase 1 behaviour must not change.

## Review Focus

1. **Craque preso while a hazard from the previous attack is still flying** → the net only falls when it lands; hazards already on screen still move. Test (Task 2): goleiro doesn't *start* a new attack while preso, and preso ends in ≤ 2 s even with zero taps.
2. **Holding CHUTE during the whole defense** → no damage, one "defendeu" event per blocked shot, fight still progresses after defense ends. Test (Task 2).
3. **Level change while a barreira or net is on screen** → cleared like other hazards; Craque released. Test (Task 2).
4. **Storage blocked (private tab)** → Fase 2 unlock still works for the session; menu doesn't crash. Test (Task 3, browser).
5. **Phone rotated / app hidden during PRÓXIMA FASE transition** → pauses like any fight. Covered by existing pause logic; browser test clicks PRÓXIMA FASE then checks `tela === 'luta'` and `jogo.fase === 2`.

---

### Task 1: Molde de chefão (refactor, no behaviour change)

**Files:** Modify `site/craque/index.html` (logica + app), all `craque/testes/*.mjs`.

**Interfaces (Produces):**
- `AJUSTES.chefe = { niveis: [0.40, 0.35, 0.25], avisoMin: 0.6, respiro: [1.3, 1.3, 1.1], transicao: 1.5 }`; `AJUSTES.juiz = { vida: 1600 }`; `AJUSTES.goleiro = { vida: 1700 }`.
- `CHEFOES = { 1: { tipo: 'juiz', nome: 'JUIZ APITÃO', vida: () => AJUSTES.juiz.vida, ataquesPorNivel: {1:{…},2:{…},3:{…}} }, 2: {…} }` (goleiro filled in Task 2).
- `ATAQUES_POR_NIVEL` removed in favour of `CHEFOES[f].ataquesPorNivel`; `AVISO_BASE` holds every attack name; `ATAQUES` stays the single global registry.
- `criarChefe(fase, dificuldade, aleatorio?) → Chefe` with `{tipo, fase, nivel, vida, vidaMax, estado, t, ataqueAtual, ultimoAtaque, x, y, w, h, piscar, olhando, correndo, defendendo}`; `CHEFE_X` (was `JUIZ_X`).
- `limiteNivel(c, nivel)`, `ferirChefe(c, dano)`, `escolherAtaque(c, jogo?)`, `tempoAviso(c, nome)`, `tempoRespiro(c)`, `atualizarChefe(c, dt, jogo)`, `caixaChefe(c)`.
- `criarJogo(dificuldade, aleatorio?, fase = 1)` → jogo has `fase` and `chefe` (no `juiz` field).
- Event `'fase'` renamed `'nivel'`.

- [ ] Rename in tests first (`criarJuiz(d` → `criarChefe(1, d`, `.fase` → `.nivel` on bosses, `limiteFase` → `limiteNivel`, `ferirJuiz` → `ferirChefe`, `caixaJuiz` → `caixaChefe`, `jogo.juiz` → `jogo.chefe`, `ATAQUES_POR_FASE[f]` → `CHEFOES[1].ataquesPorNivel[f]`, `A.juiz.fases` → `A.chefe.niveis`, `JUIZ_X` → `CHEFE_X`, event `'fase'` → `'nivel'`). Add test `jogo da fase 2 cria o goleiro` expecting `criarJogo('amador', s, 2).chefe.tipo === 'goleiro'` (stays red until Task 2).
- [ ] Run `npm test` → FAIL (names missing).
- [ ] Refactor logica to the interfaces above; app updated to the new names (art still picks juiz art for `tipo === 'juiz'`).
- [ ] `npm test` → all old tests PASS (only the fase-2 test fails); `npm run test:navegador` → PASS.
- [ ] Commit.

### Task 2: Goleirão — lógica e poderes

**Files:** Modify `site/craque/index.html` (logica); Test `craque/testes/goleiro.test.mjs`.

**Interfaces (Produces):**
- `CHEFOES[2] = { tipo: 'goleiro', nome: 'GOLEIRÃO BIGODÃO', vida: () => AJUSTES.goleiro.vida, ataquesPorNivel: {1:{luva:3, tiroDeMeta:2, defesa:2}, 2:{barreira:2, rede:2, sacoDeBolas:2, luvaDupla:2}, 3:{careca:3, defesaDupla:2, tiroDeMetaDuplo:2, sacoDeBolasRapido:1}} }`.
- `ATAQUES.luva|luvaDupla|tiroDeMeta|tiroDeMetaDuplo|defesa|defesaDupla|barreira|rede|sacoDeBolas|sacoDeBolasRapido|careca`.
- Hazard types: `'luva'` (boomerang: `vx` accelerates from −640 toward +, removed when back past `CHEFE_X`; `alta` → y `chao−112..chao−66`, `baixa` → y `chao−42..chao`), `'bolaQuica'` (r 14, gravity, restitution 0.72, ≥3 bounces), `'fogo'` (r 16, vx −300, vy bounces between y 150 and chao−16), `'rede'` (inativo marker, `prende: true`), `'bolaCai'` (falls after sombra, bounces once, then removed), `'luzChao'` (w 60, h 50 on the ground, vx −480; nível 3 returns).
- Inimigo `{tipo:'barreira', vida:4, tempo:8, w:46, h:92}` (blocks shots, harmless, 3 at x 300/420/540).
- Craque: `presoTempo` (2 s), `presoToques` (needs 4 button presses, any of chute/pulo/dash/especial); while preso no move/jump/shot. Events `'preso'`, `'solto'`, `'defendeu'`.
- `chefe.defendendo` true during defense: normal shots removed with `'defendeu'`, especial still damages. Defense lasts 2.0 s then launches 1 (`defesa`) or 2 (`defesaDupla`) `'fogo'`.
- `escolherAtaque` also skips `barreira` while a barreira is alive; `atualizarChefe` stays in `respiro` while `jogo.craque.presoTempo > 0`.
- Level change clears inimigos/perigos and releases a preso Craque.

- [ ] Write `goleiro.test.mjs`: each power ends < 8 s on all levels; luva alta misses crouched Craque and hits standing; luva baixa misses Craque at jump apex; tiroDeMeta has ≥3 bounces and a bounce apex ≥ 120 px above ground; luzChao misses Craque at apex; defense blocks normal shot (`vida` unchanged, event `defendeu`) and especial damages; rede prende Craque under it, 4 presses release, 2 s releases with no presses, goleiro stays in respiro while preso; barreira blocks a shot and falls with 4; no second barreira while one alive; level change releases preso and clears barreiras; pressure test: each goleiro level ≤ 1.3× goleiro nível 1, goleiro nível 1 ≤ 1.3× juiz nível 1 (both difficulties); `AVISO_BASE` ≥ 0.6 for every goleiro attack.
- [ ] `npm test` → FAIL.
- [ ] Implement.
- [ ] `npm test` → PASS (tune `AJUSTES.goleiro` / speeds until pressure passes).
- [ ] Commit.

### Task 3: Progresso, menu e telas

**Files:** Modify `site/craque/index.html` (app); `craque/testes/navegador.mjs`.

**Interfaces:** `app.fase` (1|2 being played/selected), `faseLiberada(2)` / `liberarFase(2)` (localStorage key `craque-fase2`, in-memory fallback), records key `craque-recorde-<dif>` for fase 1 and `craque-recorde-<dif>-f2` for fase 2, `app.tempoFase1` for total time when continuing. Menu alvos named `fase1`, `fase2`, `jogar`; vitória alvo `proxima` (fase 1), `denovo`, `menu`; campeão screen `app.tela === 'campeao'`.

- [ ] Browser test additions: `fase2` locked at start (tapping it keeps `app.fase === 1`); force fase-1 win → `proxima` exists → tap → `tela === 'luta'`, `jogo.fase === 2`, full hearts; fase-2 defeat → `denovo` restarts fase 2; force fase-2 win → `tela === 'campeao'`; storage-blocked page can still continue to fase 2; HUD text check via `window.__hudTexto()` returns `'FASE 2 · NÍVEL 1 – 1º TEMPO'`.
- [ ] Run → FAIL. Implement (menu fase buttons with cadeado, PRÓXIMA FASE, campeão with taça, banners per boss, HUD label, ajuda lines). Run → PASS. Commit.

### Task 4: Arte do Goleirão e da Fase 2

**Files:** Modify `site/craque/index.html` (sprites + app art), `craque/ferramentas/montar_sprites.py`, `craque/CREDITOS.md`.

- [ ] Add Kenney Toon Characters *Parts HD* (body, arm, hand, leg) to the sheet, recoloured: shirt lime `#c6ff00`-ish, gloves orange, shorts black; regenerate the `sprites` block.
- [ ] `ARTE.goleiro(c, jogo, t)`: rigged parts + vector bald head (shine), big black mustache with curled tips; poses for respiro, each aviso, defesa (wide stance), throw, careca glint, transição, derrota. Hazard art for luva, bolaQuica, fogo, rede (falling + over Craque), bolaCai, luzChao + beam, barreira (cardboard player). Sunset background for fase 2 with goal + net on the right.
- [ ] Effects/sounds: `defendeu` ("DEFENDEU!" + spark), `preso` ("PRESO! Toque nos botões!"), `solto`, glint "plim", net swish.
- [ ] Verify with gallery screenshots (each pose/hazard), fix once; `npm test` + `npm run test:navegador` PASS. Commit.

### Task 5: Publicar

- [ ] Bump `sw.js` `VERSAO` to `craque-v2`; update README/LEIAME/ajuda.
- [ ] All tests PASS; push branch; ask Luc before pushing to `main` (publishes the site).
