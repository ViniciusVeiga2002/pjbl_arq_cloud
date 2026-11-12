from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
from reportlab.lib import colors

W, H = 1980, 760
LABEL = 80
TOP = 50          # espaço do título
LH = 130          # altura da raia
lanes = ["Comissão Eleitoral", "TI e Operação\ncloud", "Mesários e Fiscais\n(local de votação)", "Eleitor", "Auditoria independente"]
TW, TH = 88, 62
c = canvas.Canvas("bpmn.pdf", pagesize=(W, H))
c.setTitle("BPMN - Processo eleitoral de Aurora")

def laneY(i):  # centro da raia i (0 = topo)
    return H - TOP - LH * i - LH / 2

c.setFont("Helvetica-Bold", 14)
c.drawString(20, H - 30, "BPMN — Processo eleitoral de Aurora: do preparo do 1º turno à publicação do resultado final")

# raias
for i, n in enumerate(lanes):
    y0 = H - TOP - LH * (i + 1)
    c.setStrokeColor(colors.black); c.setLineWidth(1)
    c.setFillColor(colors.Color(.96, .97, 1) if i % 2 == 0 else colors.white)
    c.rect(20, y0, W - 40, LH, fill=1)
    c.setFillColor(colors.Color(.85, .9, .97))
    c.rect(20, y0, LABEL, LH, fill=1)
    c.setFillColor(colors.black); c.setFont("Helvetica-Bold", 9)
    c.saveState(); c.translate(20 + LABEL / 2 + 4, y0 + LH / 2); c.rotate(90)
    ls = n.split("\n")
    for k, t in enumerate(ls):
        c.drawCentredString(0, 6 - k * 11 + (5 * (len(ls) - 1)), t)
    c.restoreState()

OFF = 20 + LABEL  # início da área útil
def X(x): return OFF + x - 40

def arrow(pts, label=None, lpos=None):
    c.setStrokeColor(colors.black); c.setLineWidth(1); c.setFillColor(colors.black)
    p = c.beginPath(); p.moveTo(*pts[0])
    for q in pts[1:]: p.lineTo(*q)
    c.drawPath(p, stroke=1, fill=0)
    (x1, y1), (x2, y2) = pts[-2], pts[-1]
    import math
    a = math.atan2(y2 - y1, x2 - x1); s = 6
    t = c.beginPath(); t.moveTo(x2, y2)
    t.lineTo(x2 - s * math.cos(a - .4), y2 - s * math.sin(a - .4))
    t.lineTo(x2 - s * math.cos(a + .4), y2 - s * math.sin(a + .4)); t.close()
    c.drawPath(t, fill=1, stroke=0)
    if label:
        c.setFont("Helvetica-Bold", 8); c.drawString(lpos[0], lpos[1], label)

def task(x, lane, text, sub=False, fill=colors.Color(.88, .94, 1)):
    cx, cy = X(x), laneY(lane)
    c.setFillColor(fill); c.setStrokeColor(colors.black); c.setLineWidth(1.3 if sub else 1)
    c.roundRect(cx - TW / 2, cy - TH / 2, TW, TH, 6, fill=1)
    c.setFillColor(colors.black); c.setFont("Helvetica", 7.4)
    lines = simpleSplit(text, "Helvetica", 7.4, TW - 8)
    y = cy + (len(lines) - 1) * 4.2 - 2.5 + (3 if sub else 0)
    for l in lines:
        c.drawCentredString(cx, y, l); y -= 8.4
    if sub:
        c.rect(cx - 5, cy - TH / 2 + 3, 10, 10); c.line(cx - 3, cy - TH / 2 + 8, cx + 3, cy - TH / 2 + 8); c.line(cx, cy - TH / 2 + 5, cx, cy - TH / 2 + 11)
    return cx, cy

def event(x, lane, kind, label):
    cx, cy = X(x), laneY(lane)
    c.setStrokeColor(colors.black); c.setFillColor(colors.Color(.8, 1, .8) if kind == "start" else colors.Color(1, .8, .8) if kind == "end" else colors.Color(1, .95, .75))
    c.setLineWidth(3 if kind == "end" else 1)
    c.circle(cx, cy, 15, fill=1)
    if kind == "timer":
        c.circle(cx, cy, 11, fill=0); c.setLineWidth(1)
        c.line(cx, cy, cx, cy + 7); c.line(cx, cy, cx + 5, cy)
    c.setFillColor(colors.black); c.setFont("Helvetica", 7.4)
    for k, l in enumerate(simpleSplit(label, "Helvetica", 7.4, 80)):
        c.drawCentredString(cx, cy - 25 - 8.4 * k, l)
    return cx, cy

