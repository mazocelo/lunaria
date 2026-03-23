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

### PROGRESSAO
- Niveis de 1 a 10; +1 ponto por nivel apos o primeiro
- O Mestre decide como distribuir pontos ganhos (caracteristicas, vantagens, etc.)
- Sem tabela fixa de XP — progressao narrativa a criterio do Mestre

### EQUIPAMENTOS MAGICOS
- **Arma Magica +N:** aumenta F ou PdF em +N enquanto equipada (afeta FA diretamente)
- **Armadura Magica +N:** aumenta A em +N enquanto equipada (afeta FD diretamente)
- **Arma Veloz:** +2 em H apenas para testes de Iniciativa
- **Flagelo (tipo):** +1 em F ou PdF contra criaturas do tipo especificado
- **Ataque Especial:** 1x por combate, F ou PdF +2 sem custo de PM
- **Armadura Extra (tipo):** dobra A contra dano do tipo especificado
- **Invulneravel (tipo):** divide dano do tipo por 10 (arredonda para baixo)
- **Consumiveis:** itens de cura restauram PV/PM conforme descricao; usados como acao
- **Limite:** 1 arma magica, 1 armadura magica, 2 acessorios equipados ao mesmo tempo`;
}
