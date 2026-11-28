# Monta a folha de sprites do jogo a partir dos pacotes CC0 do Kenney.
# Uso: python3 -I montar_sprites.py <pasta_pacotes> <saida.js>
import sys, os, io, base64, json
import numpy as np
from PIL import Image

P = sys.argv[1]; SAIDA = sys.argv[2]
TOON = P + '/toon-characters/x/'

def pose(pers, nome):
    pref = os.listdir(TOON + pers + '/PNG/Poses HD')[0].rsplit('_', 1)[0]
    return Image.open(TOON + pers + '/PNG/Poses HD/' + pref + '_' + nome + '.png').convert('RGBA')

def hsv(a):
    rgb = a[..., :3].astype(np.float32) / 255
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    h = np.zeros_like(mx)
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    m = d > 1e-6
    hr = (mx == r) & m; hg = (mx == g) & m & ~hr; hb = m & ~hr & ~hg
    h[hr] = ((g - b)[hr] / d[hr]) % 6; h[hg] = (b - r)[hg] / d[hg] + 2; h[hb] = (r - g)[hb] / d[hb] + 4
    h = h * 60; s = np.where(mx > 0, d / np.maximum(mx, 1e-6), 0)
    return h, s, mx

def pintar(a, mascara, cor, v_ref):
    """troca a cor dos pixels da máscara mantendo a luz/sombra (v relativo a v_ref)"""
    _, _, v = hsv(a)
    f = np.clip(v / v_ref, 0, 1.25)[..., None]
    alvo = np.array(cor, np.float32)[None, None, :]
    novo = np.clip(alvo * f, 0, 255)
    a[..., :3] = np.where(mascara[..., None], novo, a[..., :3])

def juiz(im):
    a = np.array(im).astype(np.float32); h, s, v = hsv(a); op = a[..., 3] > 0
    colete = op & (h >= 22.5) & (h <= 42) & (s > 0.45)
    calca = op & (h > 215) & (h < 260) & (s > 0.3)
    pintar(a, colete, (240, 80, 140), 0.93)
    pintar(a, calca, (58, 58, 72), 0.78)
    return Image.fromarray(a.astype(np.uint8))

def bandeirinha(im):
    a = np.array(im).astype(np.float32); h, s, v = hsv(a); op = a[..., 3] > 0
    camisa = op & (h > 120) & (h < 175) & (s > 0.4)
    calca = op & (h > 215) & (h < 260) & (s > 0.3)
    pintar(a, camisa, (240, 80, 140), 0.75)
    pintar(a, calca, (58, 58, 72), 0.76)
    return Image.fromarray(a.astype(np.uint8))

def craque(im):
    # calça laranja vira calção branco; a camisa verde é recolorida no jogo (cor do time)
    a = np.array(im).astype(np.float32); h, s, v = hsv(a); op = a[..., 3] > 0
    calca = op & (h >= 22.5) & (h <= 42) & (s > 0.45)
    pintar(a, calca, (236, 240, 250), 0.93)
    return Image.fromarray(a.astype(np.uint8))

def branco(im):  # partículas: tudo branco, a transparência vem do brilho
    a = np.array(im.convert('RGBA')).astype(np.float32)
    lum = a[..., :3].max(-1)
    alfa = np.minimum(a[..., 3], lum)
    out = np.zeros_like(a); out[..., :3] = 255; out[..., 3] = alfa
    return Image.fromarray(out.astype(np.uint8))

quadros = []   # (grupo, nome, imagem, celula_w, celula_h)
def add(grupo, nome, im, esc):
    cw, ch = round(im.width * esc), round(im.height * esc)
    im = im.resize((cw, ch), Image.LANCZOS)
    quadros.append((grupo, nome, im, cw, ch))

for n in ['idle', 'run0', 'run1', 'run2', 'jump', 'fall', 'duck', 'kick', 'attackKick', 'slide', 'hit', 'cheer0', 'cheer1']:
    add('craque', n, craque(pose('Male adventurer', n)), 0.75)
