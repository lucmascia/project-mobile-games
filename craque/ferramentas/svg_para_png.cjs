const { chromium } = require('playwright'); const fs = require('fs');
(async () => { const [, , src, out, w, h, esc] = process.argv; const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +(esc || 1) });
  await p.setContent('<html><body style="margin:0;background:transparent">' + fs.readFileSync(src, 'utf8') + '</body></html>');
  await p.waitForTimeout(300); await p.screenshot({ path: out, omitBackground: true, clip: { x: 0, y: 0, width: +w, height: +h } }); await b.close(); })();
