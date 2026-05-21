/**
 * Seed completo do banco de dados a partir dos JSONs de catálogo.
 *
 * Lê todos os 10 arquivos JSON de `novidades e mds/catalogos/`
 * e popula o DB via Prisma.
 *
 * Uso: node seed-from-json.js
 */

import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

const CATALOGOS_DIR = join(__dirname, '..', 'novidades e mds', 'catalogos');

// ──────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────

function loadJSON(filename) {
  const path = join(CATALOGOS_DIR, filename);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

/** Reset autoincrement sequence para uma tabela */
async function resetSequence(tableName, nextVal) {
  const seq = `${tableName}_id_seq`;
  await prisma.$executeRawUnsafe(
    `SELECT setval('"${seq}"', ${nextVal}, false)`
  );
}

// ──────────────────────────────────────────────────────────────
// 1. CLEAR — Limpa tudo respeitando FK order
// ──────────────────────────────────────────────────────────────

async function clearAll() {
  console.log('\n🧹 Limpando todas as tabelas de catálogo...');

  // Pivot / dependentes primeiro
  await prisma.monstro_loot.deleteMany({});
  await prisma.monstro_ingrediente.deleteMany({});
  await prisma.receita_ingrediente.deleteMany({});
  await prisma.receita_ferramenta.deleteMany({});
  await prisma.receitas.deleteMany({});
  await prisma.personagem_equipamento.deleteMany({});
  await prisma.personagem_desvantagem.deleteMany({});
  await prisma.personagem_vantagem.deleteMany({});
  await prisma.ferramentas.deleteMany({});

  // Tabelas principais (ordem de FK) — filtra por sistema para não apagar dados de outros sistemas
  await prisma.monstros.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.equipamentos.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.habilidades_magias.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.desvantagens.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.vantagens.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.racas.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.classes.deleteMany({ where: { sistema: 'lunaria' } });
  await prisma.temas.deleteMany({});

  // Tabelas de referência
  await prisma.elementos.deleteMany({});
  await prisma.categorias_monstro.deleteMany({});
  await prisma.categorias_equipamento.deleteMany({});
  await prisma.raridades.deleteMany({});

  console.log('✅ Tabelas limpas!');
}

// ──────────────────────────────────────────────────────────────
// 2. ELEMENTOS
// ──────────────────────────────────────────────────────────────

async function seedElementos() {
  console.log('\n🔥 Inserindo elementos...');

  const elementos = loadJSON('elementos_completo.json');

  for (const el of elementos) {
    await prisma.elementos.create({
      data: {
        id: el.id,
        nome: el.nome,
        descricao: el.descricao || null,
        cor: el.cor || null,
        icone: el.icone || null,
        ordem: el.ordem || 0,
      }
    });
  }

  const maxId = Math.max(...elementos.map(e => e.id));
  await resetSequence('elementos', maxId + 1);
  console.log(`✅ ${elementos.length} elementos`);
}

// ──────────────────────────────────────────────────────────────
// 3. RARIDADES (extraídas dos JSONs)
// ──────────────────────────────────────────────────────────────

async function seedRaridades() {
  console.log('\n💎 Inserindo raridades...');

  // Extrair raridades do JSON de equipamentos (tem raridade_rel com id/nome/cor/ordem)
  const equipamentos = loadJSON('equipamentos_completo.json');

  const COR_MAP = {
    'Comum': '#9ca3af', 'Incomum': '#22c55e', 'Raro': '#3b82f6',
    'Muito Raro': '#a855f7', 'Lendário': '#f59e0b', 'Artefato': '#ef4444',
    'Épico': '#dc2626', 'Variável': '#8b5cf6',
  };

  // Coletar por ID original do JSON
  const rarById = new Map();
  for (const eq of equipamentos) {
    if (eq.raridade_rel?.id && eq.raridade_rel?.nome) {
      const r = eq.raridade_rel;
      if (!rarById.has(r.id)) {
        rarById.set(r.id, {
          id: r.id,
          nome: r.nome,
          cor: COR_MAP[r.nome] || r.cor || '#9ca3af',
          ordem: r.ordem || 0,
        });
      }
    }
  }

  const sorted = Array.from(rarById.values()).sort((a, b) => a.id - b.id);

  for (const r of sorted) {
    await prisma.raridades.create({ data: r });
  }

  const maxId = sorted.length ? Math.max(...sorted.map(r => r.id)) : 0;
  await resetSequence('raridades', maxId + 1);
  console.log(`✅ ${sorted.length} raridades: ${sorted.map(r => `${r.id}:${r.nome}`).join(', ')}`);
}

// ──────────────────────────────────────────────────────────────
// 4. CATEGORIAS EQUIPAMENTO (extraídas do JSON)
// ──────────────────────────────────────────────────────────────

async function seedCategoriasEquipamento() {
  console.log('\n🗡️  Inserindo categorias de equipamento...');

  const equipamentos = loadJSON('equipamentos_completo.json');

  // Extrair categorias únicas — categoria_rel é objeto {id, nome, icone, ordem}
  const catMap = new Map();
  for (const eq of equipamentos) {
    if (eq.categoria_id && eq.categoria_rel) {
      const rel = eq.categoria_rel;
      catMap.set(rel.id || eq.categoria_id, {
        id: rel.id || eq.categoria_id,
        nome: rel.nome || `Categoria ${eq.categoria_id}`,
        icone: rel.icone || null,
        ordem: rel.ordem || 0,
      });
    }
  }

  const cats = Array.from(catMap.values()).sort((a, b) => a.id - b.id);

  for (const c of cats) {
    await prisma.categorias_equipamento.create({ data: c });
  }

  const maxId = cats.length ? Math.max(...cats.map(c => c.id)) : 0;
  await resetSequence('categorias_equipamento', maxId + 1);
  console.log(`✅ ${cats.length} categorias de equipamento`);
}

// ──────────────────────────────────────────────────────────────
// 5. CATEGORIAS MONSTRO (extraídas do JSON)
// ──────────────────────────────────────────────────────────────

async function seedCategoriasMonstro() {
  console.log('\n🐉 Inserindo categorias de monstro...');

  const monstros = loadJSON('monstros_completo.json');

  // Monstros não têm categoria_rel, precisamos extrair de outra forma
  // Vamos checar se tem categoria_id e inferir os nomes
  const catIds = new Set();
  for (const m of monstros) {
    if (m.categoria_id) catIds.add(m.categoria_id);
  }

  // Nomes padrão de categorias de monstro — usados pelo sistema
  const CATS_MONSTRO = [
    { id: 1, nome: 'Besta',        icone: '🐺', ordem: 1 },
    { id: 2, nome: 'Morto-Vivo',   icone: '💀', ordem: 2 },
    { id: 3, nome: 'Demônio',      icone: '👿', ordem: 3 },
    { id: 4, nome: 'Elemental',    icone: '🔥', ordem: 4 },
    { id: 5, nome: 'Humanoide',    icone: '🧑', ordem: 5 },
    { id: 6, nome: 'Dragão',       icone: '🐲', ordem: 6 },
    { id: 7, nome: 'Constructo',   icone: '🤖', ordem: 7 },
    { id: 8, nome: 'Aberração',    icone: '👁️', ordem: 8 },
    { id: 9, nome: 'Celestial',    icone: '😇', ordem: 9 },
    { id: 10, nome: 'Planta',      icone: '🌿', ordem: 10 },
    { id: 11, nome: 'Gigante',     icone: '🗿', ordem: 11 },
    { id: 12, nome: 'Fada',        icone: '🧚', ordem: 12 },
    { id: 13, nome: 'Inseto',      icone: '🦟', ordem: 13 },
    { id: 14, nome: 'Limo',        icone: '🟢', ordem: 14 },
    { id: 15, nome: 'Metamorfo',   icone: '🎭', ordem: 15 },
  ];

  // Garantir que todos os IDs referenciados existem
  for (const id of catIds) {
    if (!CATS_MONSTRO.find(c => c.id === id)) {
      CATS_MONSTRO.push({ id, nome: `Categoria ${id}`, ordem: id });
    }
  }

  const toInsert = CATS_MONSTRO.sort((a, b) => a.id - b.id);
  for (const c of toInsert) {
    await prisma.categorias_monstro.create({ data: c });
  }

  const maxId = toInsert.length ? Math.max(...toInsert.map(c => c.id)) : 0;
  await resetSequence('categorias_monstro', maxId + 1);
  console.log(`✅ ${toInsert.length} categorias de monstro`);
}

// ──────────────────────────────────────────────────────────────
// 6. TEMAS
// ──────────────────────────────────────────────────────────────

async function seedTemas() {
  console.log('\n📚 Inserindo temas...');

  const temas = loadJSON('temas_completo.json');

  for (const t of temas) {
    await prisma.temas.create({
      data: { id: t.id, nome: t.nome, descricao: t.descricao || null }
    });
  }

  const maxId = Math.max(...temas.map(t => t.id));
  await resetSequence('temas', maxId + 1);
  console.log(`✅ ${temas.length} temas`);
}

// ──────────────────────────────────────────────────────────────
// 7. CLASSES
// ──────────────────────────────────────────────────────────────

async function seedClasses() {
  console.log('\n⚔️  Inserindo classes...');

  const classes = loadJSON('classes_completo.json');
  let count = 0;

  for (let i = 0; i < classes.length; i++) {
    const c = classes[i];
    const id = c.id || (i + 1);
    await prisma.classes.create({
      data: {
        id,
        nome: c.nome,
        descricao: c.descricao || null,
        custo: c.custo || 0,
        // classes.bonus é String no DB (não Json)
        bonus: c.bonus ? JSON.stringify(c.bonus) : null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  const maxId = classes.reduce((m, c, i) => Math.max(m, c.id || (i + 1)), 0);
  await resetSequence('classes', maxId + 1);
  console.log(`✅ ${count} classes`);
}

// ──────────────────────────────────────────────────────────────
// 8. RAÇAS
// ──────────────────────────────────────────────────────────────

async function seedRacas() {
  console.log('\n🧬 Inserindo raças...');

  const racas = loadJSON('racas_completo.json');
  let count = 0;

  for (let i = 0; i < racas.length; i++) {
    const r = racas[i];
    const id = r.id || (i + 1);
    await prisma.racas.create({
      data: {
        id,
        nome: r.nome,
        descricao: r.descricao || null,
        custo: r.custo || 0,
        // racas.bonus é String no DB (não Json)
        bonus: r.bonus ? JSON.stringify(r.bonus) : null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  const maxId = racas.reduce((m, r, i) => Math.max(m, r.id || (i + 1)), 0);
  await resetSequence('racas', maxId + 1);
  console.log(`✅ ${count} raças`);
}

// ──────────────────────────────────────────────────────────────
// 9. VANTAGENS
// ──────────────────────────────────────────────────────────────

async function seedVantagens() {
  console.log('\n✨ Inserindo vantagens...');

  const vantagens = loadJSON('vantagens_completo.json');
  let count = 0;

  for (let i = 0; i < vantagens.length; i++) {
    const v = vantagens[i];
    await prisma.vantagens.create({
      data: {
        nome: v.nome,
        descricao: v.descricao || '',
        custo: v.custo || 0,
        tipo: v.tipo || ['ativa'],
        bonus: v.bonus || null,
        restricao: v.restricao || null,
        dano_base: v.dano_base || null,
        efeito: v.efeito || null,
        usar: v.usar ?? null,
        elemento: v.elemento || [],
        nivel: v.nivel || 1,
        requisitos: v.requisitos || null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  await resetSequence('vantagens', count + 1);
  console.log(`✅ ${count} vantagens`);
}

// ──────────────────────────────────────────────────────────────
// 10. DESVANTAGENS
// ──────────────────────────────────────────────────────────────

async function seedDesvantagens() {
  console.log('\n⚠️  Inserindo desvantagens...');

  const desvantagens = loadJSON('desvantagens_completo.json');
  let count = 0;

  for (let i = 0; i < desvantagens.length; i++) {
    const d = desvantagens[i];
    await prisma.desvantagens.create({
      data: {
        nome: d.nome,
        descricao: d.descricao || '',
        custo: d.custo || 0,
        tipo: d.tipo || ['ativa'],
        bonus: d.bonus || null,
        restricao: d.restricao || null,
        dano_base: d.dano_base || null,
        efeito: d.efeito || null,
        usar: d.usar ?? null,
        elemento: d.elemento || [],
        nivel: d.nivel || 1,
        requisitos: d.requisitos || null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  await resetSequence('desvantagens', count + 1);
  console.log(`✅ ${count} desvantagens`);
}

// ──────────────────────────────────────────────────────────────
// 11. HABILIDADES + MAGIAS (ambos vão para tabela `habilidades`)
// ──────────────────────────────────────────────────────────────

async function seedHabilidades() {
  console.log('\n🎯 Inserindo habilidades + magias...');

  const habilidades = loadJSON('habilidades_completo.json');
  const magias = loadJSON('magias_completo.json');

  // Combinar (habilidades primeiro, magias depois — IDs já são contínuos)
  const all = [...habilidades, ...magias];
  let count = 0;
  let maxId = 0;

  for (const h of all) {
    const id = h.id;
    if (id > maxId) maxId = id;

    await prisma.habilidades_magias.create({
      data: {
        id,
        nome: h.nome,
        descricao: h.descricao || '',
        custo_mana: h.custo_mana || 0,
        dano_base: h.dano_base || null,
        tipo: h.tipo || 'dano',
        elemento: h.elemento || null,
        nivel_requerido: h.nivel_requerido || 1,
        cooldown_turnos: h.cooldown_turnos || 0,
        classe_id: h.classe_id || null,
        efeito: h.efeito || null,
        alvo: h.alvo || 'inimigo',
        alcance: h.alcance || 'medio',
        area_efeito: h.area_efeito || null,
        tempo_conjuracao: h.tempo_conjuracao || 'acao',
        usa_concentracao: h.usa_concentracao || false,
        categoria: h.categoria || 'combate_fisico',
        escola_magia: h.escola_magia || null,
        escalamento: h.escalamento || null,
        pre_requisito: h.pre_requisito || null,
        raca_id: h.raca_id || null,
        usos_por_descanso: h.usos_por_descanso ?? null,
        componente_material: h.componente_material || null,
        saving_throw: h.saving_throw || null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  await resetSequence('habilidades', maxId + 1);
  console.log(`✅ ${count} habilidades+magias (${habilidades.length} hab + ${magias.length} mag)`);
}

// ──────────────────────────────────────────────────────────────
// 12. EQUIPAMENTOS
// ──────────────────────────────────────────────────────────────

async function seedEquipamentos() {
  console.log('\n🛡️  Inserindo equipamentos...');

  const equipamentos = loadJSON('equipamentos_completo.json');
  let count = 0;
  let maxId = 0;

  for (const eq of equipamentos) {
    const id = eq.id;
    if (id > maxId) maxId = id;

    await prisma.equipamentos.create({
      data: {
        id,
        nome: eq.nome,
        descricao: eq.descricao || null,
        tipo: eq.tipo || [],
        bonus: eq.bonus || null,
        dano_base: eq.dano_base || null,
        elemento: eq.elemento || [],
        requisitos: eq.requisitos || null,
        propriedades: eq.propriedades || [],
        categoria_id: eq.categoria_id || null,
        raridade_id: eq.raridade_id || null,
        peso: eq.peso ?? null,
        preco_sugerido: eq.preco_sugerido || null,
        sistema: 'lunaria',
      }
    });
    count++;
  }

  await resetSequence('equipamentos', maxId + 1);
  console.log(`✅ ${count} equipamentos`);
}

// ──────────────────────────────────────────────────────────────
// 13. MONSTROS
// ──────────────────────────────────────────────────────────────

async function seedMonstros() {
  console.log('\n👹 Inserindo monstros...');

  const monstros = loadJSON('monstros_completo.json');
  let count = 0;
  let maxId = 0;

  for (const m of monstros) {
    const id = m.id;
    if (id > maxId) maxId = id;

    const monstro = await prisma.monstros.create({
      data: {
        id,
        nome: m.nome,
        descricao: m.descricao || null,
        tipo: m.tipo || ['besta'],
        nivel_min: m.nivel_min || 1,
        nivel_max: m.nivel_max || 10,
        hp_base: m.hp_base || 15,
        ataque_base: m.ataque_base || 2,
        defesa_base: m.defesa_base || 10,
        dano_base: m.dano_base || '1d6',
        habilidades: m.habilidades || [],
        elemento: m.elemento || [],
        temas: m.temas || [],
        xp_base: m.xp_base || 50,
        raridade_id: m.raridade_id || null,
        categoria_id: m.categoria_id || null,
        habitat: m.habitat || [],
        imunidades: m.imunidades || [],
        resistencias: m.resistencias || {},
        tamanho: m.tamanho || 'medio',
        velocidade: m.velocidade || { terrestre: 30 },
        sistema: 'lunaria',
      }
    });

    await prisma.atributos_monstro.createMany({
      data: [
        { monstro_id: monstro.id, nome: 'forca', valor: m.forca || 10 },
        { monstro_id: monstro.id, nome: 'inteligencia', valor: m.inteligencia || 8 },
        { monstro_id: monstro.id, nome: 'destreza', valor: m.destreza || 10 },
        { monstro_id: monstro.id, nome: 'constituicao', valor: m.constituicao || 10 },
        { monstro_id: monstro.id, nome: 'agilidade', valor: m.agilidade || 10 },
        { monstro_id: monstro.id, nome: 'carisma', valor: m.carisma || 5 },
      ]
    });
    count++;
  }

  await resetSequence('monstros', maxId + 1);
  console.log(`✅ ${count} monstros`);
}

// ──────────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────────

async function main() {
  console.log('🚀 SEED COMPLETO — Limpando DB e inserindo dados dos JSONs de catálogo\n');
  console.log(`📂 Catálogos: ${CATALOGOS_DIR}`);

  const t0 = Date.now();

  try {
    await clearAll();

    // Referência (sem FK)
    await seedElementos();
    await seedRaridades();
    await seedCategoriasEquipamento();
    await seedCategoriasMonstro();

    // Catálogos base
    await seedTemas();
    await seedClasses();
    await seedRacas();

    // 4 pilares
    await seedVantagens();
    await seedDesvantagens();
    await seedHabilidades();

    // Entidades com FK em referência
    await seedEquipamentos();
    await seedMonstros();

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    console.log(`\n🎉 Seed completo em ${elapsed}s!`);
  } catch (err) {
    console.error('\n❌ ERRO NO SEED:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
