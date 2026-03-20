/**
 * Monster Rebalance Script
 *
 * Uses Gemini 3.1 Pro to redesign all monsters with:
 * - Coherent attributes based on mythology (D&D, 3D&T, Daemon, Tormenta)
 * - Varied damage dice by type/size
 * - HP = mult_raca × (nivel + max(1, modCON))
 * - Proper abilities per monster
 *
 * Run: GOOGLE_API_KEY=... node scripts/rebalance-monsters.js
 * Options:
 *   --dry-run    Print results without updating DB
 *   --limit=N    Process only first N monsters
 *   --start=N    Start from monster ID N
 *   --validate   Run validation only (no Gemini calls)
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// Use dynamic import for Prisma (ESM compat)
const { PrismaClient } = await import('@prisma/client').then(m => m.default || m);
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const VALIDATE_ONLY = args.includes('--validate');
const LIMIT = parseInt(args.find(a => a.startsWith('--limit='))?.split('=')[1] || '0') || 0;
const START_ID = parseInt(args.find(a => a.startsWith('--start='))?.split('=')[1] || '0') || 0;

const API_KEY = process.env.GOOGLE_API_KEY;
if (!API_KEY && !VALIDATE_ONLY) {
  console.error('GOOGLE_API_KEY required');
  process.exit(1);
}

const SYSTEM_PROMPT = `Você é um game designer de RPG. O sistema Lunaria RPG mistura mecânicas de D&D 5e, 3D&T Alpha, Daemon e Tormenta RPG.

ATRIBUTOS (base 10, modificador = floor((attr-10)/2)):
- Força (FOR): dano corpo a corpo, carregar peso
- Constituição (CON): HP, resistência a veneno/doença
- Agilidade (AGI): esquiva, velocidade, reflexos
- Destreza (DEX): precisão, furtividade, arrombamento
- Inteligência (INT): magia arcana, investigação, conhecimento
- Carisma (CAR): persuasão, intimidação, magia divina

FÓRMULAS DO SISTEMA:
- HP = mult_raca × (nivel + max(1, modCON))
- Defesa = 10 + modCON + armadura_natural
- Ataque = modFOR + floor(nivel/3)
- Esquiva = (modAGI + floor(modDEX/2)) × 5 + floor(nivel×0.5)   cap 0-50%
- Dano = dano_base + modFOR

TIERS DE ATRIBUTO:
- "-" = fraco (6-8)
- "N" = neutro (10)
- "+" = acima (12-13)
- "++" = forte (14-15)
- "+++" = excepcional (16-18)

MULTIPLICADOR DE RAÇA (HP):
- Minúsculo: 2-3
- Pequeno: 3-5
- Médio: 5-6
- Grande: 6-8
- Enorme: 8-10
- Colossal: 10-15

REFERÊNCIA: Jogador humano nível 1 tem HP=10, Defesa=11, Ataque=+2, Dano=1d6+2

DANO: Monstros podem usar QUALQUER dado e qualquer bônus. Escale criativamente:
- 1d4, 1d6, 1d8, 1d10, 1d12, 2d6, 2d8, 3d6, 2d10, 1d20, etc.
- Bônus: +1, +2, +1d4, etc. Exemplo: "2d8+1d4" para um dragão.
- Monstros fracos (nível 1-2): 1d4 a 1d6
- Monstros médios (nível 3-5): 1d8 a 2d6
- Monstros fortes (nível 6-10): 2d8 a 3d6
- Monstros épicos (nível 10+): 2d10+, 3d8+, até 4d12

HABILIDADES:
- Monstros fracos (nível 1-2): apenas ataque básico, sem habilidades especiais. Retorne habilidades como array VAZIO [].
- Monstros médios (nível 3-5): 1 habilidade especial temática
- Monstros fortes (nível 6-10): 2-3 habilidades
- Monstros épicos (nível 10+): 3-5 habilidades com efeitos complexos
- Habilidades devem ser magias ou poderes que o monstro REALMENTE teria na mitologia

REGRAS:
1. Atributos devem refletir a mitologia e natureza do monstro
2. Use referências de D&D, Tormenta, Daemon e 3D&T para cada criatura
3. Dano base VARIADO (NÃO tudo 1d6)
4. Resistências e imunidades baseadas na natureza elemental
5. XP proporcional ao desafio (nível × raridade)
6. armadura_natural: só para criaturas com cascas, escamas, armadura, pele grossa`;

const USER_PROMPT_TEMPLATE = (monster) => `Redesenhe o monstro "${monster.nome}" para o sistema Lunaria RPG.

DADOS ATUAIS DO BANCO:
- Nome: ${monster.nome}
- Descrição: ${monster.descricao || 'Sem descrição'}
- Tipo: ${(monster.tipo || []).join(', ') || 'desconhecido'}
- Nível: ${monster.nivel_min}-${monster.nivel_max}
- Tamanho: ${monster.tamanho || 'médio'}
- Elemento: ${(monster.elemento || []).join(', ') || 'nenhum'}
- Habitat: ${(monster.habitat || []).join(', ') || 'variado'}
- Stats atuais: FOR=${monster.forca} CON=${monster.constituicao} AGI=${monster.agilidade} DEX=${monster.destreza} INT=${monster.inteligencia} CAR=${monster.carisma}
- Habilidades atuais: ${JSON.stringify(monster.habilidades || []).slice(0, 300)}

Retorne APENAS JSON válido (sem markdown, sem backticks):
{"forca":N,"constituicao":N,"agilidade":N,"destreza":N,"inteligencia":N,"carisma":N,"dano_base":"XdY","mult_raca":N,"armadura_natural":N,"tamanho":"...","habilidades":[{"nome":"...","tipo":"ofensiva/defensiva/suporte","dano":"XdY ou null","efeito":"descrição mecânica curta","chance":0-100,"cooldown":N}],"resistencias":{},"imunidades":[],"xp_sugerido":N,"justificativa":"2-3 linhas"}`;

// Rate limiting
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

let model;
function getModel() {
  if (!model) {
    model = new ChatGoogleGenerativeAI({
      model: 'gemini-3.1-pro-preview',
      apiKey: API_KEY,
      temperature: 0.3,
      maxOutputTokens: 4000,
    });
  }
  return model;
}

function parseGeminiResponse(text) {
  if (!text) return null;

  // Strip ALL markdown code blocks (including nested)
  let cleaned = text.trim()
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // Try direct parse
  try {
    return JSON.parse(cleaned);
  } catch {}

  // Try to extract the largest JSON object
  const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {}

    // Try fixing common issues: trailing commas
    try {
      const fixed = jsonMatch[0].replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed);
    } catch {}
  }

  return null;
}

function validateResult(result, monster) {
  const errors = [];

  // Required fields
  for (const f of ['forca', 'constituicao', 'agilidade', 'destreza', 'inteligencia', 'carisma']) {
    if (typeof result[f] !== 'number' || result[f] < 1 || result[f] > 30) {
      errors.push(`${f}: ${result[f]} (expected 1-30)`);
    }
  }

  if (!result.dano_base || typeof result.dano_base !== 'string') {
    errors.push('dano_base missing or invalid');
  }

  if (typeof result.mult_raca !== 'number' || result.mult_raca < 1 || result.mult_raca > 20) {
    errors.push(`mult_raca: ${result.mult_raca} (expected 1-20)`);
  }

  if (typeof result.armadura_natural !== 'number' || result.armadura_natural < 0 || result.armadura_natural > 15) {
    errors.push(`armadura_natural: ${result.armadura_natural} (expected 0-15)`);
  }

  // Validate HP makes sense
  const modCON = Math.floor(((result.constituicao || 10) - 10) / 2);
  const hp = (result.mult_raca || 5) * (monster.nivel_min + Math.max(1, modCON));
  if (hp < 3) errors.push(`HP too low: ${hp}`);
  if (hp > 500) errors.push(`HP too high: ${hp}`);

  // Validate habilidades (weak monsters can have none)
  if (!Array.isArray(result.habilidades)) {
    errors.push('habilidades not an array');
  } else if (result.habilidades.length === 0 && monster.nivel_min >= 3) {
    errors.push('habilidades empty for nivel 3+ monster');
  }

  return errors;
}

function calcDerivedStats(result, nivel) {
  const modCON = Math.floor(((result.constituicao || 10) - 10) / 2);
  const modFOR = Math.floor(((result.forca || 10) - 10) / 2);
  const modAGI = Math.floor(((result.agilidade || 10) - 10) / 2);
  const modDEX = Math.floor(((result.destreza || 10) - 10) / 2);
  const mult = result.mult_raca || 5;

  return {
    hp_base: mult * (nivel + Math.max(1, modCON)),
    defesa_base: 10 + modCON + (result.armadura_natural || 0),
    ataque_base: modFOR + Math.floor(nivel / 3),
    esquiva: Math.min(50, Math.max(0, (modAGI + Math.floor(modDEX / 2)) * 5 + Math.floor(nivel * 0.5))),
  };
}

async function processMonster(monster, retryCount = 0) {
  const prompt = USER_PROMPT_TEMPLATE(monster);

  try {
    const fullPrompt = SYSTEM_PROMPT + '\n\n---\n\n' + prompt;
    const response = await getModel().invoke(fullPrompt);

    const rawContent = typeof response.content === 'string' ? response.content : String(response.content || '');
    const result = parseGeminiResponse(rawContent);
    if (!result) {
      console.error(`\n  ❌ ${monster.nome}: JSON parse failed. Raw (first 200): ${rawContent.slice(0, 200)}`);
      if (retryCount < 2) {
        await sleep(2000);
        return processMonster(monster, retryCount + 1);
      }
      return null;
    }

    const errors = validateResult(result, monster);
    if (errors.length > 0) {
      console.warn(`  ⚠️ ${monster.nome}: validation issues: ${errors.join(', ')}`);
      if (retryCount < 2) {
        await sleep(2000);
        return processMonster(monster, retryCount + 1);
      }
    }

    const derived = calcDerivedStats(result, monster.nivel_min);

    return {
      ...result,
      ...derived,
      _errors: errors,
      _derived: true,
    };
  } catch (err) {
    console.error(`  ❌ ${monster.nome}: API error: ${err.message}`);
    if (retryCount < 2 && (err.message.includes('429') || err.message.includes('RESOURCE_EXHAUSTED'))) {
      console.log(`  ⏳ Rate limited, waiting 30s...`);
      await sleep(30000);
      return processMonster(monster, retryCount + 1);
    }
    if (retryCount < 2) {
      await sleep(3000);
      return processMonster(monster, retryCount + 1);
    }
    return null;
  }
}

async function main() {
  console.log('🐉 Monster Rebalance Script');
  console.log(`Mode: ${DRY_RUN ? 'DRY RUN' : VALIDATE_ONLY ? 'VALIDATE ONLY' : 'LIVE UPDATE'}`);

  // Fetch all monsters
  const where = START_ID > 0 ? { id: { gte: START_ID } } : {};
  let monsters = await prisma.monstros.findMany({
    where,
    orderBy: { id: 'asc' },
    ...(LIMIT > 0 ? { take: LIMIT } : {}),
  });

  console.log(`Found ${monsters.length} monsters to process`);

  const results = { success: 0, failed: 0, skipped: 0, validated: 0, errors: [] };

  for (let i = 0; i < monsters.length; i++) {
    const monster = monsters[i];
    const pct = Math.round((i / monsters.length) * 100);
    process.stdout.write(`\r[${pct}%] Processing ${i+1}/${monsters.length}: ${monster.nome.padEnd(25)}`);

    if (VALIDATE_ONLY) {
      // Just validate existing stats
      const modCON = Math.floor(((monster.constituicao || 10) - 10) / 2);
      const hp = (monster.hp_base || 10);
      const expected = 5 * (monster.nivel_min + Math.max(1, modCON));
      if (Math.abs(hp - expected) > expected * 0.5) {
        results.errors.push({ id: monster.id, nome: monster.nome, hp, expected, diff: hp - expected });
      }
      results.validated++;
      continue;
    }

    const result = await processMonster(monster);

    if (!result) {
      results.failed++;
      results.errors.push({ id: monster.id, nome: monster.nome, error: 'processing failed' });
      continue;
    }

    if (DRY_RUN) {
      console.log(`\n  ✅ ${monster.nome}: FOR=${result.forca} CON=${result.constituicao} AGI=${result.agilidade} DEX=${result.destreza}`);
      console.log(`     HP=${result.hp_base} DEF=${result.defesa_base} ATK=${result.ataque_base} ESQ=${result.esquiva} DANO=${result.dano_base} XP=${result.xp_sugerido}`);
      console.log(`     Mult=${result.mult_raca} Armadura=${result.armadura_natural} Habs=${result.habilidades?.length}`);
      if (result._errors?.length) console.log(`     ⚠️ ${result._errors.join(', ')}`);
      results.success++;
      continue;
    }

    // Live update
    try {
      await prisma.monstros.update({
        where: { id: monster.id },
        data: {
          forca: result.forca,
          constituicao: result.constituicao,
          agilidade: result.agilidade,
          destreza: result.destreza,
          inteligencia: result.inteligencia,
          carisma: result.carisma,
          hp_base: result.hp_base,
          ataque_base: result.ataque_base,
          defesa_base: result.defesa_base,
          dano_base: result.dano_base,
          habilidades: result.habilidades || [],
          resistencias: result.resistencias || {},
          imunidades: result.imunidades || [],
          xp_base: result.xp_sugerido || monster.xp_base,
          tamanho: result.tamanho || monster.tamanho,
        }
      });
      results.success++;
    } catch (dbErr) {
      console.error(`\n  ❌ DB update failed for ${monster.nome}: ${dbErr.message}`);
      results.failed++;
      results.errors.push({ id: monster.id, nome: monster.nome, error: dbErr.message });
    }

    // Rate limiting: 1 request per 1.5s (40/min safe for paid tier)
    await sleep(1500);
  }

  console.log('\n\n📊 Results:');
  console.log(`  ✅ Success: ${results.success}`);
  console.log(`  ❌ Failed: ${results.failed}`);
  console.log(`  ⏭️ Skipped: ${results.skipped}`);
  if (results.validated) console.log(`  🔍 Validated: ${results.validated}`);

  if (results.errors.length > 0) {
    console.log(`\n⚠️ Errors (${results.errors.length}):`);
    results.errors.slice(0, 20).forEach(e =>
      console.log(`  - [${e.id}] ${e.nome}: ${e.error || `HP ${e.hp} expected ~${e.expected}`}`)
    );
    if (results.errors.length > 20) console.log(`  ... and ${results.errors.length - 20} more`);
  }

  await prisma.$disconnect();
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
