from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, Image
from reportlab.pdfgen import canvas
from pypdf import PdfReader, PdfWriter

FS = 9.8
B = ParagraphStyle("b", fontName="Helvetica", fontSize=FS, leading=FS * 1.28, spaceAfter=3)
H1 = ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=13, spaceAfter=2)
H2 = ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=10, spaceBefore=5, spaceAfter=2, textColor=colors.Color(.1, .25, .5))
SM = ParagraphStyle("sm", parent=B, fontSize=8.6, leading=10.8, spaceAfter=0)
SMB = ParagraphStyle("smb", parent=SM, fontName="Helvetica-Bold")
BL = ParagraphStyle("bl", parent=B, leftIndent=10, bulletIndent=1, spaceAfter=1.5)

def P(t): return Paragraph(t, B)
def bl(t): return Paragraph(t, BL, bulletText="•")
def tabela(dados, larg):
    rows = [[Paragraph(c, SMB if i == 0 else SM) for c in r] for i, r in enumerate(dados)]
    t = Table(rows, colWidths=larg, repeatRows=1)
    t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), .4, colors.grey), ("BACKGROUND", (0, 0), (-1, 0), colors.Color(.85, .9, .97)),
                           ("VALIGN", (0, 0), (-1, -1), "TOP"), ("TOPPADDING", (0, 0), (-1, -1), 2), ("BOTTOMPADDING", (0, 0), (-1, -1), 2)]))
    return t

S = []
S += [Paragraph("Eleição de Aurora em dois turnos — solução conceitual em nuvem", H1),
      Paragraph("Disciplina: Arquitetura de Soluções / Computação em Nuvem · <b>Integrantes que atuaram:</b> Fernando Padilha, Hector Saldivar, Theo Otto e Vinicius Veiga", SM),
      Spacer(1, 5)]

S += [Paragraph("1. Ideia geral e decisões principais", H2),
      P("Aurora tem 120 mil eleitores e 150 locais de votação. A solução é <b>presencial</b>: cada local tem um servidor próprio que "
        "funciona sem internet, e a nuvem (Azure) é usada para preparar a eleição, somar os resultados, publicar e guardar os registros. "
        "Usamos a mesma base tecnológica do nosso projeto (microfrontends em Static Web Apps, API Gateway, Azure Functions, filas Azure Queue Storage, "
        "MongoDB com um banco por serviço, Docker e pipeline no GitHub Actions com testes antes do deploy)."),
      bl("<b>Votação presencial, sem voto remoto:</b> em casa não dá para impedir que alguém seja pressionado ou venda o voto. Na cabine o eleitor está sozinho e sem celular."),
      bl("<b>Dois bancos separados em cada local:</b> um diz <i>quem já votou</i>; outro guarda <i>o que foi votado</i>. Nada liga um ao outro."),
      bl("<b>Nenhum comprovante individual:</b> o eleitor sai sem papel ou código do voto. Só existe o Boletim de Urna (BU) com totais do local."),
      bl("<b>Software com hash:</b> o que roda no local é uma imagem Docker cujo hash (SHA-256) foi publicado antes da eleição.")]

S += [Paragraph("2. Processo da eleição (diagrama BPMN)", H2),
      P("<b>Preparação:</b> a Comissão Eleitoral cadastra eleição, candidaturas e eleitores (importados do cadastro oficial, cada eleitor ligado a <u>um</u> local). "
        "A TI revisa o código no GitHub (duas aprovações), roda os testes e gera a imagem com hash. A Auditoria confere o código e publica o hash; só então a Comissão aprova a versão. "
        "<b>Votação:</b> no local, os mesários instalam a versão, conferem o hash com os fiscais e emitem a <i>zerésima</i> (relatório com zero votos). "
        "O eleitor mostra o documento, recebe um token de uso único e vota na cabine. No fim, o servidor imprime o BU, que mesários e fiscais assinam, e envia os dados à nuvem."),
      P("<b>Decisão do 2º turno:</b> o Serviço de Apuração soma os 150 BUs e calcula os votos válidos (candidaturas; brancos e nulos ficam fora). "
        "Se alguma candidatura tem <b>mais de 50%</b>, a Comissão publica o resultado final. Se não, o sistema ordena as candidaturas, a Comissão seleciona as <b>duas mais votadas</b> "
        "(empate na 2ª posição segue o critério do edital) e publica o resultado do 1º turno. A TI então configura os locais só com essas duas candidaturas; "
        "a configuração é aprovada pela Comissão, os dados do 1º turno ficam somente leitura e as marcas “já votou” começam do zero para o novo turno. "
        "Após 14 dias, o 2º turno repete o mesmo fluxo (hash, zerésima, voto, BU), é apurado, conferido pela Auditoria e publicado como resultado final.")]

