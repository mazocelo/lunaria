# 3D&T Alpha — Expansão do Catálogo (Vantagens, Desvantagens, Raças, Classes)

## Objetivo

Expandir o catálogo 3D&T de 24 vantagens e 13 desvantagens para ~120+ entradas, incluindo raças e classes de Lunaria adaptadas como vantagens únicas, vantagens do Manual Alpha Revisado que faltam, e desvantagens com custos variados (até -4). Atualizar custos existentes para alinhar com o manual oficial.

## Fonte de Dados

1. **Manual 3D&T Alpha Revisado** (55 vantagens, 24 desvantagens, 35 vantagens únicas)
2. **Banco Lunaria existente** (40 raças, 26 classes, 152 vantagens, 102 desvantagens) — adaptados para mecânica 3D&T
3. **Tormenta Alpha** (vantagens complementares)

## Filosofia de Balanceamento

### Princípio narrativo
Desvantagens são **motor narrativo**. Quanto mais material dão ao Mestre para complicar a história, mais pontos devolvem. Vantagens com forte impacto narrativo/social (raças exóticas, maldições) custam menos do que o poder mecânico bruto sugeriria, porque trazem restrições implícitas.

### Custos
- **Vantagens**: 1 a 6 pontos (maioria 1-2, poucas de 3-4, raras de 5-6)
- **Desvantagens**: -1 a -4 pontos (narrativas fortes valem mais)
- **Raças**: -2 a 5 pontos (incluem pacote de vantagens/desvantagens no custo)

## Regras de Limites por Tier

### Vantagens — limite de QUANTIDADE
| Nível de Poder | Limite |
|---------------|--------|
| Novato (5pts) | 2 vantagens |
| Lutador (7pts) | 3 vantagens |
| Campeão (10pts) | 4 vantagens |
| Lenda (12pts) | 5 vantagens |

### Desvantagens — limite de PONTOS totais
| Nível de Poder | Limite |
|---------------|--------|
| Novato (5pts) | -4 pts |
| Lutador (7pts) | -5 pts |
| Campeão (10pts) | -6 pts |
| Lenda (12pts) | -6 pts |

### Raça (Vantagem Única)
- Máximo 1 por personagem
- Custo em pontos do pool, mas **NÃO conta** no limite de quantidade de vantagens
- Vantagens/desvantagens inclusas no pacote racial **NÃO contam** no limite e **NÃO custam** pontos extras

## Dados para Inserção

### Vantagens Únicas (Raças) — Novas entradas `sistema = 'tresdet'`

Cada raça é inserida como uma vantagem com `tipo: 'racial'` e campos `vantagens_inclusas` / `desvantagens_inclusas`.

#### Semi-humanos
| Nome | Custo | Pacote incluso |
|------|-------|----------------|
| Humano | 0 | Adaptabilidade (+1 em qualquer perícia) |
| Anão | 1 | Resistência a Magia, Armadura Extra |
| Elfo | 2 | Sentidos Especiais, Aceleração |
| Elfo Negro | 2 | Sentidos Especiais (Visão no Escuro), Magia Negra |
| Gnomo | 2 | Genialidade, Sentidos Especiais |
| Halfling | 1 | Aparência Inofensiva, Sortudo |
| Meio-Elfo | 0 | — |
| Meio-Orc | 0 | — |
| Goblin | -1 | Inculto |
| Orc | 1 | Fúria Incontrolável |

#### Humanoides
| Nome | Custo | Pacote incluso |
|------|-------|----------------|
| Anfíbio | 0 | Adaptador (Água) |
| Alien | 2 | Adaptador, Sentidos Especiais |
| Centauro | 1 | Aceleração, Modelo Especial |
| Kemono | 1 | Sentidos Especiais (Faro) |
| Meio-Dragão | 4 | Armadura Extra, Voo, Sopro de Dragão |
| Minotauro | 1 | Arena (labirintos), Modelo Especial |
| Ogro | 2 | Modelo Especial |
| Troglodita | 2 | Adaptador, Modelo Especial |
| Bugbear | 1 | Sentidos Especiais (Faro) |
| Hobgoblin | 1 | Arena (guerra) |
| Kobold | -1 | Inculto, Modelo Especial |
| Draconato | 3 | Armadura Extra, Sopro de Dragão |
| Pardalino | 1 | Aceleração, Sentidos Especiais |
| Silvagante | 1 | Ligação Natural |
| Primordiano | 2 | Elementalista (1 elemento) |

