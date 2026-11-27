import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica, semente } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;
const DT = 1/60;

function jogoNovo(fase = 1, dif = 'profissional') {
  const j = L.criarJogo(dif, semente(7));
  j.chefe.nivel = fase; j.chefe.estado = 'ataque';
  return j;
}
function noApice(c) { // faz o Craque pular até o ponto mais alto
  const ctrl = L.criarControle(); ctrl.pulo = true;
  for (let i = 0; i < 120; i++) { L.atualizarCraque(c, ctrl, DT, { chutes: [] }); if (!c.noChao && c.vy >= 0) break; }
}
function agachar(c) {
  const ctrl = L.criarControle(); ctrl.baixo = true;
  for (let i = 0; i < 5; i++) L.atualizarCraque(c, ctrl, DT, { chutes: [] });
}

const TODOS = ['amarelo','apitaco','corrida','spray','bandeirinhas','vermelho','var','chuva','apitacoDuplo'];

for (const nome of TODOS) {
  test(`ataque ${nome} termina em menos de 8 s`, () => {
    for (const fase of [1, 2, 3]) {
      const jogo = jogoNovo(fase);
      L.ATAQUES[nome].iniciar(jogo);
      let t = 0, fim = false;
      while (t < 8 && !fim) { fim = L.ATAQUES[nome].atualizar(jogo, DT); L.atualizarPerigos(jogo, DT); t += DT; }
      assert.ok(fim, `${nome} fase ${fase} não terminou`);
    }
  });
}

test('ataques criam perigos (todos com forma válida)', () => {
  for (const nome of TODOS) {
    const jogo = jogoNovo(2);
    L.ATAQUES[nome].iniciar(jogo);
    for (let i = 0; i < 120; i++) { L.ATAQUES[nome].atualizar(jogo, DT); L.atualizarPerigos(jogo, DT); }
    const total = jogo.perigos.length + jogo.inimigos.length + (nome === 'corrida' ? 1 : 0);
    assert.ok(total > 0, `${nome} não criou nada`);
    for (const p of jogo.perigos) assert.ok(p.r > 0 || (p.w > 0 && p.h > 0), `${nome}: ${p.tipo} sem forma`);
  }
});

test('laser alto não acerta o Craque agachado, mas acerta em pé', () => {
  const jogo = jogoNovo(3); const c = jogo.craque;
  const laser = L.novoLaser(true); laser.x = c.x - 10;
  assert.equal(L.perigoAcerta(laser, c), true);
  agachar(c);
  assert.equal(L.perigoAcerta(laser, c), false);
});

test('laser baixo não acerta o Craque no alto do pulo, mas acerta em pé', () => {
  const jogo = jogoNovo(3); const c = jogo.craque;
  const laser = L.novoLaser(false); laser.x = c.x - 10;
  assert.equal(L.perigoAcerta(laser, c), true);
  noApice(c);
  assert.equal(L.perigoAcerta(laser, c), false);
});

test('onda do apitaço passa por baixo do Craque pulando', () => {
  const jogo = jogoNovo(1); const c = jogo.craque;
  const onda = L.novaOnda(jogo); onda.x = c.x;
  assert.equal(L.perigoAcerta(onda, c), true);
  noApice(c);
  assert.equal(L.perigoAcerta(onda, c), false);
});

test('dá para pular por cima do juiz correndo', () => {
  const jogo = jogoNovo(1); const c = jogo.craque;
  jogo.chefe.correndo = true; jogo.chefe.x = c.x - 60;
  const caixa = L.caixaChefe(jogo.chefe);
  assert.equal(L.colideRetRet(caixa, c), true);
  noApice(c);
  assert.equal(L.colideRetRet(caixa, c), false);
});

function chutarEm(jogo, alvo) {
  jogo.chutes.push({ x: alvo.x + alvo.w / 2, y: alvo.y + alvo.h / 2, vx: 0, vy: 0, r: 8, dano: 4, especial: false });
  L.atualizarChutes(jogo, DT);
}

test('cartão vermelho some depois de 4 chutes', () => {
  const jogo = jogoNovo(2);
  L.ATAQUES.vermelho.iniciar(jogo);
  const v = jogo.perigos.find(p => p.tipo === 'vermelho');
  for (let i = 0; i < 3; i++) chutarEm(jogo, v);
  assert.ok(jogo.perigos.includes(v));
  chutarEm(jogo, v);
  assert.ok(!jogo.perigos.includes(v));
});

test('bandeirinha cai com 3 chutes', () => {
  const jogo = jogoNovo(2);
  L.ATAQUES.bandeirinhas.iniciar(jogo);
  assert.equal(jogo.inimigos.length, 2);
  const b = jogo.inimigos[0];
  for (let i = 0; i < 2; i++) chutarEm(jogo, b);
  assert.ok(jogo.inimigos.includes(b));
  chutarEm(jogo, b);
  assert.ok(!jogo.inimigos.includes(b));
});

test('chute no juiz tira vida e enche o especial', () => {
  const jogo = jogoNovo(1); jogo.chefe.estado = 'respiro';
  const antes = jogo.chefe.vida;
  for (let i = 0; i < A.craque.acertosPorSegmento; i++) chutarEm(jogo, L.caixaChefe(jogo.chefe));
  assert.equal(jogo.chefe.vida, antes - A.craque.acertosPorSegmento * 4);
  assert.equal(jogo.craque.especial, 1);
  assert.ok(jogo.eventos.includes('acerto'));
});

test('Bomba de Ouro atravessa cartões e destrói eles', () => {
  const jogo = jogoNovo(1);
  jogo.perigos.push({ tipo: 'amarelo', x: 400, y: 300, w: 26, h: 18, vx: 0, vy: 0 });
  jogo.chutes.push({ x: 410, y: 309, vx: 0, vy: 0, r: 26, dano: 60, especial: true });
  L.atualizarChutes(jogo, DT);
  assert.equal(jogo.perigos.length, 0);
  assert.equal(jogo.chutes.length, 1);
});

test('perigos que saem da tela são apagados', () => {
  const jogo = jogoNovo(1);
  jogo.perigos.push({ tipo: 'amarelo', x: -500, y: 300, w: 26, h: 18, vx: -100, vy: 0 });
  jogo.perigos.push({ tipo: 'amarelo', x: 400, y: 900, w: 26, h: 18, vx: 0, vy: 0 });
  jogo.chutes.push({ x: 2000, y: 100, vx: 800, vy: 0, r: 8, dano: 4 });
  L.atualizarPerigos(jogo, DT); L.atualizarChutes(jogo, DT);
  assert.equal(jogo.perigos.length, 0);
  assert.equal(jogo.chutes.length, 0);
});

test('perigo inativo (sombra/mira) não machuca', () => {
  const jogo = jogoNovo(1); const c = jogo.craque;
  assert.equal(L.perigoAcerta({ tipo: 'sombra', inativo: true, x: c.x, y: c.y, w: c.w, h: c.h }, c), false);
});