S += [Paragraph("3. Local x nuvem e continuidade (diagrama C4 – Contêineres)", H2),
      tabela([["No local de votação (offline)", "Na nuvem (Azure)"],
              ["<b>Estação do Mesário</b> (React): confere o eleitor e libera o token.<br/>"
               "<b>Cabine de Votação</b> (React): tela com as candidaturas.<br/>"
               "<b>Servidor Local</b> (Node em Docker): regras, hash, zerésima e BU.<br/>"
               "<b>Eleitores do local</b> e <b>Urna de votos</b> (dois MongoDB locais).<br/>"
               "<b>Fila de sincronização</b> (Azurite) para enviar depois.",
               "<b>Portal de Apuração</b> (Static Web Apps, microfrontends), <b>API Gateway</b>, "
               "<b>Serviço de Eleição</b> e <b>Serviço de Apuração</b> (Functions), "
               "fila <b>boletins-de-urna</b>, bancos <b>pjbl_eleicao</b> e <b>pjbl_apuracao</b> (MongoDB Atlas), "
               "<b>Registro de auditoria</b> (Blob imutável), <b>Container Registry + Key Vault</b> (imagem assinada)."]],
             [8.6 * cm, 9.4 * cm]),
      Spacer(1, 3),
      P("<b>Se a conexão cair:</b> a votação não depende da nuvem. Antes da eleição o local recebe a lista dos <i>seus</i> eleitores, as candidaturas e o hash esperado. "
        "Como cada eleitor pertence a um só local, não há risco de votar duas vezes em locais diferentes mesmo offline. "
        "Votos e logs ficam no servidor local e na fila de sincronização; quando a internet volta, são reenviados (com reenvio automático, como nas filas do projeto). "
        "Se a internet não voltar, o BU impresso e assinado é levado à Comissão e vale como fonte oficial. Queda de energia: o servidor é ligado a nobreak e os dados ficam em disco.")]

S += [Paragraph("4. Sigilo do voto, coerção e compra de votos", H2),
      bl("<b>Identificação separada da escolha:</b> o mesário confere o eleitor na Estação; o servidor marca “já votou” em <i>Eleitores do local</i> e gera um token aleatório. "
         "Só o <i>hash</i> do token fica guardado, sem o nome do eleitor. Na cabine, token + voto vão para a <i>Urna de votos</i>; o token é queimado e o voto é gravado "
         "<b>sem eleitor e sem horário</b>. No envio à nuvem, os votos são embaralhados e só enviados ao fechamento, para não ligar “quem votou” a “em quem votou” pela ordem."),
      bl("<b>Sem comprovante:</b> a cabine não imprime nem mostra código do voto; o BU só traz totais. Assim não existe prova para vender o voto."),
      bl("<b>Coerção/compra:</b> celular guardado antes da cabine, cabine sem câmera e voltada para os fiscais, um eleitor por vez, e mesários que nunca veem a tela. "
         "Um token não usado é cancelado por mesário + fiscal e fica no log."),
      bl("<b>Responsabilidades:</b> mesários identificam e liberam (não votam e não acessam a urna); fiscais observam e assinam; a TI não está presente no local na votação; "
         "a Comissão responde pelas regras; a Auditoria verifica depois.")]

S += [Paragraph("5. Verificação do código e do software instalado", H2),
      P("(1) Todo código passa por <i>pull request</i> com duas aprovações; a pipeline roda testes unitários e os testes de arquitetura antes de gerar a imagem. "
        "(2) A imagem Docker recebe um hash SHA-256, assinado com chave no Key Vault que só a Comissão libera. "
        "(3) A Auditoria baixa o mesmo código, refaz o build e compara o hash; o hash oficial é publicado no portal e impresso. "
        "(4) No dia, o Servidor Local mostra o hash da imagem em execução; mesários e fiscais comparam com o publicado e o valor sai impresso na zerésima. "
        "(5) No fechamento o hash é conferido de novo e vai impresso no BU. Se algo diferir, o local para e usa o procedimento de contingência.")]

S += [Paragraph("6. Auditoria independente dos resultados", H2),
      P("Cada BU tem totais por candidatura, brancos, nulos, comparecimento (eleitores marcados), hash do software e o fim da cadeia de logs, mais um QR. "
        "Os BUs digitais e os votos anônimos embaralhados são publicados no portal. A Auditoria (i) refaz a soma dos 150 BUs, (ii) compara os BUs em papel, assinados pelos fiscais, com os da nuvem, "
        "(iii) confere se votos = comparecimento em cada local e (iv) recalcula a decisão do 2º turno. Qualquer pessoa pode refazer a soma com os dados publicados.")]

