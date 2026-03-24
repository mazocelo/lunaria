/**
 * Texto de regras mecanicas do sistema 3D&T Alpha para injecao no prompt do Mestre.
 */

export function getRegrasMestrePrompt() {
  return `## SISTEMA 3D&T ALPHA

### AS 5 CARACTERISTICAS
Cada personagem tem 5 caracteristicas de 0 a 5:
- **F (Forca):** combate corpo a corpo, levantar peso, arrombar, escalar
- **H (Habilidade):** precisao, esquiva, reflexos, acrobacia — usada em ataque E defesa
- **R (Resistencia):** pontos de vida (PV = R x 5), vigor, resistir veneno e dano
- **A (Armadura):** protecao fisica — usada na defesa contra ataques
- **PdF (Poder de Fogo):** ataques a distancia, armas de fogo, magias de ataque

### COMBATE
- **FA (Forca de Ataque):**
  - Corpo a corpo: F + H + 1d6
  - A distancia: PdF + H + 1d6
- **FD (Forca de Defesa):** A + H + 1d6
- **Dano:** FA - FD (se positivo; se zero ou negativo, o ataque falha)
- **Iniciativa:** 1d6 + H (maior age primeiro)
- **PV (Pontos de Vida):** R x 5 (minimo 1)
- **PM (Pontos de Magia):** R x 5 (minimo 1)

### TESTES DE HABILIDADE
- Teste simples: role 1d6; sucesso se resultado <= valor da caracteristica
- Teste dificil: role 1d6; sucesso se resultado <= caracteristica - 1 (ou mais)
- Teste oposto: ambos rolam 1d6 + caracteristica, maior resultado vence

### SISTEMA DE PONTOS (CRIACAO)
- Tiers definem pontos disponiveis: Novato (6), Lutador (7), Campeao (8), Lenda (10), Heroi (15)
- Distribua pontos entre as 5 caracteristicas (0 a 5 cada)
- Vantagens custam pontos; desvantagens devolvem pontos (com limite por tier)
- NAO existem classes ou racas — personagens sao 100% livres (freeform)

### MAGIA
- Requer a vantagem Magia (Branca, Negra ou Elemental)
- Magia Branca: cura, protecao, purificacao
- Magia Negra: dano, maldições, necromancia
- Magia Elemental: controle de elementos (fogo, agua, terra, ar, etc.)
- Custo em PM varia conforme a magia; PM = R x 5

### PROGRESSAO (PONTOS DE EXPERIENCIA)
- Personagens ganham Pontos de Experiencia (PE) por suas acoes:
  - +1 PE por cada inimigo vencido em combate justo
  - +1 PE se terminou a aventura com vida
  - +1 PE se a missao foi concluida com sucesso
  - -1 PE por cada derrota em combate justo
  - -1 PE por cada companheiro morto ou perdido
- **Usar PE:**
  - 10 PE = 1 ponto de personagem (para comprar caracteristicas ou vantagens)
  - 1 PE = 100 Moedas (trocar PE por dinheiro)
  - 1 PE = aprender 1 magia nova (se tiver os requisitos)
  - 1 PE = sucesso automatico em um teste (deve declarar ANTES de rolar o dado)
  - 1 PE = acerto critico (resultado 6) em FA ou FD (deve declarar ANTES de rolar)
  - 2 PE = recuperar 5 PV ou 5 PM instantaneamente
- Caracteristicas acima de 5 custam mais PE: 6-10 = 10 PE cada, 11-15 = 30 PE cada
- Maximo de 1 a 10 PE por aventura

### PERICIAS
- Pericias sao um tipo especial de vantagem. Custam 2 pontos (pericia completa) ou 1 ponto (3 especializacoes).
- Existem 11 pericias: Animais, Arte, Ciencia, Crime, Esporte, Idiomas, Investigacao, Maquinas, Manipulacao, Medicina, Sobrevivencia.
- Cada pericia tem especializacoes (sub-areas de conhecimento).
- **Testes com pericia:**
  - Tarefa Facil: sem teste necessario
  - Tarefa Media: teste de H com bonus +1
  - Tarefa Dificil: teste de H com penalidade -2
- **Testes SEM pericia:**
  - Tarefa Facil: teste de H com penalidade -1
  - Tarefa Media: teste de H com penalidade -3
  - Tarefa Dificil: NAO permitido (impossivel sem treinamento)
- Algumas vantagens e desvantagens afetam testes de pericias (ex: Genialidade da +2 em todas, Inculto da -3)

### EQUIPAMENTOS MAGICOS
- **Arma Magica +N:** aumenta F ou PdF em +N enquanto equipada (afeta FA diretamente)
- **Armadura Magica +N:** aumenta A em +N enquanto equipada (afeta FD diretamente)
- **Arma Veloz:** +2 em H apenas para testes de Iniciativa
- **Flagelo (tipo):** +1 em F ou PdF contra criaturas do tipo especificado
- **Ataque Especial:** 1x por combate, F ou PdF +2 sem custo de PM
- **Armadura Extra (tipo):** dobra A contra dano do tipo especificado
- **Invulneravel (tipo):** divide dano do tipo por 10 (arredonda para baixo)
- **Consumiveis:** itens de cura restauram PV/PM conforme descricao; usados como acao
- **Limite:** 1 arma magica, 1 armadura magica, 2 acessorios equipados ao mesmo tempo

### MORTE E TESTES DE MORTE
- **Perto da Morte:** quando PV cai abaixo ou igual a R, o personagem esta Perto da Morte. Pode usar poderes especiais como Energia Extra (se tiver 1 ponto).
- **0 PV — Teste de Morte:** quando PV chega a 0, role 1d6:
  - 1: Muito Fraco — consciente mas incapaz de lutar. Pode falar e andar devagar.
  - 2-3: Inconsciente — desmaiado. Recupera com 1h de descanso ou cura magica.
  - 4-5: Quase Morto — morrendo em 2d turnos. Precisa de teste de Medicina ou cura magica para sobreviver.
  - 6: Morto — apenas Ressurreicao ou Desejo podem trazer de volta.
- **Castigo Continuo:** se um personagem com 0 PV recebe mais dano, faz NOVO Teste de Morte. Resultado so piora (nunca melhora).

### ESCALAS DE PODER
- 4 escalas: Ningen (normal, x1), Sugoi (incrivel, x10), Kiodai (gigante, x100), Kami (deus, x1000)
- Dano contra escala inferior: multiplicado por 10 por diferenca de escala
- Dano contra escala superior: dividido por 10 por diferenca de escala (minimo 0)
- Testes de Forca entre escalas diferentes: escala superior recebe +10 por diferenca
- Maioria dos personagens jogadores sao Ningen. Monstros gigantes podem ser Sugoi ou Kiodai.

### MANOBRAS DE COMBATE
- **Ataque Concentrado:** o personagem pula seu turno para se concentrar. A cada turno concentrando, ganha F+1 ou PdF+1 no proximo ataque. Bonus maximo acumulavel = R. Se receber dano, perde a concentracao.
- **Comando de Aliado:** gastar sua acao para comandar um Aliado ou mecha. O Aliado usa a Habilidade do lider ou a propria, a que for maior. Pode comandar movimento + acao do Aliado.
- **Choque de Energia:** quando atacado com PdF, o personagem pode usar seu proprio PdF para tentar anular o ataque. Calcule FA = PdF + 1d6. Se sua FA igualar ou superar o dano do atacante, o dano e anulado. O personagem perde sua acao neste turno.
- **Sacrificio Heroico:** o personagem recebe 1d extra na FA para um unico ataque fulminante. Apos esse ataque, o personagem morre. So pode ser trazido de volta por Ressurreicao ou Desejo.

### PODERES DE MONSTROS
Monstros podem ter poderes unicos (anotados no campo habilidades). Estes sao os poderes possiveis:
- **Absorcao:** o monstro absorve o dano recebido e o devolve no proximo turno
- **Armadura Extra (tipo):** dobra A contra um tipo de dano secreto (escolhido pelo Mestre)
- **Ataque Cegante:** emite um clarão que cega todos no alcance do PdF. Funciona como a magia Cegueira
- **Ataque Corrosivo:** acido que derrete armas/armaduras, reduzindo F, A ou PdF do alvo em -1
- **Caracteristica Superior:** uma caracteristica recebe bonus de +5
- **Cerebro Superior:** mente superior, preve movimentos dos herois (H+2 contra os herois)
- **Controle Mental:** controla mentalmente ate 2d pessoas (teste de R para resistir)
- **Controle Mental Superior:** controla um unico personagem sem direito a teste
- **Duplicador:** transforma-se em copia identica de um dos herois (mesmas caracteristicas)
- **Fortificante:** fortalece 2d soldados grunts (+2 em F, R e A)
- **Magia Ilimitada:** lanca uma magia escolhida sem gastar PMs
- **Refem:** engole e aprisiona uma pessoa (alvo sofre metade do dano causado ao monstro)
- **Ressurreicao:** ressuscita apos morto, regenerando a partir de uma parte do corpo nao destruida`;
}
