import test from 'node:test';
import assert from 'node:assert/strict';
import { carregarLogica } from './carregar.mjs';
const L = carregarLogica();

test('retângulos sobrepostos colidem', () => {
  assert.equal(L.colideRetRet({x:0,y:0,w:10,h:10},{x:5,y:5,w:10,h:10}), true);
});
test('retângulos só encostando não colidem', () => {
  assert.equal(L.colideRetRet({x:0,y:0,w:10,h:10},{x:10,y:0,w:10,h:10}), false);
});
test('retângulos separados não colidem', () => {
  assert.equal(L.colideRetRet({x:0,y:0,w:10,h:10},{x:50,y:50,w:10,h:10}), false);
});
test('círculo dentro do retângulo colide', () => {
  assert.equal(L.colideCircRet({x:5,y:5,r:2},{x:0,y:0,w:10,h:10}), true);
});
test('círculo perto da quina mas fora não colide', () => {
  assert.equal(L.colideCircRet({x:13,y:13,r:3},{x:0,y:0,w:10,h:10}), false);
});
test('círculo tocando a quina colide', () => {
  assert.equal(L.colideCircRet({x:12,y:12,r:3},{x:0,y:0,w:10,h:10}), true);
});
test('limitar prende o valor entre min e max', () => {
  assert.equal(L.limitar(5,0,3), 3);
  assert.equal(L.limitar(-1,0,3), 0);
  assert.equal(L.limitar(2,0,3), 2);
});
test('AJUSTES tem a resolução e as dificuldades do design', () => {
  const A = L.AJUSTES;
  assert.equal(A.largura, 960); assert.equal(A.altura, 540);
  assert.equal(A.dificuldades.amador.coracoes, 5);
  assert.equal(A.dificuldades.profissional.coracoes, 3);
  assert.equal(A.dificuldades.amador.multAviso, 1.5);
  assert.deepEqual([...A.juiz.fases], [0.40, 0.35, 0.25]);
  assert.equal(A.juiz.avisoMin, 0.6);
  assert.equal(A.craque.segmentosEspecial, 5);
});
