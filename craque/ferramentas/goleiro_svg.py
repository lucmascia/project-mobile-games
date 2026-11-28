# Cria o SVG do Goleirão a partir do "Male person" do Kenney (CC0):
# tira o cabelo e as costeletas, põe careca com brilho e um bigodão curvado,
# troca as cores para uniforme de goleiro e luvas laranja.
import re, sys
src, dst = sys.argv[1], sys.argv[2]
s = open(src).read()
s = re.sub(r'\s*filter="url\(#[^)]*\)"', '', s)          # filtros geram borrão no navegador

def esvaziar(gid):
    global s
    i = s.find('<g id="%s"' % gid)
    if i < 0: return
    j = s.find('</g>', i)
    abre = s.find('>', i) + 1
    s = s[:abre] + '\n' + s[j:]

def trocar_conteudo(gid, novo):
    global s
    i = s.find('<g id="%s"' % gid)
    if i < 0: return
    j = s.find('</g>', i)
    abre = s.find('>', i) + 1
    s = s[:abre] + '\n' + novo + '\n' + s[j:]

PELE, PELE2, PELE3 = '#F1B48A', '#D9966C', '#C27E58'
cabecas = ['head', 'headFocus', 'headShock']
for h in cabecas:
    for camada in ['0', '4', '5']:            # cabelo e costeletas
        esvaziar('%s_0_Layer0_%s_FILL' % (h, camada))
    # bigodão de pontas enroladas (no lugar do bigode pequeno)
    trocar_conteudo('%s_0_Layer0_3_MEMBER_1_FILL' % h, '''<g transform="translate(-0.6 4.6) scale(1.3) translate(0.6 0)"><path fill="#2B2B30" d="
M -0.6 -1.6 C -3 -3.8 -7.5 -4.2 -11 -2.4 C -14 -0.9 -15.8 0.9 -18.4 0 C -21 -0.9 -21.6 -4.2 -20 -6.2 C -18.9 -7.6 -16.6 -7.4 -16.1 -6 C -15.8 -5 -16.7 -4.3 -17.4 -4.8 C -17.5 -3.4 -16.2 -2.4 -14.5 -3.1 C -12.3 -4 -10.2 -6.4 -6.8 -6.8 C -4.1 -7.1 -1.9 -5.8 -0.6 -4.4 Z
M -0.6 -1.6 C 1.8 -3.8 6.3 -4.2 9.8 -2.4 C 12.8 -0.9 14.6 0.9 17.2 0 C 19.8 -0.9 20.4 -4.2 18.8 -6.2 C 17.7 -7.6 15.4 -7.4 14.9 -6 C 14.6 -5 15.5 -4.3 16.2 -4.8 C 16.3 -3.4 15 -2.4 13.3 -3.1 C 11.1 -4 9 -6.4 5.6 -6.8 C 2.9 -7.1 0.7 -5.8 -0.6 -4.4 Z"/>
<path fill="#FFFFFF" fill-opacity="0.18" d="M -9 -5.2 C -6.5 -6 -3.8 -5.6 -2 -4.2 C -4 -4.6 -6.5 -4.8 -9 -4.2 Z"/></g>''')
    # careca: cúpula de pele por cima do rosto, com brilho
    i = s.find('<g id="%s_0_Layer0_2_FILL"' % h)
    if i >= 0:
        j = s.find('</g>', i)
        domo = '''<path fill="#BF7958" d="M -21.4 -23.6 C -21.6 -42.5 20.7 -42.5 20.45 -23.6 Z"/>
<path fill="#A8603F" fill-opacity="0.35" d="M 8 -38 C 18 -35 21 -29 20.45 -23.6 L 12 -23.6 C 13 -29 11.5 -34 8 -38 Z"/>
<path fill="#FFFFFF" fill-opacity="0.45" d="M -14 -35 C -10 -38.6 -2 -39.6 3 -38.4 C -3 -37 -9 -35 -12 -31.5 Z"/>'''
        s = s[:j] + domo + '\n' + s[j:]

# cores: pele mais clara, colete -> camisa verde-limão, camisa branca -> manga escura, calça -> calção preto
CORES = {'#BF7958': PELE, '#A8603F': PELE2, '#955435': PELE3,
         '#EEA160': '#AEEA00', '#D78B49': '#8FC400',
         '#E7F3FC': '#37474F', '#BFD4E5': '#263238',
         '#676AC6': '#2B2B33', '#4C4EAA': '#1E1E25'}
for a, b in CORES.items():
    s = re.sub(a, b, s, flags=re.I)
# mãos viram luvas laranja (só dentro das partes "hand")
def luvas(m):
    bloco = m.group(0)
    return re.sub(PELE, '#FF8F00', re.sub(PELE2, '#E06C00', re.sub(PELE3, '#B85600', bloco, flags=re.I), flags=re.I), flags=re.I)
s = re.sub(r'<g id="hand_0_[^"]*">.*?</g>', luvas, s, flags=re.S)
open(dst, 'w').write(s)
print('ok')
