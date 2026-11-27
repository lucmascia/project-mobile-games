// Fase 2: Goleirão Bigodão
import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica, semente } from './carregar.mjs';
const L = carregarLogica();
const A = L.AJUSTES;
const DT = 1 / 60;

function jogoGoleiro(nivel = 1, dif = 'profissional') {
  const j = L.criarJogo(dif, semente(7), 2);
  j.chefe.nivel = nivel; j.chefe.estado = 'ataque';
  return j;
}
function noApice(c) {
  const ctrl = L.criarControle(); ctrl.pulo = true;
  for (let i = 0; i < 120; i++) { L.atualizarCraque(c, ctrl, DT, { chutes: [] }); if (!c.noChao && c.vy >= 0) break; }
}
function agachar(c) { const ctrl = L.criarControle(); ctrl.baixo = true; for (let i = 0; i < 5; i++) L.atualizarCraque(c, ctrl, DT, { chutes: [] }); }
function rodarAtaque(jogo, nome, maxT = 8) {
  L.ATAQUES[nome].iniciar(jogo);
  let t = 0, fim = false;
  while (t < maxT && !fim) { fim = L.ATAQUES[nome].atualizar(jogo, DT); L.atualizarPerigos(jogo, DT); t += DT; }
  return fim;
}
const PODERES = ['luva', 'luvaDupla', 'tiroDeMeta', 'tiroDeMetaDuplo', 'defesa', 'defesaDupla', 'barreira', 'rede', 'sacoDeBolas', 'sacoDeBolasRapido', 'careca'];

test('ficha do goleiro tem os poderes de cada nível do design', () => {
  const g = L.CHEFOES[2];
  assert.equal(g.tipo, 'goleiro'); assert.equal(g.nome, 'GOLEIRÃO BIGODÃO');
  assert.deepEqual({ ...g.ataquesPorNivel[1] }, { luva: 3, tiroDeMeta: 2, defesa: 2 });
  assert.deepEqual({ ...g.ataquesPorNivel[2] }, { barreira: 2, rede: 2, sacoDeBolas: 2, luvaDupla: 2 });
  assert.deepEqual({ ...g.ataquesPorNivel[3] }, { careca: 3, defesaDupla: 2, tiroDeMetaDuplo: 2, sacoDeBolasRapido: 1 });
  assert.equal(L.criarJogo('amador', semente(1), 2).chefe.vidaMax, A.goleiro.vida);
});

test('todo aviso do goleiro tem pelo menos 0,6 s', () => {
  const c = L.criarChefe(2, 'profissional');
  for (const nome of PODERES) assert.ok(L.tempoAviso(c, nome) >= 0.6, nome);
});

for (const nome of PODERES) {
  test(`poder ${nome} termina em menos de 8 s`, () => {
    for (const nivel of [1, 2, 3]) assert.ok(rodarAtaque(jogoGoleiro(nivel), nome), `${nome} nível ${nivel}`);
  });
}

test('luva alta: agachado escapa, em pé leva', () => {
  const jogo = jogoGoleiro(); const c = jogo.craque;
  const luva = L.novaLuva(jogo, true); luva.x = c.x;
  assert.equal(L.perigoAcerta(luva, c), true);
  agachar(c); assert.equal(L.perigoAcerta(luva, c), false);
});

test('luva baixa: pulando escapa, em pé leva', () => {
  const jogo = jogoGoleiro(); const c = jogo.craque;
  const luva = L.novaLuva(jogo, false); luva.x = c.x;
  assert.equal(L.perigoAcerta(luva, c), true);
  noApice(c); assert.equal(L.perigoAcerta(luva, c), false);
});

test('luva bumerangue chega até o lado do Craque e volta para o goleiro', () => {
  for (const dif of ['amador', 'profissional']) {
    const jogo = L.criarJogo(dif, semente(1), 2);
    const luva = L.novaLuva(jogo, true); jogo.perigos.push(luva);
    let menorX = luva.x;
    for (let i = 0; i < 60 * 8 && jogo.perigos.includes(luva); i++) { L.atualizarPerigos(jogo, DT); menorX = Math.min(menorX, luva.x); }
    assert.ok(menorX < 120, `${dif}: chegou só até ${menorX}`);
    assert.ok(!jogo.perigos.includes(luva), 'voltou e sumiu');
  }
});

test('tiro de meta quica pelo menos 3 vezes e sobe alto o bastante para passar por baixo', () => {
  const jogo = jogoGoleiro();
  const bola = L.novoTiroDeMeta(jogo); jogo.perigos.push(bola);
  let quiques = 0, vyAntes = bola.vy, maiorApice = 0, emQuique = false;
  for (let i = 0; i < 60 * 8 && jogo.perigos.includes(bola); i++) {
    L.atualizarPerigos(jogo, DT);
    if (vyAntes > 0 && bola.vy < 0) quiques++;
    if (bola.vy < 0) emQuique = true;
    if (quiques >= 1) maiorApice = Math.max(maiorApice, A.chao - (bola.y + bola.r));
    vyAntes = bola.vy;
  }
  assert.ok(quiques >= 3, `quicou ${quiques}`);
  assert.ok(maiorApice >= 120, `ápice depois do 1º quique ${maiorApice}`);
});

