import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;
const DT = 1/60;

function rodar(c, ctrl, segundos, saida = { chutes: [] }) {
  for (let i = 0; i < Math.round(segundos / DT); i++) L.atualizarCraque(c, ctrl, DT, saida);
  return saida;
}
const novo = () => L.criarCraque('profissional');

test('Craque começa no chão com os corações da dificuldade', () => {
  const c = novo();
  assert.equal(c.coracoes, 3);
  assert.equal(L.criarCraque('amador').coracoes, 5);
  rodar(c, L.criarControle(), 0.2);
  assert.equal(c.noChao, true);
  assert.equal(Math.round(c.y + c.h), A.chao);
});

test('anda para a direita e para na borda da arena', () => {
  const c = novo(); const ctrl = L.criarControle(); ctrl.direita = true;
  const x0 = c.x; rodar(c, ctrl, 0.5);
  assert.ok(c.x > x0 + 100);
  rodar(c, ctrl, 10);
  assert.ok(c.x + c.w <= A.largura);
  ctrl.direita = false; ctrl.esquerda = true; rodar(c, ctrl, 10);
  assert.ok(c.x >= 0);
  assert.equal(c.virado, -1);
});

test('pula só quando está no chão', () => {
  const c = novo(); const ctrl = L.criarControle();
  rodar(c, ctrl, 0.1);
  ctrl.pulo = true; rodar(c, ctrl, 0.1);
  assert.equal(c.noChao, false);
  const vy = c.vy;
  ctrl.pulo = false; rodar(c, ctrl, DT); ctrl.pulo = true; rodar(c, ctrl, DT);
  assert.ok(c.vy > vy, 'não ganhou um segundo pulo no ar');
});

test('soltar o pulo cedo deixa o pulo mais baixo', () => {
  const alto = novo(), baixo = novo();
  const c1 = L.criarControle(); c1.pulo = true;
  const c2 = L.criarControle(); c2.pulo = true;
  let topo1 = 999, topo2 = 999;
  for (let i = 0; i < 90; i++) {
    if (i === 4) c2.pulo = false;
    L.atualizarCraque(alto, c1, DT, { chutes: [] }); L.atualizarCraque(baixo, c2, DT, { chutes: [] });
    topo1 = Math.min(topo1, alto.y); topo2 = Math.min(topo2, baixo.y);
  }
  assert.ok(topo2 > topo1 + 40, `pulo curto ${topo2} vs longo ${topo1}`);
});

test('agachar diminui a altura e não anda', () => {
  const c = novo(); const ctrl = L.criarControle();
  rodar(c, ctrl, 0.1); const hEmPe = c.h; const x0 = c.x;
  ctrl.baixo = true; ctrl.direita = true; rodar(c, ctrl, 0.3);
  assert.equal(c.agachado, true);
  assert.ok(c.h < hEmPe * 0.75);
  assert.equal(Math.round(c.y + c.h), A.chao);
  assert.equal(c.x, x0);
});

test('drible anda ~dashDist, fica invencível e respeita a recarga', () => {
  const c = novo(); const ctrl = L.criarControle();
  rodar(c, ctrl, 0.1); const x0 = c.x;
  ctrl.dash = true; L.atualizarCraque(c, ctrl, DT, { chutes: [] });
  assert.ok(c.dashTempo > 0);
  assert.equal(L.ferirCraque(c), false, 'invencível durante o drible');
  rodar(c, ctrl, A.craque.dashTempo + 0.02);
  assert.ok(Math.abs(c.x - x0 - A.craque.dashDist) < 15, `andou ${c.x - x0}`);
  ctrl.dash = false; rodar(c, ctrl, DT); ctrl.dash = true; rodar(c, ctrl, DT);
  assert.equal(c.dashTempo, 0, 'ainda em recarga');
});

test('segurar chute solta chutes na cadência', () => {
  const c = novo(); const ctrl = L.criarControle(); ctrl.chute = true;
  const saida = rodar(c, ctrl, 1);
  const esperado = 1 / A.craque.cadenciaChute;
  assert.ok(Math.abs(saida.chutes.length - esperado) <= 1.5, `${saida.chutes.length} chutes`);
  assert.ok(saida.chutes[0].vx > 0);
  assert.equal(saida.chutes[0].dano, A.craque.danoChute);
});

test('mira para cima e para a direita dá chute na diagonal', () => {
  const c = novo(); const ctrl = L.criarControle(); ctrl.cima = true; ctrl.direita = true;
  const d = L.direcaoMira(c, ctrl);
  assert.ok(Math.abs(d.dx - Math.SQRT1_2) < 1e-6 && Math.abs(d.dy + Math.SQRT1_2) < 1e-6);
  ctrl.direita = false;
  const v = L.direcaoMira(c, ctrl);
  assert.equal(v.dx, 0); assert.equal(v.dy, -1);
  ctrl.cima = false;
  assert.equal(L.direcaoMira(c, ctrl).dx, c.virado);
});

test('levar dano tira 1 coração e dá invencibilidade', () => {
  const c = novo();
  assert.equal(L.ferirCraque(c), true);
  assert.equal(c.coracoes, 2);
  assert.equal(L.ferirCraque(c), false);
  rodar(c, L.criarControle(), A.craque.invencivelAposDano + 0.05);
  assert.equal(L.ferirCraque(c), true);
  assert.equal(c.coracoes, 1);
});

test('especial só sai com a barra cheia e zera a barra', () => {
  const c = novo(); const ctrl = L.criarControle(); ctrl.especial = true;
  let saida = rodar(c, ctrl, 0.1);
  assert.equal(saida.chutes.length, 0);
  for (let i = 0; i < A.craque.segmentosEspecial * A.craque.acertosPorSegmento; i++) L.ganharEspecial(c);
  assert.equal(c.especial, A.craque.segmentosEspecial);
  ctrl.especial = false; rodar(c, ctrl, DT); ctrl.especial = true;
  saida = rodar(c, ctrl, DT);
  assert.equal(saida.chutes.length, 1);
  assert.equal(saida.chutes[0].especial, true);
  assert.equal(saida.chutes[0].dano, A.craque.danoEspecial);
  assert.equal(c.especial, 0);
});
