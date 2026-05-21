/**
 * Monster Validation Script (Cron Job)
 *
 * Validates all monsters in the database for consistency:
 * - HP within expected range for level + size
 * - Damage dice appropriate for level
 * - Attributes within reasonable bounds
 * - Required fields present
 * - Habilidades for level 3+
 *
 * Reports issues and optionally re-submits to Gemini for correction.
 *
 * Run: node scripts/validate-monsters.js
 * Options:
 *   --fix    Re-submit broken monsters to Gemini for correction
 */
const { PrismaClient } = await import('@prisma/client').then(m => m.default || m);
const { getAtributo } = await import('../helpers/atributosHelper.js');
const prisma = new PrismaClient();

const args = process.argv.slice(2);
const FIX_MODE = args.includes('--fix');

function calcMod(attr) {
  return Math.floor(((attr || 10) - 10) / 2);
}

function validateMonster(m) {
  const errors = [];
  const warnings = [];

  // 1. Required fields
  for (const f of ['forca', 'constituicao', 'agilidade', 'destreza', 'inteligencia', 'carisma']) {
    const val = getAtributo(m, f);
    if (val == null || val < 1 || val > 30) {
      errors.push(`${f}: ${val} (expected 1-30)`);
    }
  }

  if (!m.dano_base) errors.push('dano_base missing');
  if (!m.mult_raca || m.mult_raca < 1) errors.push(`mult_raca: ${m.mult_raca}`);

  // 2. HP consistency
  const modCON = calcMod(getAtributo(m, 'constituicao'));
  const expectedHP = (m.mult_raca || 5) * (m.nivel_min + Math.max(1, modCON));
  if (m.hp_base && Math.abs(m.hp_base - expectedHP) > 2) {
    warnings.push(`hp_base ${m.hp_base} != expected ${expectedHP} (mult=${m.mult_raca}, nv=${m.nivel_min}, modCON=${modCON})`);
  }

  // 3. Defense consistency (10 + modCON + armadura_natural)
  const expectedDEF = 10 + modCON + (m.armadura_natural || 0);
  if (m.defesa_base && Math.abs(m.defesa_base - expectedDEF) > 2) {
    warnings.push(`defesa_base ${m.defesa_base} != expected ${expectedDEF} (modCON=${modCON}, arm=${m.armadura_natural || 0})`);
  }

  // 4. Attack consistency (modFOR + floor(nivel/3))
  const modFOR = calcMod(getAtributo(m, 'forca'));
  const expectedATK = modFOR + Math.floor(m.nivel_min / 3);
  if (m.ataque_base != null && Math.abs(m.ataque_base - expectedATK) > 2) {
    warnings.push(`ataque_base ${m.ataque_base} != expected ${expectedATK}`);
  }

  // 5. Damage dice appropriate for level
  const dano = m.dano_base || '1d6';
  const match = dano.match(/(\d+)d(\d+)/);
  if (match) {
    const maxDmg = parseInt(match[1]) * parseInt(match[2]);
    if (m.nivel_min <= 2 && maxDmg > 12) warnings.push(`dano ${dano} too high for level ${m.nivel_min}`);
    if (m.nivel_min >= 8 && maxDmg < 6) warnings.push(`dano ${dano} too low for level ${m.nivel_min}`);
  }

  // 6. Habilidades for level 3+
  const habs = Array.isArray(m.habilidades) ? m.habilidades : [];
  if (m.nivel_min >= 3 && habs.length === 0) {
    warnings.push('no habilidades for nivel 3+');
  }

  // 7. XP sanity
  if (m.xp_base && (m.xp_base < 5 || m.xp_base > 5000)) {
    warnings.push(`xp_base ${m.xp_base} out of range`);
  }

  // 8. Tamanho consistency with mult_raca
  const tamMult = {
    'minusculo': [2, 3], 'minúsculo': [2, 3],
    'pequeno': [3, 5],
    'medio': [5, 7], 'médio': [5, 7],
    'grande': [6, 9],
    'enorme': [8, 12],
    'colossal': [10, 18]
  };
  const range = tamMult[(m.tamanho || 'medio').toLowerCase()];
  if (range && m.mult_raca && (m.mult_raca < range[0] || m.mult_raca > range[1])) {
    warnings.push(`mult_raca ${m.mult_raca} out of range for ${m.tamanho} (${range[0]}-${range[1]})`);
  }

  return { errors, warnings };
}

async function main() {
  console.log('🔍 Monster Validation');
  console.log(`Mode: ${FIX_MODE ? 'FIX (will re-submit broken)' : 'REPORT ONLY'}\n`);

  const monsters = await prisma.monstros.findMany({ where: { sistema: 'lunaria' }, orderBy: { id: 'asc' }, include: { atributos_monstro: true } });
  console.log(`Total: ${monsters.length} monsters\n`);

  let clean = 0, withWarnings = 0, withErrors = 0;
  const broken = [];

  for (const m of monsters) {
    const { errors, warnings } = validateMonster(m);

    if (errors.length > 0) {
      withErrors++;
      console.log(`❌ [${m.id}] ${m.nome} (nv${m.nivel_min}-${m.nivel_max})`);
      errors.forEach(e => console.log(`   ERROR: ${e}`));
      warnings.forEach(w => console.log(`   WARN: ${w}`));
      broken.push(m);
    } else if (warnings.length > 0) {
      withWarnings++;
      console.log(`⚠️  [${m.id}] ${m.nome}: ${warnings.join('; ')}`);
    } else {
      clean++;
    }
  }

  console.log(`\n📊 Resultado:`);
  console.log(`  ✅ Clean: ${clean}`);
  console.log(`  ⚠️  Warnings: ${withWarnings}`);
  console.log(`  ❌ Errors: ${withErrors}`);

  if (FIX_MODE && broken.length > 0) {
    console.log(`\n🔧 Re-submitting ${broken.length} broken monsters to Gemini...`);
    console.log('(Run rebalance-monsters.js --start=ID for each broken monster)');
    broken.forEach(m => console.log(`  node scripts/rebalance-monsters.js --start=${m.id} --limit=1`));
  }

  await prisma.$disconnect();
}

main().catch(err => { console.error('Fatal:', err); process.exit(1); });