test('mancha de luz da careca: pulando escapa, em pé leva', () => {
  const jogo = jogoGoleiro(3); const c = jogo.craque;
  const luz = L.novaLuzChao(jogo); luz.x = c.x;
  assert.equal(L.perigoAcerta(luz, c), true);
  noApice(c); assert.equal(L.perigoAcerta(luz, c), false);
});

function chutarNoChefe(jogo, especial) {
  const cx = L.caixaChefe(jogo.chefe);
  jogo.chutes.push({ x: cx.x + 10, y: cx.y + cx.h / 2, vx: 0, vy: 0, r: especial ? 26 : 8, dano: especial ? 60 : 4, especial: !!especial });
  L.atualizarChutes(jogo, DT);
}

test('na defesa, chute normal não tira vida e avisa DEFENDEU', () => {
  const jogo = jogoGoleiro(); L.ATAQUES.defesa.iniciar(jogo);
  const vida = jogo.chefe.vida;
  chutarNoChefe(jogo, false);
  assert.equal(jogo.chefe.vida, vida);
  assert.ok(jogo.eventos.includes('defendeu'));
  assert.equal(jogo.chutes.length, 0);
  assert.equal(jogo.craque.acertosAcum, 0, 'defesa não enche o especial');
});

test('na defesa, a Bomba de Ouro fura e tira vida', () => {
  const jogo = jogoGoleiro(); L.ATAQUES.defesa.iniciar(jogo);
  const vida = jogo.chefe.vida;
  chutarNoChefe(jogo, true);
  assert.ok(jogo.chefe.vida < vida);
});

test('segurando chute a defesa inteira, a luta continua depois (defesa acaba e devolve fogo)', () => {
  for (const [nome, fogos] of [['defesa', 1], ['defesaDupla', 2]]) {
    const jogo = jogoGoleiro(); L.ATAQUES[nome].iniciar(jogo);
    let viuFogo = 0;
    for (let i = 0; i < 60 * 4; i++) {
      chutarNoChefe(jogo, false);
      L.ATAQUES[nome].atualizar(jogo, DT); L.atualizarPerigos(jogo, DT);
      viuFogo = Math.max(viuFogo, jogo.perigos.filter(p => p.tipo === 'fogo').length);
    }
    assert.equal(jogo.chefe.defendendo, false, nome);
    assert.equal(viuFogo, fogos, nome);
  }
});

test('bola de fogo do rebote quica entre o chão e o alto', () => {
  const jogo = jogoGoleiro();
  const fogo = L.novoFogo(jogo); jogo.perigos.push(fogo);
  let minY = 999, maxY = 0;
  for (let i = 0; i < 60 * 4 && jogo.perigos.includes(fogo); i++) { L.atualizarPerigos(jogo, DT); minY = Math.min(minY, fogo.y); maxY = Math.max(maxY, fogo.y); }
  assert.ok(maxY >= A.chao - 30, 'chega perto do chão');
  assert.ok(minY <= 170, 'chega perto do alto');
});

function soltarRede(jogo) {
  L.ATAQUES.rede.iniciar(jogo);
  for (let i = 0; i < 60 * 3 && !jogo.craque.presoTempo; i++) { L.ATAQUES.rede.atualizar(jogo, DT); L.atualizarPerigos(jogo, DT); }
}

test('rede-arapuca prende o Craque que fica embaixo', () => {
  const jogo = jogoGoleiro(2); soltarRede(jogo);
  assert.ok(jogo.craque.presoTempo > 0);
  assert.ok(jogo.eventos.includes('preso'));
  assert.equal(jogo.craque.coracoes, 3, 'a rede não tira coração');
});

test('preso não anda, não pula e não chuta', () => {
  const jogo = jogoGoleiro(2); soltarRede(jogo); const c = jogo.craque;
  const x = c.x, saida = { chutes: [] };
  const ctrl = L.criarControle(); ctrl.direita = true; ctrl.chute = true;
  for (let i = 0; i < 10; i++) L.atualizarCraque(c, ctrl, DT, saida);
  assert.equal(c.x, x); assert.equal(saida.chutes.length, 0); assert.equal(c.noChao, true);
});

test('4 toques nos botões soltam o Craque', () => {
  const jogo = jogoGoleiro(2); soltarRede(jogo); const c = jogo.craque;
  const vazio = L.criarControle();
  for (let k = 0; k < 4; k++) {
    const ctrl = L.criarControle(); ctrl[['chute', 'pulo', 'dash', 'especial'][k]] = true;
    L.atualizarCraque(c, ctrl, DT, { chutes: [] }); L.atualizarCraque(c, vazio, DT, { chutes: [] });
  }
  assert.equal(c.presoTempo, 0);
});

test('sem tocar em nada, o Craque se solta sozinho em 2 s', () => {
  const jogo = jogoGoleiro(2); soltarRede(jogo); const c = jogo.craque;
  for (let i = 0; i < Math.ceil(2.05 / DT); i++) L.atualizarCraque(c, L.criarControle(), DT, { chutes: [] });
  assert.equal(c.presoTempo, 0);
});