#### Youkai
| Nome | Custo | Pacote incluso |
|------|-------|----------------|
| Anjo | 3 | Voo, Magia Branca |
| Demônio | 2 | Resistência a Magia, Má Fama |
| Fada | 3 | Voo, Magia Elemental, Modelo Especial |
| Licantropo | 1 | Forma Alternativa, Fúria Incontrolável |
| Meio-Abissal | 2 | Resistência a Magia |
| Meio-Celestial | 2 | Magia Branca básica |
| Meio-Gênio | 4 | Magia Elemental, Voo |
| Deva | 3 | Magia Branca, Memória de Vidas Passadas |

#### Construtos
| Nome | Custo | Pacote incluso |
|------|-------|----------------|
| Androide | 1 | Armadura Extra |
| Ciborgue | 0 | — |
| Golem | 3 | Armadura Extra ×2, Modelo Especial, sem Magia |
| Mecha | 0 | Modelo Especial |
| Meio-Golem | 1 | Armadura Extra |
| Nanomorfo | 3 | Regeneração, Adaptador |
| Robô Positrônico | -2 | Modelo Especial, Inculto, sem Magia |

#### Mortos-vivos
| Nome | Custo | Pacote incluso |
|------|-------|----------------|
| Esqueleto | 0 | Modelo Especial, sem cura |
| Fantasma | 5 | Voo, Invisibilidade, Intangível |
| Múmia | 5 | Armadura Extra ×2, Regeneração, Paralisia |
| Vampiro | -1 | Dependência de Sangue, Vulnerabilidade à Luz Solar |
| Zumbi | -2 | Inculto, Lentidão, Modelo Especial |

### Classes → Vantagens 3D&T (tipo: 'classe')

| Nome | Custo | Descrição |
|------|-------|-----------|
| Guerreiro | 1 | Especialista em armas. +1 em testes de F em combate. |
| Mago | 2 | Acesso a magias arcanas variadas. +2 PM. |
| Clérigo | 1 | Magia Branca básica + cura. |
| Paladino | 2 | Combate sagrado. Código de Honra dos Heróis incluso. |
| Bárbaro | 2 | Fúria: +1F e -1A temporário por 1d turnos. |
| Druida | 2 | Magia Natural + Forma de Fera menor. |
| Ladino | 1 | Ataque Furtivo: +2 dano em alvos surpresos. |
| Bardo | 1 | Inspirar Aliados: +1 em testes de aliados próximos por 1d turnos. |
| Ranger | 1 | Rastreamento + bônus em combate à distância em terreno natural. |
| Monge | 2 | Combate Desarmado com F+1 e Deflexão. |
| Assassino | 2 | Ataque Furtivo aprimorado: +3 dano em alvos surpresos + uso de venenos. |
| Necromante | 2 | Magia Negra + animar 1 morto-vivo aliado. |
| Ninja | 2 | Invisibilidade curta (1 turno) + Ataque Furtivo. |
| Samurai | 1 | +1F com espadas. Código de Honra de Combate incluso. |
| Cavaleiro | 1 | +1F quando montado. Montaria inclusa como Aliado. |
| Pirata | 1 | Combate Naval + Crime. |
| Alquimista | 2 | Criar poções e itens consumíveis. |
| Inventor | 1 | Criação e conserto de máquinas e artefatos. |
| Elementalista | 2 | Magia Elemental com +1 em Focus de 1 elemento escolhido. |
| Gladiador | 1 | Arena (arenas/coliseus) + Torcida. |
| Swashbuckler | 1 | +1H em combate com espadas leves e esgrima. |
| Caçador de Monstros | 2 | +2 dano contra monstros + rastreamento. |
| Guerreiro Mágico | 3 | Combate com F+1 + acesso a 1 escola de magia. |
| Bruxo | 2 | Magias de Maldição + Pacto com entidade. |
| Feiticeiro | 2 | Magia Inata: conjura sem estudo, mas repertório limitado. |
| Curandeiro | 1 | Cura especializada: +2 PV recuperados com magias de cura. |