for n in ['idle', 'show', 'attack0', 'talk', 'interact', 'cheer0', 'cheer1', 'shove', 'slide', 'hit']:
    add('juiz', n, juiz(pose('Male person', n)), 1.0)
for n in ['idle', 'show']:
    add('bandeirinha', n, bandeirinha(pose('Female person', n)), 0.5)
# Goleirão Bigodão: renderizado a partir do vetor (ver goleiro_svg.py), em 3x (célula 288×384)
GOL = os.environ.get('GOLEIRO_PNG')
if GOL:
    import re
    xml = open(TOON + 'Male person/Tilesheet/character_malePerson_sheetHD.xml').read()
    pos = {m[0]: (int(m[1]), int(m[2])) for m in re.findall(r'name="([^"]+)" x="(\d+)" y="(\d+)"', xml)}
    gfolha = Image.open(GOL).convert('RGBA'); k = 1.5   # 3x do SVG = 1,5x da folha HD
    for n in ['idle', 'show', 'attack0', 'kick', 'duck', 'cheer0', 'cheer1', 'hold', 'talk', 'think', 'hit', 'shove']:
        x, y = pos[n]
        add('goleiro', n, gfolha.crop((int(x * k), int(y * k), int(x * k) + 288, int(y * k) + 384)), 1.0)
PART = P + '/particle-pack/x/PNG (Transparent)/'
for n in ['smoke_04', 'dirt_02', 'star_06', 'spark_01', 'circle_02', 'flame_04', 'fire_01', 'twirl_01', 'slash_03', 'light_01', 'magic_03']:
    add('particula', n, branco(Image.open(PART + n + '.png')), 128 / 512)
BG = P + '/background-elements-remastered/x/PNG/Default/'
for n, e in [('moonFull', 0.7), ('cloud1', 0.6), ('cloud3', 0.6), ('cloud6', 0.6)]:
    add('ceu', n, Image.open(BG + n + '.png').convert('RGBA'), e)

# corta as bordas vazias e empacota em prateleiras
pecas = []
for g, n, im, cw, ch in quadros:
    bb = im.getbbox() or (0, 0, 1, 1)
    pecas.append((g, n, im.crop(bb), bb[0], bb[1], cw, ch))
pecas.sort(key=lambda p: -p[2].height)
LARG, x, y, alt_linha, pos = 2048, 0, 0, 0, {}
for p in pecas:
    w, h = p[2].size
    if x + w + 2 > LARG: x, y, alt_linha = 0, y + alt_linha + 2, 0
    pos[(p[0], p[1])] = (x, y); x += w + 2; alt_linha = max(alt_linha, h)
folha = Image.new('RGBA', (LARG, y + alt_linha), (0, 0, 0, 0))
meta = {}
for g, n, im, dx, dy, cw, ch in pecas:
    ax, ay = pos[(g, n)]; folha.alpha_composite(im, (ax, ay))
    meta.setdefault(g, {})[n] = [ax, ay, im.width, im.height, dx, dy, cw, ch]

buf = io.BytesIO(); folha.save(buf, 'PNG', optimize=True)
b64 = base64.b64encode(buf.getvalue()).decode()
with open(SAIDA, 'w') as f:
    f.write('// Artes: pacotes Toon Characters, Particle Pack e Background Elements do Kenney (www.kenney.nl), licença CC0 (domínio público).\n')
    f.write('// Gerado por montar_sprites.py. Cada quadro: [x, y, largura, altura, deslocX, deslocY, celulaL, celulaA]\n')
    f.write('var SPRITES_QUADROS = ' + json.dumps(meta, separators=(',', ':')) + ';\n')
    f.write('var SPRITES_FOLHA = "data:image/png;base64,' + b64 + '";\n')
folha.save(os.path.splitext(SAIDA)[0] + '.png')
print('folha', folha.size, 'png', len(buf.getvalue()) // 1024, 'KB', 'js', os.path.getsize(SAIDA) // 1024, 'KB')
