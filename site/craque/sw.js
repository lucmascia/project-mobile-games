// Guarda o jogo no celular para ele abrir mesmo sem internet.
// Os arquivos vêm do que está guardado e são atualizados em segundo plano:
// uma versão nova do jogo aparece na segunda vez que ele é aberto depois da mudança.
// Ao mudar a lista de arquivos, troque o número da VERSAO.
const VERSAO = 'craque-v4';
const ARQUIVOS = ['./', 'index.html', 'manifest.webmanifest', 'icones/icone-180.png', 'icones/icone-192.png', 'icones/icone-512.png'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(caches.open(VERSAO).then((c) => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nomes) => Promise.all(nomes.filter((n) => n !== VERSAO).map((n) => caches.delete(n))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evento) => {
  const pedido = evento.request;
  if (pedido.method !== 'GET' || new URL(pedido.url).origin !== self.location.origin) return;
  evento.respondWith((async () => {
    const cache = await caches.open(VERSAO);
    const guardado = await cache.match(pedido, { ignoreSearch: true });
    const novo = fetch(pedido)
      .then((r) => { if (r.ok) cache.put(pedido, r.clone()); return r; })
      .catch(() => null);
    if (guardado) { evento.waitUntil(novo); return guardado; }
    return (await novo) || new Response('Sem conexão.', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  })());
});