### Vantagens do Manual que Faltam no Banco

| Nome | Custo | Tipo | Descrição |
|------|-------|------|-----------|
| Aliado | 1+ | suporte | Companheiro NPC. Pontuação = 1 abaixo da sua. +1pt por ponto extra. |
| Alquimista (vant) | 1 | crafting | Criar poções e itens alquímicos. |
| Arcano | 4 | magico | Domínio total de magias. Acesso a todas as escolas. |
| Área de Batalha | 2 | ofensiva | Ataque afeta todos em uma área. |
| Clericato | 1 | magico | Acesso a magias divinas + 3 magias extras do Mentor divino. |
| Elementalista (vant) | 1+ | magico | Domínio de 1 elemento por ponto. |
| Energia Extra | 1-2 | defensiva | Recuperar todos os PVs gastando 2 PM. 1pt = só Perto da Morte. 2pt = qualquer momento. |
| Energia Vital | 2 | defensiva | Recuperar PVs de aliados tocando-os. |
| Familiar | 1 | suporte | Animal mágico companheiro com poderes menores. |
| Forma Alternativa | 2 | transformacao | Outra forma com características diferentes. |
| Inimigo | 1+ | narrativa | Rival recorrente. +1pt por inimigo mais poderoso. |
| Ligação Natural | 1 | passiva | Comunicação com animais e plantas. |
| Membros Extras | 2 | ofensiva | Braços/tentáculos adicionais: +1 ataque extra. |
| Mente Expandida | 2 | magico | Telepatia avançada + controle mental menor. |
| Paladino (vant) | 1 | suporte | Detectar mal + proteção contra medo. |
| Paralisia | 1 | controle | Paralisar alvo por 1 turno (teste de R para resistir). |
| Parceiro | 1 | suporte | Aliado que luta em sincronia. Combinam características. |
| Patrono | 1 | social | Organização ou NPC poderoso fornece recursos. |
| Poder Oculto | 1+ | ofensiva | Poder secreto devastador. +1d por ponto quando ativado. |
| PMs Extras | 1+ | magico | +5 PM por ponto investido. |
| PVs Extras | 1+ | defensiva | +5 PV por ponto investido. |
| Reflexão | 2 | defensiva | Rebater ataques à distância de volta ao atacante. |
| Possessão | 2 | magico | Controlar corpo de outro ser. |
| Riqueza | 2 | social | Recursos financeiros ilimitados para equipamento normal. |
| Separação | 2 | transformacao | Dividir-se em 2+ seres menores. |
| Tiro Carregável | 1 | ofensiva | Concentrar 1 turno para PdF dobrado no próximo ataque. |
| Torcida | 1 | suporte | +1 em combate quando aliados torcem por você. |
| Transferência de Energia | 1+ | suporte | Transferir PVs ou PMs para aliados. |
| Xamã | 1 | magico | Comunicação com espíritos + magias espirituais. |

### Desvantagens que Faltam ou Precisam Ajuste