test('enquanto o Craque está preso, o goleiro não começa outro ataque', () => {
  const jogo = jogoGoleiro(2); soltarRede(jogo);
  const g = jogo.chefe; g.estado = 'respiro'; g.t = 0;
  jogo.craque.presoTempo = 1.5;
  L.atualizarChefe(g, DT, jogo);
  assert.equal(g.estado, 'respiro');
  jogo.craque.presoTempo = 0;
  L.atualizarChefe(g, DT, jogo);
  assert.equal(g.estado, 'aviso');
});

test('barreira bloqueia chutes e cai com 4', () => {
  const jogo = jogoGoleiro(2); L.ATAQUES.barreira.iniciar(jogo);
  const bs = jogo.inimigos.filter(i => i.tipo === 'barreira');
  assert.equal(bs.length, 3);
  const b = bs[0];
  for (let k = 0; k < 3; k++) { jogo.chutes.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0, r: 8, dano: 4 }); L.atualizarChutes(jogo, DT); }
  assert.ok(jogo.inimigos.includes(b)); assert.equal(jogo.chutes.length, 0);
  jogo.chutes.push({ x: b.x + b.w / 2, y: b.y + b.h / 2, vx: 0, vy: 0, r: 8, dano: 4 }); L.atualizarChutes(jogo, DT);
  assert.ok(!jogo.inimigos.includes(b));
});

test('barreira não machuca o Craque', () => {
  const jogo = jogoGoleiro(2); L.ATAQUES.barreira.iniciar(jogo);
  jogo.craque.x = jogo.inimigos[0].x;
  jogo.chefe.estado = 'respiro'; jogo.chefe.t = 99;
  L.passoJogo(jogo, L.criarControle(), DT);
  assert.equal(jogo.craque.coracoes, 3);
});

test('não sai outra barreira enquanto uma está de pé', () => {
  const jogo = jogoGoleiro(2); L.ATAQUES.barreira.iniciar(jogo);
  for (let i = 0; i < 200; i++) assert.notEqual(L.escolherAtaque(jogo.chefe, jogo), 'barreira');
});

test('troca de nível solta o Craque e derruba a barreira', () => {
  const jogo = jogoGoleiro(2); L.ATAQUES.barreira.iniciar(jogo);
  jogo.craque.presoTempo = 1.5;
  jogo.chefe.estado = 'respiro';
  L.ferirChefe(jogo.chefe, 99999);
  L.passoJogo(jogo, L.criarControle(), DT);
  assert.equal(jogo.craque.presoTempo, 0);
  assert.equal(jogo.inimigos.length, 0);
});

// mesma "pressão" usada no ajuste do juiz: golpes num Craque parado em 30 s
// (preso na rede, ele toca no botão para sair, como uma criança faria)
function pressao(dif, fase, nivel, anda) {
  let total = 0;
  for (const seed of [1, 2, 3, 4, 5]) {
    const j = L.criarJogo(dif, semente(seed), fase); j.chefe.nivel = nivel;
    j.chefe.vida = nivel === 1 ? j.chefe.vidaMax : L.limiteNivel(j.chefe, nivel - 1);
    const c = L.criarControle();
    for (let i = 0; i < 60 * 30; i++) {
      c.chute = j.craque.presoTempo > 0 && i % 6 < 3;   // preso: toca no botão para sair da rede
      if (anda) { const p = Math.floor(i / 90) % 2; c.direita = p === 0; c.esquerda = p === 1; }
      j.craque.coracoes = 99; L.passoJogo(j, c, DT);
      for (const e of j.eventos) if (e === 'dano') total++;
      j.eventos.length = 0;
    }
  }
  return total / 5;
}
test('níveis do goleiro: pressão equilibrada com o juiz', () => {
  for (const dif of ['amador', 'profissional']) {
    const juiz1 = pressao(dif, 1, 1), g1 = pressao(dif, 2, 1), g2 = pressao(dif, 2, 2), g3 = pressao(dif, 2, 3);
    assert.ok(g1 <= juiz1 * 1.3, `${dif}: goleiro N1 ${g1} vs juiz N1 ${juiz1}`);
    assert.ok(g2 <= g1 * 1.3, `${dif}: N2 ${g2} vs N1 ${g1}`);
    assert.ok(g3 <= g1 * 1.3, `${dif}: N3 ${g3} vs N1 ${g1}`);
    // os níveis vão ficando mais difíceis: média do Craque parado e do Craque andando
    // (barreira, rede e defesa somam dificuldade que não aparece em corações)
    const m = n => (pressao(dif, 2, n) + pressao(dif, 2, n, true)) / 2;
    const m1 = m(1), m2 = m(2), m3 = m(3);
    assert.ok(m2 >= m1 * 0.9, `${dif}: N2 ${m2} deveria ser pelo menos como N1 ${m1}`);
    assert.ok(m3 >= m2 * 0.9, `${dif}: N3 ${m3} deveria ser pelo menos como N2 ${m2}`);
  }
});
