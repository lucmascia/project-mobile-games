import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica, semente } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;

const novo = (d = 'profissional') => L.criarJogo(d, semente(11));
function jogar(jogo, ctrl, segundos) { for (let t = 0; t < segundos; t += 0.05) L.passoJogo(jogo, ctrl, 0.05); }

test('chutar o juiz tira vida e enche o especial', () => {
  const jogo = novo(); const ctrl = L.criarControle(); ctrl.chute = true;
  jogar(jogo, ctrl, 1);
  assert.ok(jogo.juiz.vida < jogo.juiz.vidaMax);
  assert.ok(jogo.craque.especial > 0 || jogo.craque.acertosAcum > 0);
  assert.ok(jogo.eventos.includes('chute'));
});

test('encostar num perigo tira coração e avisa', () => {
  const jogo = novo(); const c = jogo.craque;
  jogo.perigos.push({ tipo: 'amarelo', x: c.x, y: c.y + 10, w: 26, h: 18, vx: 0, vy: 0 });
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(c.coracoes, 2);
  assert.equal(jogo.danoLevado, 1);
  assert.ok(jogo.eventos.includes('dano'));
});

test('encostar no juiz machuca', () => {
  const jogo = novo(); const c = jogo.craque;
  c.x = jogo.juiz.x + 40;
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(c.coracoes, 2);
});

test('sem corações = derrota', () => {
  const jogo = novo(); jogo.craque.coracoes = 1;
  jogo.perigos.push({ tipo: 'onda', x: jogo.craque.x, y: A.chao - 46, w: 30, h: 46, vx: 0, vy: 0 });
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(jogo.estado, 'derrota');
  assert.ok(jogo.eventos.includes('derrota'));
});

test('juiz sem vida = vitória', () => {
  const jogo = novo(); jogo.juiz.fase = 3; jogo.juiz.vida = 1; jogo.juiz.estado = 'respiro';
  const ctrl = L.criarControle(); ctrl.chute = true;
  jogar(jogo, ctrl, 1);
  assert.equal(jogo.estado, 'vitoria');
  assert.ok(jogo.eventos.includes('vitoria'));
});

test('um travamento de 5 s avança no máximo 0,1 s', () => {
  const jogo = novo();
  L.passoJogo(jogo, L.criarControle(), 5);
  assert.ok(jogo.tempo <= 0.1 + 1e-9, `avançou ${jogo.tempo}`);
  assert.ok(jogo.tempo > 0);
});

test('pausado não avança', () => {
  const jogo = novo(); jogo.pausado = true;
  L.passoJogo(jogo, L.criarControle(), 0.05);
  assert.equal(jogo.tempo, 0);
});

test('troca de fase limpa os perigos e avisa', () => {
  const jogo = novo(); jogo.juiz.estado = 'respiro';
  jogo.perigos.push({ tipo: 'amarelo', x: 300, y: 100, w: 26, h: 18, vx: 0, vy: 0 });
  jogo.inimigos.push({ tipo: 'bandeirinha', x: 20, y: 396, w: 36, h: 64, vida: 3, t: 5, levantando: 0, tempo: 8, piscar: 0 });
  L.ferirJuiz(jogo.juiz, 99999);
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(jogo.perigos.length, 0);
  assert.equal(jogo.inimigos.length, 0);
  assert.ok(jogo.eventos.includes('fase'));
});

test('nota final: S sem dano e rápido, C com muito dano', () => {
  const jogo = novo(); jogo.tempo = 90; jogo.danoLevado = 0;
  assert.equal(L.notaFinal(jogo), 'S');
  jogo.danoLevado = 1; assert.equal(L.notaFinal(jogo), 'A');
  jogo.danoLevado = 2; assert.equal(L.notaFinal(jogo), 'B');
  jogo.danoLevado = 4; assert.equal(L.notaFinal(jogo), 'C');
});

test('progresso mostra quanto da vida do juiz foi tirada', () => {
  const jogo = novo();
  assert.equal(L.progresso(jogo), 0);
  jogo.juiz.vida = jogo.juiz.vidaMax * 0.25;
  assert.equal(L.progresso(jogo), 0.75);
});

test('partida inteira simulada sem travar (juiz parado de chutar)', () => {
  const jogo = novo('amador'); const ctrl = L.criarControle();
  for (let i = 0; i < 60 * 60; i++) { L.passoJogo(jogo, ctrl, 1/60); jogo.eventos.length = 0; if (jogo.estado !== 'luta') break; }
  assert.ok(['luta', 'derrota'].includes(jogo.estado));
});

test('se a fase muda no meio da corrida, o juiz volta ao lugar olhando para o Craque', () => {
  const jogo = novo(); const j = jogo.juiz; j.estado = 'ataque'; j.ataqueAtual = 'corrida';
  L.ATAQUES.corrida.iniciar(jogo);
  jogo.craque.coracoes = 99;
  // corre até a volta começar
  for (let i = 0; i < 200 && jogo.atk.etapa !== 'volta'; i++) L.passoJogo(jogo, L.criarControle(), 1/60);
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(j.olhando, 1);
  L.ferirJuiz(j, 99999);
  for (let i = 0; i < 60 * 3; i++) L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(j.x, L.JUIZ_X);
  assert.equal(j.olhando, -1);
  assert.equal(j.correndo, false);
});

test('na pausa da troca de fase, encostar no juiz voltando não machuca', () => {
  const jogo = novo(); const j = jogo.juiz; j.estado = 'respiro';
  j.x = 200;  // juiz no meio da arena (corrida interrompida)
  L.ferirJuiz(j, 99999);
  const c = jogo.craque; c.x = 260;
  L.passoJogo(jogo, L.criarControle(), 1/60);
  assert.equal(c.coracoes, 3);
});
