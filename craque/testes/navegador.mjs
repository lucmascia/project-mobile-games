// Teste no navegador de verdade (Chromium), como um celular deitado.
// Rodar: node tests/navegador.mjs  (salva prints em tests/prints/)
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const aqui = fileURLToPath(new URL('.', import.meta.url));
const prints = aqui + 'prints/';
mkdirSync(prints, { recursive: true });
// serve a pasta site/ como o GitHub Pages faz
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
const raiz = fileURLToPath(new URL('../../site/', import.meta.url));
const TIPOS = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.png': 'image/png', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml' };
const servidor = createServer((req, res) => {
  let caminho = normalize(decodeURIComponent(req.url.split('?')[0])).replace(/^([.][.][/\\])+/, '');
  if (caminho.endsWith('/')) caminho += 'index.html';
  try { const dados = readFileSync(join(raiz, caminho)); res.writeHead(200, { 'Content-Type': TIPOS[extname(caminho)] || 'application/octet-stream' }); res.end(dados); }
  catch { res.writeHead(404); res.end('nao encontrado'); }
});
await new Promise(r => servidor.listen(0, '127.0.0.1', r));
const url = `http://127.0.0.1:${servidor.address().port}/craque/`;

const erros = [];
const espera = ms => new Promise(r => setTimeout(r, ms));
let passos = 0;
function ok(cond, msg) { assert.ok(cond, msg); passos++; console.log('ok -', msg); }

async function abrir(browser, extra) {
  const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  page.on('pageerror', e => erros.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text()); });
  if (extra) await page.addInitScript(extra);
  await page.goto(url);
  await espera(300);
  return page;
}
async function toque(page, tipo, id, x, y) {
  await page.evaluate(([tipo, id, x, y]) => {
    document.getElementById('tela').dispatchEvent(new PointerEvent(tipo, { pointerId: id, clientX: x, clientY: y, pointerType: 'touch', bubbles: true, cancelable: true, isPrimary: id === 1 }));
  }, [tipo, id, x, y]);
}
async function alvo(page, nome) {
  const a = await page.evaluate(n => window.__alvos().find(a => a.nome === n), nome);
  assert.ok(a, 'botão de menu ' + nome);
  return a;
}

