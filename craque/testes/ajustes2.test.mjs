// Rodada 2: pulo mais alto, drible com "OLÉ!" e 2º/3º tempo mais justos
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica, semente } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;
const DT = 1 / 60;

test('pulo alcança pelo menos 210 px de altura', () => {
  const c = L.criarCraque('profissional'); const ctrl = L.criarControle(); ctrl.pulo = true;
  let topo = c.y;
  for (let i = 0; i < 90; i++) { L.atualizarCraque(c, ctrl, DT, { chutes: [] }); topo = Math.min(topo, c.y); }
  const altura = (A.chao - 70) - topo;
  assert.ok(altura >= 210 && altura <= 250, `altura ${altura.toFixed(0)}`);
});

test('driblar através de um ataque dá OLÉ!, não machuca e enche o especial', () => {
  const jogo = L.criarJogo('profissional', semente(3)); const c = jogo.craque;
  jogo.juiz.estado = 'respiro'; jogo.juiz.t = 99;
  jogo.perigos.push({ tipo: 'amarelo', x: c.x + 60, y: c.y + 20, w: 26, h: 18, vx: 0, vy: 0 });
  const ctrl = L.criarControle(); ctrl.dash = true;
  for (let i = 0; i < 20; i++) L.passoJogo(jogo, ctrl, DT);
  assert.equal(c.coracoes, 3);
  assert.ok(jogo.eventos.includes('ole'), 'evento ole');
  assert.equal(jogo.eventos.filter(e => e === 'ole').length, 1, 'um OLÉ por ataque');
  assert.ok(c.acertosAcum >= 3 || c.especial > 0, 'ganhou especial');
});

test('juiz não chama bandeirinhas se ainda tem bandeirinha em campo', () => {
  const jogo = L.criarJogo('profissional', semente(5)); const j = jogo.juiz; j.fase = 2;
  jogo.inimigos.push({ tipo: 'bandeirinha' });
  for (let i = 0; i < 200; i++) assert.notEqual(L.escolherAtaque(j, jogo), 'bandeirinhas');
});

test('juiz não solta outro cartão vermelho com um ainda perseguindo', () => {
  const jogo = L.criarJogo('profissional', semente(6)); const j = jogo.juiz; j.fase = 2;
  jogo.perigos.push({ tipo: 'vermelho' });
  for (let i = 0; i < 200; i++) assert.notEqual(L.escolherAtaque(j, jogo), 'vermelho');
});

test('no Amador, o intervalo devolve 1 coração', () => {
  const jogo = L.criarJogo('amador', semente(2)); jogo.juiz.estado = 'respiro';
  jogo.craque.coracoes = 2;
  L.ferirJuiz(jogo.juiz, 99999);
  L.passoJogo(jogo, L.criarControle(), DT);
  assert.equal(jogo.craque.coracoes, 3);
  assert.ok(jogo.eventos.includes('cura'));
});

test('no Profissional, o intervalo não devolve coração', () => {
  const jogo = L.criarJogo('profissional', semente(2)); jogo.juiz.estado = 'respiro';
  jogo.craque.coracoes = 2;
  L.ferirJuiz(jogo.juiz, 99999);
  L.passoJogo(jogo, L.criarControle(), DT);
  assert.equal(jogo.craque.coracoes, 2);
});

test('no Amador só entra 1 bandeirinha', () => {
  const jogo = L.criarJogo('amador', semente(2)); jogo.juiz.fase = 2;
  L.ATAQUES.bandeirinhas.iniciar(jogo);
  assert.equal(jogo.inimigos.length, 1);
});

test('Amador descansa mais entre os ataques', () => {
  const a = L.criarJogo('amador'), p = L.criarJogo('profissional');
  assert.ok(L.tempoRespiro(a.juiz) > L.tempoRespiro(p.juiz));
});

// "pressão": golpes que um Craque parado levaria em 30 s de cada fase
function pressao(dif, fase) {
  let total = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const j = L.criarJogo(dif, semente(seed)); j.juiz.fase = fase;
    j.juiz.vida = fase === 1 ? j.juiz.vidaMax : L.limiteFase(j.juiz, fase - 1);
    const c = L.criarControle();
    for (let i = 0; i < 60 * 30; i++) {
      j.craque.coracoes = 99; L.passoJogo(j, c, DT);
      for (const e of j.eventos) if (e === 'dano') total++;
      j.eventos.length = 0;
    }
  }
  return total / 5;
}
test('2º e 3º tempo não ficam muito mais pesados que o 1º', () => {
  for (const dif of ['amador', 'profissional']) {
    const p1 = pressao(dif, 1), p2 = pressao(dif, 2), p3 = pressao(dif, 3);
    assert.ok(p2 <= p1 * 1.3, `${dif}: 2º tempo ${p2} vs 1º ${p1}`);
    assert.ok(p3 <= p1 * 1.3, `${dif}: 3º tempo ${p3} vs 1º ${p1}`);
  }
});