S += [Paragraph("7. Prevenção, detecção e investigação de fraudes internas", H2),
      P("<b>Regra de segregação:</b> quem escreve o código não aprova; quem aprova não opera; quem opera não audita. Ações sensíveis exigem duas pessoas."),
      tabela([["Quem", "Fraude possível", "Prevenção", "Detecção e investigação"],
              ["Mesário", "Marcar quem não veio e votar no lugar; tentar ver o voto",
               "Dupla de mesários + fiscal; token de uso único; mesário sem acesso à urna; cabine fora da vista da tela",
               "BU compara comparecimento x votos; log de cada token (liberado/queimado/cancelado) por estação e mesário"],
              ["Operador de TI", "Trocar o software ou mexer no servidor local",
               "Só implanta imagem assinada via pipeline, com aprovação da Comissão; servidor lacrado no dia",
               "Hash diferente na abertura/fechamento; zerésima diferente de zero; BU em papel x nuvem"],
              ["Admin. cloud", "Alterar totais, apagar logs, trocar a imagem",
               "Mínimo privilégio; acesso admin temporário aprovado por 2 pessoas; sem acesso à chave de assinatura; logs em Blob imutável (WORM) em conta da Auditoria",
               "Cadeia de hash quebrada; alertas de acesso; correlation-id liga a requisição ao registro (como no nosso Gateway); BU assinado não muda"],
              ["Dev.", "Esconder código malicioso", "Duas aprovações, testes automáticos, Auditoria revisa o código", "Build refeito pela Auditoria gera hash diferente"]],
             [2.9 * cm, 3.4 * cm, 6.0 * cm, 5.7 * cm]),
      Spacer(1, 3)]

S += [Paragraph("8. Quem faz o quê", H2),
      tabela([["Papel", "Prepara", "Opera", "Fiscaliza", "Audita"],
              ["Comissão Eleitoral", "Cadastra eleição; aprova versão e 2º turno", "Apura e publica", "—", "—"],
              ["Equipe de TI", "Código, testes e imagem", "Implanta (sem mexer em votos)", "—", "—"],
              ["Mesários", "Instalam e conferem hash", "Identificam e liberam token; fecham e imprimem BU", "—", "—"],
              ["Fiscais de candidaturas", "—", "—", "Abertura, votação, fechamento; assinam BU", "—"],
              ["Auditoria independente", "Publica hash oficial", "—", "—", "Código, BUs, logs e 2º turno"]],
             [3.2 * cm, 4.2 * cm, 4.8 * cm, 3.4 * cm, 2.4 * cm]),
      Spacer(1, 3)]

S += [Paragraph("9. Risco residual", H2),
      P("<b>Foto ou vídeo do voto na cabine:</b> mesmo com regra de celular e cabine vigiada, uma câmera escondida pode gravar a tela e o eleitor provar o voto a quem o compra. "
        "Reduzimos com revista visual, fiscalização e punição, mas não eliminamos. Outros riscos que sobram: conluio entre mesário e fiscal no mesmo local "
        "(limitado a um local e detectável pela conferência de BUs) e falha total de energia/internet (coberta pelo BU em papel, porém mais lenta).")]

doc = SimpleDocTemplate("doc.pdf", pagesize=A4, leftMargin=1.5 * cm, rightMargin=1.5 * cm, topMargin=1.3 * cm, bottomMargin=1.2 * cm,
                        title="Eleição de Aurora - Entrega")
doc.build(S)
n = len(PdfReader("doc.pdf").pages)
print("paginas do texto:", n)

# página do C4 (retrato A4)
cv = canvas.Canvas("c4.pdf", pagesize=A4)
cv.setFont("Helvetica-Bold", 12); cv.drawString(40, 810, "Diagrama C4 — Contêineres")
iw, ih = 2705, 3043; maxw, maxh = 515, 760; sc = min(maxw / iw, maxh / ih)
cv.drawImage("c4-conteineres-eleicao.png", 40, 800 - ih * sc, iw * sc, ih * sc)
cv.save()

w = PdfWriter()
for f in ["doc.pdf", "c4.pdf", "bpmn.pdf"]:
    for p in PdfReader(f).pages: w.add_page(p)
w.write("Eleicao_Aurora_Entrega.pdf")
print("total:", len(w.pages))