#### Novas (do Manual + adaptadas de Lunaria)
| Nome | Custo | Tipo | Descrição |
|------|-------|------|-----------|
| Ponto Fraco | -1 | combate | Inimigos que descobrem sua fraqueza ganham H+1. |
| Protegido Indefeso | -1+ | narrativa | Alguém que você deve proteger. -1pt por protegido. |
| Cleptomaníaco | -1 | psicologico | Teste de R para não roubar quando surge oportunidade. |
| Compulsivo | -1 | psicologico | Deve fazer algo específico a cada hora. |
| Mentiroso | -1 | psicologico | Nunca diz a verdade. Teste de R para falar verdade. |
| Paranóico | -1 | psicologico | Nunca aceita ajuda. Recupera PVs como em lugar inadequado. |
| Megalomaníaco | -1 | psicologico | Nunca foge, nunca se rende, ignora perigos. |
| Fobia (Comum) | -2 | psicologico | Medo de algo encontrado 50% do tempo. Fuga em falha de R. |
| Fobia (Rara) | -1 | psicologico | Medo de algo encontrado 25% do tempo. |
| Fobia (Constante) | -3 | psicologico | Medo de algo quase sempre presente. |
| Fantasia | -1 | psicologico | Acredita ser algo que não é. |
| Dupla Personalidade | -2 | psicologico | Outra personalidade com características diferentes. Muda aleatoriamente. |
| Jurado de Morte | -3 | narrativa | Inimigo mortal que não descansa até destruí-lo. |
| Maldição Hereditária | -3 | maldicao | Maldição de família com efeitos recorrentes. |
| Transformação Incontrolável | -3 | transformacao | Muda de forma em situações de estresse. Sem controle. |
| Dívida Impagável | -2 | narrativa | Deve favor a alguém poderoso. Missões obrigatórias. |
| Exilado | -1 | social | Banido de sua terra. Sem aliados locais. |
| Identidade Oculta | -1 | narrativa | Deve esconder quem realmente é. |
| Vício | -2 | fisiologico | Dependência que prejudica desempenho. |
| Segredo Sombrio | -2 | narrativa | Se descoberto, consequências devastadoras. |
| Vingativo | -1 | psicologico | Nunca perdoa. Persegue quem o ofendeu. |
| Covarde | -2 | psicologico | Teste de R para não fugir de combate. |
| Vulnerabilidade (Elemento) | -2 | defensiva | Dobro de dano de um elemento específico. |
| Marca Amaldiçoada | -2 | maldicao | Marca que atrai problemas e entidades malignas. |

#### Ajustes em Existentes
| Nome | Custo Atual | Custo Correto | Motivo |
|------|-------------|---------------|--------|
| Assombrado | -1 | -2 | Manual oficial = -2 |
| Magia Branca | 1 | 2 | Manual oficial = 2 |
| Magia Negra | 1 | 2 | Manual oficial = 2 |
| Magia Elemental | 1 | 2 | Manual oficial = 2 |
| Voo | 1 | 2 | Manual oficial = 2 |
| Regeneração | 2 | 3 | Manual oficial = 3 |
| Insano | -2 | -1 a -3 | Manual = variável (usar -2 como padrão) |
| Código de Honra | -1 | -1 | OK (manter, mas criar variantes) |

## Implementação

### Backend
1. **Seed script** (`prisma/seed_tresdet_expansao.js`): insere todas as novas entradas com `sistema: 'tresdet'`
2. **Atualiza custos** dos itens existentes que estão errados
3. **Campos novos** na tabela `vantagens`: `subtipo` (racial/classe/normal), `vantagens_inclusas` (JSON array), `desvantagens_inclusas` (JSON array)

### Frontend (Ficha Livre)
1. **CatalogoModal**: sem filtro por tipo, listagem alfabética com descrição completa (estilo livro/revista)
2. **Validação de limites**: quantidade de vantagens por tier, pontos de desvantagens por tier
3. **Seletor de raça**: seção separada na ficha, mostra pacote incluso
4. **PointsBar**: atualizar para mostrar raça separada dos slots de vantagem

### Prompt do Mestre
Atualizar `promptTresDet` no backend para incluir:
- Regras de limites por tier
- Raças como vantagens únicas com pacotes
- Peso narrativo de desvantagens
- Instrução de que desvantagens são hooks para o Mestre complicar a história

## Fora de Escopo
- Magias (187 magias do manual — fase posterior)
- Equipamentos (fase posterior)
- Focus Elementais como dados no banco (já hardcoded no frontend)
- Perícias individuais como vantagens (simplificar mantendo "Perícia" como 1 vantagem genérica)