def gateway(x, lane, label):
    cx, cy = X(x), laneY(lane); r = 20
    c.setFillColor(colors.Color(1, .95, .75)); c.setStrokeColor(colors.black); c.setLineWidth(1)
    p = c.beginPath(); p.moveTo(cx - r, cy); p.lineTo(cx, cy + r); p.lineTo(cx + r, cy); p.lineTo(cx, cy - r); p.close()
    c.drawPath(p, fill=1)
    c.setLineWidth(2); c.line(cx - 7, cy - 7, cx + 7, cy + 7); c.line(cx - 7, cy + 7, cx + 7, cy - 7)
    c.setFillColor(colors.black); c.setFont("Helvetica-Bold", 7.4)
    for k, l in enumerate(simpleSplit(label, "Helvetica-Bold", 7.4, 90)):
        c.drawCentredString(cx, cy - 30 - 8.4 * k, l)
    return cx, cy

def R(n): return (n[0] + TW / 2, n[1])
def L(n): return (n[0] - TW / 2, n[1])
def link(a, b, ra=None, lb=None):
    xa, ya = ra or (a[0] + TW / 2, a[1]); xb, yb = lb or (b[0] - TW / 2, b[1])
    if abs(ya - yb) < 1: arrow([(xa, ya), (xb, yb)])
    else:
        m = (xa + xb) / 2; arrow([(xa, ya), (m, ya), (m, yb), (xb, yb)])

# nós
s  = event(105, 0, "start", "Eleição convocada")
t1 = task(205, 0, "Cadastrar eleição, candidaturas e eleitores por local")
t2 = task(305, 1, "Revisar código (2 aprovações), rodar testes e gerar imagem com hash")
t3 = task(405, 4, "Conferir o código e publicar o hash oficial")
t4 = task(505, 0, "Aprovar a versão e a configuração do 1º turno")
t5 = task(605, 2, "Instalar, conferir o hash e emitir a zerésima (com fiscais)")
t6 = task(705, 2, "Identificar eleitor e liberar token de uso único (dupla)")
t7 = task(805, 3, "Votar na cabine (voto sem identidade)")
t8 = task(905, 2, "Encerrar, imprimir o BU e enviar à nuvem (reenvia se cair)")
t10= task(1005,0, "Apurar o 1º turno (soma dos BUs)")
t11= task(1105,4, "Conferir BUs impressos x nuvem e os logs")
g  = gateway(1205, 0, "Alguma candidatura teve mais de 50% dos votos válidos?")
t13= task(1305,0, "Selecionar as 2 mais votadas e publicar o 1º turno")
t14= task(1405,1, "Configurar locais com 2 candidaturas (nova versão aprovada)")
tm = event(1505,2, "timer", "Aguardar 14 dias")
sp = task(1600,2, "Realizar o 2º turno (mesmo fluxo: zerésima, voto, BU, envio)", sub=True)
t15= task(1695,0, "Apurar o 2º turno; Auditoria confere BUs e logs")
tf = task(1795,0, "Publicar o resultado final (BUs e totais)")
e  = event(1885,0, "end", "Eleição concluída")

# fluxos
link(s, t1, ra=(s[0] + 15, s[1]))
for a, b in [(t1,t2),(t2,t3),(t3,t4),(t4,t5),(t5,t6),(t6,t7),(t7,t8),(t8,t10),(t10,t11),(t13,t14)]: link(a, b)
link(t11, g, lb=(g[0] - 20, g[1]))
arrow([(g[0] + 20, g[1]), (t13[0] - TW / 2, t13[1])], "Não", (g[0] + 24, g[1] + 4))
# Sim: por cima até o resultado final
yt = laneY(0) + LH / 2 - 10
arrow([(g[0], g[1] + 20), (g[0], yt), (tf[0], yt), (tf[0], tf[1] + TH / 2)], "Sim", (g[0] + 4, g[1] + 26))
link(t14, tm, lb=(tm[0] - 15, tm[1]))
arrow([(tm[0] + 15, tm[1]), (sp[0] - TW / 2, sp[1])])
link(sp, t15)
link(t15, tf)
arrow([(tf[0] + TW / 2, tf[1]), (e[0] - 15, e[1])])

# legenda
c.setFont("Helvetica", 8); c.setFillColor(colors.black)
c.drawString(24, 14, "Legenda: círculo verde = início; círculo vermelho = fim; losango = decisão; relógio = espera de 14 dias; retângulo com + = subprocesso (repete o fluxo de votação). BU = Boletim de Urna. Zerésima = relatório com zero votos antes de abrir.")
c.save()