const browser = await chromium.launch();
try {
  const page = await abrir(browser);
  ok(await page.evaluate(() => window.__app.tela) === 'inicio', 'abre na tela de início');
  await page.screenshot({ path: prints + '1-inicio.png' });

  const ajuda = await alvo(page, 'ajuda');
  await page.touchscreen.tap(ajuda.x, ajuda.y);
  await espera(100);
  ok(await page.evaluate(() => window.__app.tela) === 'ajuda', 'COMO JOGAR abre a explicação dos botões');
  await page.screenshot({ path: prints + '1b-como-jogar.png' });
  const voltar = await alvo(page, 'voltar');
  await page.touchscreen.tap(voltar.x, voltar.y);
  await espera(100);
  ok(await page.evaluate(() => window.__app.tela) === 'inicio', 'VOLTAR volta para o início');

  const jogar = await alvo(page, 'jogar');
  await page.touchscreen.tap(jogar.x, jogar.y);
  await espera(100);
  ok(await page.evaluate(() => window.__app.tela) === 'luta', 'JOGAR começa a luta');
  await espera(1000);
  ok(await page.evaluate(() => window.__app.dica && window.__app.dica.botao === 'chute'), 'mostra a dica do CHUTE na primeira luta');

  const cob = await page.evaluate(() => {
    const t = window.__tela(), C = window.__ctrl(), j = window.__jogo, bots = Object.values(C.bot);
    const cj = caixaChefe(j.chefe), cr = caixaCraque(j.craque); let n = 0, c = 0;
    for (let x = cj.x; x <= cj.x + cj.w; x += 4) for (let y = cj.y; y <= cj.y + cj.h; y += 4) {
      n++; const px = t.OX + x * t.ESC, py = t.OY + y * t.ESC;
      if (bots.some(b => Math.hypot(px - b.x, py - b.y) < b.r)) c++;
    }
    const cx = t.OX + (cr.x + cr.w / 2) * t.ESC, cy = t.OY + (cr.y + cr.h / 2) * t.ESC;
    return { chefe: c / n, craqueLivre: Math.hypot(cx - C.joy.x, cy - C.joy.y) > C.joy.R };
  });
  ok(cob.chefe <= 0.15, 'botões cobrem no máximo 15% do chefão (cobrem ' + Math.round(cob.chefe * 100) + '%)');
  ok(cob.craqueLivre, 'o Craque não começa embaixo do direcional');
  const C = await page.evaluate(() => window.__ctrl());
  await toque(page, 'pointerdown', 5, C.bot.chute.x, C.bot.chute.y);
  ok(await page.evaluate(() => window.__controle().chute) === true, 'segurar CHUTE liga o chute');
  await espera(1200);
  ok(await page.evaluate(() => window.__jogo.chefe.vida < window.__jogo.chefe.vidaMax), 'os chutes acertam o juiz');
  await toque(page, 'pointercancel', 5, C.bot.chute.x, C.bot.chute.y);
  ok(await page.evaluate(() => window.__controle().chute) === false, 'toque cancelado solta o CHUTE');

  await toque(page, 'pointerdown', 6, C.bot.dash.x, C.bot.dash.y);
  await toque(page, 'pointermove', 6, C.bot.dash.x + 200, C.bot.dash.y - 200);
  ok(await page.evaluate(() => window.__controle().dash) === false, 'dedo que escorrega para fora solta o botão');
  await toque(page, 'pointerup', 6, 0, 0);

  await toque(page, 'pointerdown', 1, C.joy.x + C.joy.R * 0.8, C.joy.y);
  await toque(page, 'pointerdown', 2, C.bot.pulo.x, C.bot.pulo.y);
  await toque(page, 'pointerdown', 3, C.bot.chute.x, C.bot.chute.y);
  const c3 = await page.evaluate(() => window.__controle());
  ok(c3.direita && c3.pulo && c3.chute && !c3.esquerda, 'direcional + 2 botões ao mesmo tempo');
  await toque(page, 'pointermove', 1, C.joy.x + C.joy.R * 0.6, C.joy.y - C.joy.R * 0.6);
  const diag = await page.evaluate(() => window.__controle());
  ok(diag.direita && diag.cima, 'direcional na diagonal');
  for (const id of [1, 2, 3]) await toque(page, 'pointerup', id, 0, 0);
  ok(await page.evaluate(() => { const c = window.__controle(); return !c.direita && !c.pulo && !c.chute; }), 'soltar tudo zera o controle');

  await espera(1800);
  await page.screenshot({ path: prints + '2-fase1.png' });
  await page.evaluate(() => { const j = window.__jogo.chefe; j.estado = 'respiro'; ferirChefe(j, 99999); });
  await espera(400);
  await page.screenshot({ path: prints + '3-troca-fase.png' });
  await espera(3200);
  ok(await page.evaluate(() => window.__jogo.chefe.nivel) === 2, 'chega no nível 2');
  await page.screenshot({ path: prints + '4-fase2.png' });
  await page.evaluate(() => { const j = window.__jogo.chefe; window.__jogo.craque.coracoes = 99; if (j.estado === 'transicao') j.t = 0; j.estado = 'respiro'; ferirChefe(j, 99999); });
  await espera(2000);
  await page.evaluate(() => { const j = window.__jogo; j.chefe.estado = "aviso"; j.chefe.ataqueAtual = "var"; j.chefe.t = 0; });
  await espera(1300);
  ok(await page.evaluate(() => window.__jogo.chefe.nivel) === 3, 'chega no nível 3');
  await page.screenshot({ path: prints + '5-fase3-var.png' });

  await page.evaluate(() => document.fullscreenElement && document.exitFullscreen());
  await espera(200);
  await page.setViewportSize({ width: 390, height: 844 });
  await espera(300);
  ok(await page.evaluate(() => window.__app.tela) === 'pausa', 'celular em pé pausa o jogo');
  ok(await page.isVisible('#vire'), 'mostra o aviso de virar o celular');
  await page.screenshot({ path: prints + '6-vire.png' });
  await page.setViewportSize({ width: 844, height: 390 });
  await espera(300);
  ok(!(await page.isVisible('#vire')), 'deitado de novo, o aviso some');
  await page.screenshot({ path: prints + '7-pausa.png' });

  const cont = await alvo(page, 'continuar');
  await page.touchscreen.tap(cont.x, cont.y);
  await espera(100);
  ok(await page.evaluate(() => window.__app.tela) === 'luta', 'Continuar volta para a luta');
  await page.evaluate(() => { const j = window.__jogo; j.craque.coracoes = 1; j.craque.invencivel = 0; j.perigos.push({ tipo: 'amarelo', x: j.craque.x, y: j.craque.y + 10, w: 26, h: 18, vx: 0, vy: 0 }); });
  await espera(2200);
  ok(await page.evaluate(() => window.__app.tela) === 'derrota', 'sem corações mostra a derrota');
  await page.screenshot({ path: prints + '8-derrota.png' });
  const denovo = await alvo(page, 'denovo');
  await page.touchscreen.tap(denovo.x, denovo.y);
  await espera(100);
  ok(await page.evaluate(() => window.__app.tela === 'luta' && window.__jogo.chefe.vida === window.__jogo.chefe.vidaMax), 'Tentar de novo reinicia');

  // navegador que não deixa guardar nada (aba anônima)
  const p2 = await abrir(browser, () => {
    Storage.prototype.getItem = () => { throw new Error('bloqueado'); };
    Storage.prototype.setItem = () => { throw new Error('bloqueado'); };
  });
  await p2.keyboard.press('Enter');
  await espera(100);
  ok(await p2.evaluate(() => window.__app.tela) === 'luta', 'Enter começa pelo teclado');
  await p2.evaluate(() => { const j = window.__jogo.chefe; j.nivel = 3; j.vida = 2; j.estado = 'respiro'; j.t = 5; });
  await p2.keyboard.down('z');
  await espera(2600);
  await p2.keyboard.up('z');
  ok(await p2.evaluate(() => window.__app.tela) === 'vitoria', 'vitória aparece mesmo sem localStorage');
  await p2.screenshot({ path: prints + '9-vitoria.png' });

  // ----- Fase 2: progresso, menu e telas -----
  const p5 = await abrir(browser);
  ok(await p5.evaluate(() => window.__faseLiberada(2)) === false, 'Fase 2 começa trancada');
  const f2 = await alvo(p5, 'fase2');
  await p5.touchscreen.tap(f2.x, f2.y); await espera(100);
  ok(await p5.evaluate(() => window.__app.fase) === 1, 'tocar na Fase 2 trancada não troca de fase');
  await p5.keyboard.press('Enter'); await espera(100);
  async function vencer(pg) {
    await pg.evaluate(() => { const j = window.__jogo.chefe; j.nivel = 3; j.vida = 2; j.estado = 'respiro'; j.t = 5; window.__jogo.craque.coracoes = 99; });
    await pg.keyboard.down('z'); await espera(2600); await pg.keyboard.up('z');
  }
  await vencer(p5);
  ok(await p5.evaluate(() => window.__app.tela) === 'vitoria', 'venceu a Fase 1');
  ok(await p5.evaluate(() => window.__faseLiberada(2)) === true, 'vencer o juiz libera a Fase 2');
  const prox = await alvo(p5, 'proxima');
  await p5.touchscreen.tap(prox.x, prox.y); await espera(150);
  ok(await p5.evaluate(() => window.__app.tela === 'luta' && window.__jogo.fase === 2 && window.__jogo.chefe.tipo === 'goleiro'), 'PRÓXIMA FASE começa o Goleirão');
  ok(await p5.evaluate(() => window.__jogo.craque.coracoes === 5 && window.__jogo.dificuldade === 'amador'), 'Fase 2 com corações cheios e mesma dificuldade');
  ok(await p5.evaluate(() => window.__hudTexto()) === 'FASE 2 · NÍVEL 1 – 1º TEMPO', 'HUD mostra fase e nível');
  await espera(1500);
  await p5.screenshot({ path: prints + '10-fase2.png' });
  await p5.evaluate(() => { const j = window.__jogo; j.craque.coracoes = 1; j.craque.invencivel = 0; j.perigos.push({ tipo: 'amarelo', x: j.craque.x, y: j.craque.y + 10, w: 26, h: 18, vx: 0, vy: 0 }); });
  await espera(2200);
  ok(await p5.evaluate(() => window.__app.tela) === 'derrota', 'derrota na Fase 2');
  const dn = await alvo(p5, 'denovo');
  await p5.touchscreen.tap(dn.x, dn.y); await espera(150);
  ok(await p5.evaluate(() => window.__app.tela === 'luta' && window.__jogo.fase === 2 && window.__jogo.craque.coracoes === 5), 'Tentar de novo recomeça só a Fase 2');
  await vencer(p5);
  ok(await p5.evaluate(() => window.__app.tela) === 'campeao', 'vencer o Goleirão mostra a tela de campeão');
  await p5.screenshot({ path: prints + '11-campeao.png' });
  const mn = await alvo(p5, 'menu');
  await p5.touchscreen.tap(mn.x, mn.y); await espera(150);
  const f2b = await alvo(p5, 'fase2');
  await p5.touchscreen.tap(f2b.x, f2b.y); await espera(100);
  ok(await p5.evaluate(() => window.__app.fase) === 2, 'no menu dá para escolher a Fase 2 liberada');
  await p5.screenshot({ path: prints + '12-menu-fase2.png' });
  // sem armazenamento (aba anônima): a liberação vale enquanto o jogo está aberto
  const prox2 = await alvo(p2, 'proxima');
  await p2.touchscreen.tap(prox2.x, prox2.y); await espera(150);
  ok(await p2.evaluate(() => window.__jogo && window.__jogo.fase === 2 && window.__faseLiberada(2)), 'sem armazenamento, a Fase 2 ainda é liberada');

  // ----- instalar sem passos extras -----
  // Android/Chrome: o navegador avisa que dá para instalar (beforeinstallprompt) → botão INSTALAR abre a janela oficial
  const p6 = await abrir(browser);
  ok(!(await p6.evaluate(() => window.__alvos().some(a => a.nome === 'instalar'))), 'sem aviso do navegador, não mostra INSTALAR');
  await p6.evaluate(() => {
    const e = new Event('beforeinstallprompt', { cancelable: true });
    e.prompt = () => { window.__pediuInstalar = true; return Promise.resolve(); };
    e.userChoice = Promise.resolve({ outcome: 'accepted' });
    window.dispatchEvent(e);
  });
  await espera(150);
  const inst = await alvo(p6, 'instalar');
  await p6.touchscreen.tap(inst.x, inst.y); await espera(200);
  ok(await p6.evaluate(() => window.__pediuInstalar === true), 'INSTALAR abre a janela de instalação do Android');
  ok(!(await p6.evaluate(() => window.__alvos().some(a => a.nome === 'instalar'))), 'depois de instalar, o botão some');
  // iPhone: não existe instalação automática → INSTALAR abre o guia animado
  const ctxIOS = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' });
  const p7 = await ctxIOS.newPage();
  p7.on('pageerror', e => erros.push('pageerror: ' + e.message));
  await p7.goto(url); await espera(300);
  const inst2 = await alvo(p7, 'instalar');
  await p7.touchscreen.tap(inst2.x, inst2.y); await espera(150);
  ok(await p7.evaluate(() => window.__app.tela) === 'instalarIOS', 'no iPhone, INSTALAR abre o guia de instalação');
  await p7.screenshot({ path: prints + '13-guia-iphone.png' });
  const volta = await alvo(p7, 'voltar');
  await p7.touchscreen.tap(volta.x, volta.y); await espera(100);
  ok(await p7.evaluate(() => window.__app.tela) === 'inicio', 'VOLTAR sai do guia');
  // já instalado (aberto pelo ícone): sem botão
  const ctxApp = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148' });
  await ctxApp.addInitScript(() => { Object.defineProperty(navigator, 'standalone', { get: () => true }); });
  const p8 = await ctxApp.newPage(); await p8.goto(url); await espera(300);
  ok(!(await p8.evaluate(() => window.__alvos().some(a => a.nome === 'instalar'))), 'aberto pelo ícone (já instalado), não mostra INSTALAR');
  await ctxIOS.close(); await ctxApp.close();

  // app instalável: manifesto, ícones e service worker
  const p3 = await abrir(browser);
  const manifesto = await p3.evaluate(async () => (await fetch(document.querySelector('link[rel=manifest]').href)).json());
  ok(manifesto.display === 'fullscreen' && manifesto.orientation === 'landscape' && manifesto.icons.length >= 2, 'manifesto pede tela cheia e horizontal');
  for (const ic of manifesto.icons) ok((await p3.evaluate(async src => (await fetch(src)).ok, ic.src)), 'ícone existe: ' + ic.src);
  ok(await p3.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; }), 'service worker ativo');
  await p3.reload(); await espera(400);
  await p3.context().setOffline(true);
  await p3.reload(); await espera(600);
  ok(await p3.evaluate(() => window.__app && window.__app.tela === 'inicio'), 'abre sem internet');
  await p3.context().setOffline(false);
  const p4 = await abrir(browser);
  await p4.goto(url.replace('craque/', ''));
  ok((await p4.textContent('body')).includes('Craque'), 'página inicial lista o jogo');

  ok(erros.length === 0, 'nenhum erro no console: ' + erros.join(' | '));
  console.log(`\n# pass ${passos}\n# fail 0`);
} catch (e) {
  console.log('not ok -', e.message, '\nerros da página:', erros.join(' | '));
  console.log('# fail 1');
  process.exitCode = 1;
} finally {
  await browser.close();
  servidor.close();
}
