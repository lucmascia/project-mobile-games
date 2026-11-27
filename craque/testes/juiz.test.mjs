import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica, semente } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;
const DT = 1/60;

test('limites das fases seguem 40/35/25%', () => {
  const j = L.criarJuiz('profissional');
  assert.equal(L.limiteFase(j, 1), j.vidaMax * 0.60);
  assert.equal(L.limiteFase(j, 2), j.vidaMax * 0.25);
  assert.equal(L.limiteFase(j, 3), 0);
});

test('dano grande na fase 1 para no limite e entra em transição', () => {
  const j = L.criarJuiz('profissional'); j.estado = 'respiro';
  const aplicado = L.ferirJuiz(j, 99999);
  assert.equal(j.vida, j.vidaMax * 0.60);
  assert.equal(aplicado, j.vidaMax * 0.40);
  assert.equal(j.estado, 'transicao');
  assert.equal(j.fase, 1);
});

test('durante a transição o juiz não leva dano', () => {
  const j = L.criarJuiz('profissional'); j.estado = 'respiro';
  L.ferirJuiz(j, 99999);
  assert.equal(L.ferirJuiz(j, 50), 0);
  assert.equal(j.vida, j.vidaMax * 0.60);
});

test('depois da pausa de transição vai para a fase 2', () => {
  const j = L.criarJuiz('profissional'); j.estado = 'respiro';
  L.ferirJuiz(j, 99999);
  const jogo = { juiz: j };
  for (let i = 0; i < Math.round((A.juiz.transicao - 0.1) / DT); i++) L.atualizarJuiz(j, DT, jogo);
  assert.equal(j.fase, 1);
  for (let i = 0; i < Math.round(0.2 / DT); i++) L.atualizarJuiz(j, DT, jogo);
  assert.equal(j.fase, 2);
  assert.notEqual(j.estado, 'transicao');
});

test('vida zero na fase 3 derrota o juiz', () => {
  const j = L.criarJuiz('profissional'); j.estado = 'respiro'; j.fase = 3; j.vida = 10;
  L.ferirJuiz(j, 50);
  assert.equal(j.vida, 0);
  assert.equal(j.estado, 'derrotado');
});

test('escolherAtaque nunca repete o mesmo ataque seguido', () => {
  for (const fase of [1, 2, 3]) {
    const j = L.criarJuiz('profissional', semente(fase)); j.fase = fase;
    let anterior = null;
    const vistos = new Set();
    for (let i = 0; i < 200; i++) {
      const a = L.escolherAtaque(j);
      assert.notEqual(a, anterior);
      assert.ok(a in L.ATAQUES_POR_FASE[fase]);
      anterior = a; vistos.add(a);
    }
    assert.equal(vistos.size, Object.keys(L.ATAQUES_POR_FASE[fase]).length);
  }
});

test('todo aviso tem pelo menos 0,6 s e o Amador avisa 1,5× mais', () => {
  const pro = L.criarJuiz('profissional'), ama = L.criarJuiz('amador');
  for (const fase of [1, 2, 3]) for (const nome of Object.keys(L.ATAQUES_POR_FASE[fase])) {
    const tp = L.tempoAviso(pro, nome), ta = L.tempoAviso(ama, nome);
    assert.ok(tp >= A.juiz.avisoMin, `${nome} ${tp}`);
    assert.ok(Math.abs(ta - tp * 1.5) < 1e-9, `${nome} amador`);
  }
});

test('ciclo: respiro → aviso → ataque', () => {
  const j = L.criarJuiz('profissional', semente(3));
  const iniciados = [];
  const jogo = { juiz: j };
  L.ATAQUES_TESTE = null;
  // substitui os ataques por um falso que termina na hora
  const falso = { iniciar() { iniciados.push(j.ataqueAtual); }, atualizar() { return true; } };
  const original = L.ATAQUES;
  L.ATAQUES = new Proxy({}, { get: () => falso });
  try {
    let viuAviso = false;
    for (let i = 0; i < 60 * 8; i++) { L.atualizarJuiz(j, DT, jogo); if (j.estado === 'aviso') viuAviso = true; }
    assert.ok(viuAviso);
    assert.ok(iniciados.length >= 2, `iniciou ${iniciados.length}`);
  } finally { L.ATAQUES = original; }
});
