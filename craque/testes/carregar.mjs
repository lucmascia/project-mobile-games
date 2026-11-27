// Lê o bloco <script id="logica"> do index.html e roda ele num contexto isolado.
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const html = readFileSync(new URL('../../site/craque/index.html', import.meta.url), 'utf8');
const m = html.match(/<script id="logica">([\s\S]*?)<\/script>/);
if (!m) throw new Error('bloco logica não encontrado');
const codigo = m[1];

export function carregarLogica() {
  const ctx = { Math, console };
  vm.createContext(ctx);
  // "var" e "function" no topo viram globais do contexto
  vm.runInContext(codigo + '\n;globalThis.__exp = { AJUSTES, ATAQUES: typeof ATAQUES!=="undefined"?ATAQUES:undefined };', ctx);
  return ctx;
}

// gerador aleatório previsível para testes
export function semente(s = 1) {
  return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; };
}
