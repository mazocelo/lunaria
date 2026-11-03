/**
 * Monster Rebalance Script v2 — Lunaria RPG Context
 *
 * Uses Gemini 3.1 Pro to redesign all monsters with:
 * - Full Lunaria RPG context (40 races, 26 classes, multi-system)
 * - HP = mult_raca × (nivel + max(1, modCON))
 * - Defense = 10 + modCON + armadura_natural
 * - Varied damage dice, proper abilities by mythology
 *
 * Run: GOOGLE_API_KEY=... node scripts/rebalance-monsters.js
 * Options:
 *   --dry-run    Print results without updating DB
 *   --limit=N    Process only first N monsters
 *   --start=N    Start from monster ID N
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

const { PrismaClient } = await import('@prisma/client').then(m => m.default || m);
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0;
const START_ID = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '0') || 0;

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY) { console.error('GOOGLE_API_KEY required'); process.exit(1); }

const SYSTEM_PROMPT = `Você é o game designer do Lunaria RPG — um sistema que mistura mecânicas de D&D 5e, 3D&T Alpha, Daemon e Tormenta RPG.

═══ SISTEMA DE ATRIBUTOS ═══
6 atributos (base 10, modificador = floor((attr-10)/2)):
- Força (FOR): dano corpo a corpo, carregar peso
- Constituição (CON): HP, resistência a veneno/doença
- Agilidade (AGI): esquiva, velocidade, reflexos
- Destreza (DEX): precisão, furtividade, arrombamento
- Inteligência (INT): magia arcana, investigação, conhecimento
- Carisma (CAR): persuasão, intimidação, magia divina

═══ FÓRMULAS DE COMBATE ═══
HP = mult_raca × (nivel + max(1, modCON))
Defesa = 10 + modCON + armadura_natural
Ataque = modFOR + floor(nivel/3)
Esquiva = (modAGI + floor(modDEX/2)) × 5 + floor(nivel×0.5)  cap 0-50%
Dano = dano_base + modFOR (mínimo 0)

═══ MULTIPLICADOR DE RAÇA (HP) ═══
O mult_raca define a robustez base. Referência:
Minúsculo (inseto, fada): 2-3 | Pequeno (goblin, kobold): 3-5
Médio (humano, orc): 5-7 | Grande (ogro, troll): 7-9
Enorme (gigante, hidra): 9-12 | Colossal (dragão, kraken): 12-18

═══ RAÇAS DO JOGO (40 raças jogáveis) ═══
Humano(mult:5), Anão(mult:6,CON+2), Elfo(mult:4,DEX+1,INT+1), Elfo Negro(mult:4,DEX+1,CAR+1),
Halfling(mult:4,DEX+2), Gnomo(mult:4,INT+2), Orc(mult:7,FOR+2,CON+1), Meio-Orc(mult:6,FOR+1,CON+1),
Tiefling(mult:5,INT+1,CAR+1), Draconato(mult:7,FOR+2,CON+1), Aasimar(mult:5,CAR+2),
Minotauro(mult:7,FOR+2,CON+1), Centauro(mult:7,FOR+1,AGI+1), Pardalino(mult:4,DEX+2),
Goblin(mult:3), Kobold(mult:3,DEX+1), Bugbear(mult:6), Ogro(mult:8,FOR+2),
Demônio(mult:6), Anjo(mult:6,CAR+2), Fada(mult:3), Golem(mult:9)

═══ CLASSES DO JOGO (26 classes) ═══
Guerreiro(FOR+1,CON+1), Bárbaro(FOR+2,CON+1), Paladino(CAR+1,CON+1),
Mago(INT+2), Necromante(INT+1), Clérigo(CAR+1,INT+1), Druida(INT+1,CON+1),
Ladino(DEX+1,CAR+1), Assassino(DEX+2), Ranger(DEX+1,CON+1),
Monge(AGI+1,CON+1), Ninja(AGI+1,DEX+1), Bardo(CAR+2)

═══ REFERÊNCIA DE BALANCEAMENTO ═══
Jogador humano Guerreiro nível 1: HP=10, DEF=11, ATK=+2, DANO=1d6+2, ESQ=0%
Jogador minotauro Paladino nível 3: HP=28, DEF=12, ATK=+3, DANO=1d6+2, ESQ=5%

═══ DANO — ESCALA CRIATIVA ═══
Monstros usam QUALQUER dado e bônus. Escale com criatividade:
Nível 1-2: 1d4, 1d6, 1d4+1
Nível 3-5: 1d8, 1d10, 2d4, 1d6+2
Nível 6-10: 2d6, 2d8, 1d10+1d4, 3d4
Nível 10+: 2d10, 3d8, 2d12, 4d6+1d4
Dano base de 1d6 é APENAS para personagens jogáveis.

═══ HABILIDADES ═══
- Nível 1-2 (fracos): array VAZIO [] — apenas ataque básico
- Nível 3-5: 1 habilidade temática
- Nível 6-10: 2-3 habilidades
- Nível 10+: 3-5 habilidades com efeitos complexos
Habilidades são magias ou poderes que o monstro REALMENTE teria baseado em mitologia.

═══ ARMADURA NATURAL ═══
Só para criaturas com proteção física real:
0: carne, pele fina (goblin, humano, fantasma)
1: couro grosso, escamas finas (kobold, lagarto)
2: escamas médias, carapaça (crocodilo, esqueleto com armadura)
3-4: escamas pesadas, armadura natural (dragão jovem, golem de pedra)
5+: blindagem pesada (dragão adulto, golem de ferro, tarrasque)`;

const USER_PROMPT_TEMPLATE = (monster) => `Redesenhe "${monster.nome}" para o Lunaria RPG.

DADOS DO BANCO:
Nome: ${monster.nome}
Descrição: ${monster.descricao || 'Sem descrição'}
Tipo: ${(monster.tipo || []).join(', ') || 'desconhecido'}
Nível: ${monster.nivel_min}-${monster.nivel_max}
Tamanho atual: ${monster.tamanho || 'médio'}
Elemento: ${(monster.elemento || []).join(', ') || 'nenhum'}
Habitat: ${(monster.habitat || []).join(', ') || 'variado'}

Pesquise a mitologia desta criatura em D&D, Tormenta, Daemon e 3D&T. Considere:
- Como ela aparece nessas referências?
- Quais são seus pontos fortes e fracos canônicos?
- Que tipo de dano ela causa naturalmente?
- Ela tem armadura natural (escamas, carapaça, blindagem)?

Retorne APENAS JSON válido (sem markdown, sem backticks, sem explicação fora do JSON):
{"forca":N,"constituicao":N,"agilidade":N,"destreza":N,"inteligencia":N,"carisma":N,"dano_base":"XdY","mult_raca":N,"armadura_natural":N,"tamanho":"minusculo/pequeno/medio/grande/enorme/colossal","habilidades":[{"nome":"...","tipo":"ofensiva/defensiva/suporte","dano":"XdY ou null","efeito":"descrição mecânica curta","chance":0-100,"cooldown":N}],"resistencias":{"elemento":0.5},"imunidades":["elemento"],"xp_sugerido":N,"justificativa":"2-3 linhas com referências dos 4 sistemas"}`;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let model;
function getModel() {
  if (!model) {
    model = new ChatGoogleGenerativeAI({
      model: process.env.REBALANCE_MODEL || 'gemini-2.5-flash-lite',
      apiKey: API_KEY,
      temperature: 0.3,
      maxOutputTokens: 4000,
    });
  }
  return model;
}

function parseGeminiResponse(text) {
  if (!text) return null;
  let cleaned = text.trim().replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(cleaned); } catch {}
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]); } catch {}
    try { return JSON.parse(jsonMatch[0].replace(/,\s*([}\]])/g, '$1')); } catch {}
  }
  return null;
}

function validateResult(result, monster) {
  const errors = [];
  for (const f of ['forca', 'constituicao', 'agilidade', 'destreza', 'inteligencia', 'carisma']) {
    if (typeof result[f] !== 'number' || result[f] < 1 || result[f] > 30) {
      errors.push(`${f}: ${result[f]} (1-30)`);
    }
  }
  if (!result.dano_base || typeof result.dano_base !== 'string') errors.push('dano_base missing');
  if (typeof result.mult_raca !== 'number' || result.mult_raca < 1 || result.mult_raca > 20) errors.push(`mult_raca: ${result.mult_raca}`);
  if (typeof result.armadura_natural !== 'number' || result.armadura_natural < 0) errors.push(`armadura_natural: ${result.armadura_natural}`);

  const modCON = Math.floor(((result.constituicao || 10) - 10) / 2);
  const hp = (result.mult_raca || 5) * (monster.nivel_min + Math.max(1, modCON));
  if (hp < 2) errors.push(`HP too low: ${hp}`);
  if (hp > 600) errors.push(`HP too high: ${hp}`);

  if (!Array.isArray(result.habilidades)) errors.push('habilidades not array');
  else if (result.habilidades.length === 0 && monster.nivel_min >= 3) errors.push('no habilidades for nivel 3+');

  return errors;
}

function calcDerivedStats(result, nivel) {
  const modCON = Math.floor(((result.constituicao || 10) - 10) / 2);
  const modFOR = Math.floor(((result.forca || 10) - 10) / 2);
  const modAGI = Math.floor(((result.agilidade || 10) - 10) / 2);
  const modDEX = Math.floor(((result.destreza || 10) - 10) / 2);
  return {
    hp_base: (result.mult_raca || 5) * (nivel + Math.max(1, modCON)),
    defesa_base: 10 + modCON + (result.armadura_natural || 0),
    ataque_base: modFOR + Math.floor(nivel / 3),
    esquiva: Math.min(50, Math.max(0, (modAGI + Math.floor(modDEX / 2)) * 5 + Math.floor(nivel * 0.5))),
  };
}

async function processMonster(monster, retryCount = 0) {
  const fullPrompt = SYSTEM_PROMPT + '\n\n---\n\n' + USER_PROMPT_TEMPLATE(monster);
  try {
    const response = await getModel().invoke(fullPrompt);
    const rawContent = typeof response.content === 'string' ? response.content : String(response.content || '');
    const result = parseGeminiResponse(rawContent);
    if (!result) {
      if (retryCount < 2) { await sleep(2000); return processMonster(monster, retryCount + 1); }
      console.error(`\n  ❌ ${monster.nome}: parse failed after ${retryCount + 1} tries`);
      return null;
    }
    const errors = validateResult(result, monster);
    if (errors.length > 0 && retryCount < 1) { await sleep(2000); return processMonster(monster, retryCount + 1); }
    const derived = calcDerivedStats(result, monster.nivel_min);
    return { ...result, ...derived, _errors: errors };
  } catch (err) {
    if (err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED')) {
      console.log(`\n  ⏳ Rate limited, waiting 60s...`);
      await sleep(60000);
      if (retryCount < 2) return processMonster(monster, retryCount + 1);
    }
    if (retryCount < 2) { await sleep(3000); return processMonster(monster, retryCount + 1); }
    console.error(`\n  ❌ ${monster.nome}: ${err.message?.slice(0, 100)}`);
    return null;
  }
}

async function main() {
  console.log('🐉 Monster Rebalance Script v2 — Lunaria RPG');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : 'LIVE UPDATE'}`);
  if (START_ID) console.log(`Starting from ID: ${START_ID}`);

  const where = START_ID > 0 ? { id: { gte: START_ID }, sistema: 'lunaria' } : { sistema: 'lunaria' };
  const monsters = await prisma.monstros.findMany({
    where, orderBy: { id: 'asc' }, ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });
  console.log(`Found ${monsters.length} monsters\n`);

  let success = 0, failed = 0;
  const errors = [];

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const pct = Math.round((i / monsters.length) * 100);
    process.stdout.write(`\r[${pct}%] ${i+1}/${monsters.length}: ${monster.nome.padEnd(25)}`);

    const result = await processMonster(monster);
    if (!result) { failed++; errors.push(monster.nome); continue; }

    if (DRY_RUN) {
      const modCON = Math.floor(((result.constituicao || 10) - 10) / 2);
      console.log(`\n  ✅ ${monster.nome} (nv${monster.nivel_min}-${monster.nivel_max})`);
      console.log(`     FOR=${result.forca} CON=${result.constituicao} AGI=${result.agilidade} DEX=${result.destreza} INT=${result.inteligencia} CAR=${result.carisma}`);
      console.log(`     HP=${result.hp_base} DEF=${result.defesa_base} ATK=${result.ataque_base} ESQ=${result.esquiva}% DANO=${result.dano_base} ARM=${result.armadura_natural} MULT=${result.mult_raca} XP=${result.xp_sugerido}`);
      console.log(`     Habs: ${(result.habilidades||[]).map(h=>h.nome).join(', ')||'(nenhuma)'}`);
      console.log(`     ${result.justificativa}`);
      if (result._errors?.length) console.log(`     ⚠️ ${result._errors.join(', ')}`);
    } else {
      try {
        await prisma.monstros.update({
          where: { id: monster.id },
          data: {
            hp_base: result.hp_base,
            ataque_base: result.ataque_base,
            defesa_base: result.defesa_base,
            dano_base: result.dano_base,
            habilidades: result.habilidades || [],
            resistencias: result.resistencias || {},
            imunidades: result.imunidades || [],
            xp_base: result.xp_sugerido || monster.xp_base,
            tamanho: result.tamanho || monster.tamanho,
            mult_raca: result.mult_raca || 5,
            armadura_natural: result.armadura_natural || 0,
          }
        });
        // Update atributos_monstro rows
        for (const attrNome of ['forca', 'constituicao', 'agilidade', 'destreza', 'inteligencia', 'carisma']) {
          if (result[attrNome] !== undefined) {
            await prisma.atributos_monstro.upsert({
              where: { monstro_id_nome: { monstro_id: monster.id, nome: attrNome } },
              update: { valor: result[attrNome] },
              create: { monstro_id: monster.id, nome: attrNome, valor: result[attrNome] }
            });
          }
        }
      } catch (e) { failed++; errors.push(`${monster.nome}: DB ${e.message?.slice(0,50)}`); continue; }
    }
    success++;
    await sleep(1500);
  }

  console.log(`\n\n📊 Resultado: ✅ ${success} | ❌ ${failed}`);
  if (errors.length) console.log(`Erros: ${errors.slice(0, 20).join(', ')}`);
  await prisma.$disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
