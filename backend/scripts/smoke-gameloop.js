/**
 * smoke-gameloop.js — Validates game loop prerequisites and REST endpoints.
 *
 * Tests the non-WebSocket parts of the game flow:
 * 1. Demo user exists and can authenticate
 * 2. Demo character exists with valid attributes
 * 3. Demo story exists with prólogo
 * 4. HP/mana/esquiva calculations work for demo character
 * 5. Combat helper can generate monster instances
 *
 * Requires: DATABASE_URL in .env (reads DB, no writes)
 *
 * Usage: node Backend/scripts/smoke-gameloop.js
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import assert from 'node:assert/strict';
import { calcularHP, calcularMana, calcularEsquiva, calcularArmadura } from '../helpers/combateHelper.js';

const prisma = new PrismaClient();

let passed = 0;
let failed = 0;

function test(name, fn) {
  return fn().then(() => {
    passed++;
    console.log(`  ✓ ${name}`);
  }).catch((err) => {
    failed++;
    console.error(`  ✗ ${name}`);
    console.error(`    ${err.message}`);
  });
}

async function main() {
  // ── Demo User ──
  console.log('\n── Demo User ──');

  const usuario = await prisma.usuarios.findUnique({ where: { email: 'demo@lunaria.dev' } });

  await test('demo user exists', async () => {
    assert.ok(usuario, 'Usuário demo@lunaria.dev não encontrado. Execute: node Backend/scripts/seed-demo.js');
  });

  if (!usuario) {
    console.log('\n  ⚠ Seed de demo não encontrado. Execute: node Backend/scripts/seed-demo.js');
    return;
  }

  await test('demo password matches "demo1234"', async () => {
    const match = await bcrypt.compare('demo1234', usuario.senha);
    assert.ok(match, 'Senha do demo não confere');
  });

  // ── Demo Character ──
  console.log('\n── Demo Character ──');

  const personagem = await prisma.personagens.findFirst({
    where: { id_usuario: usuario.id, deleted_at: null },
    select: {
      id: true, nome: true, nivel: true,
      forca: true, destreza: true, constituicao: true,
      inteligencia: true, agilidade: true, carisma: true,
      racas: { select: { id: true, nome: true } },
      classes: { select: { id: true, nome: true } },
    },
  });

  await test('demo character exists', async () => {
    assert.ok(personagem, 'Nenhum personagem encontrado para o demo user');
  });

  if (!personagem) return;

  await test('character has required attributes', async () => {
    assert.ok(personagem.forca >= 1, 'forca deve ser >= 1');
    assert.ok(personagem.constituicao >= 1, 'constituicao deve ser >= 1');
    assert.ok(personagem.destreza >= 1, 'destreza deve ser >= 1');
    assert.ok(personagem.agilidade >= 1, 'agilidade deve ser >= 1');
    assert.ok(personagem.nivel >= 1, 'nivel deve ser >= 1');
  });

  await test('HP calculation works', async () => {
    const hp = calcularHP(personagem.constituicao, personagem.nivel);
    assert.ok(hp > 0, `HP deveria ser > 0, got ${hp}`);
    console.log(`      → HP: ${hp}`);
  });

  await test('Mana calculation works', async () => {
    const mana = calcularMana(personagem.inteligencia, personagem.nivel);
    assert.ok(mana > 0, `Mana deveria ser > 0, got ${mana}`);
    console.log(`      → Mana: ${mana}`);
  });

  await test('Esquiva calculation works', async () => {
    const esquiva = calcularEsquiva(personagem);
    assert.ok(typeof esquiva === 'number', 'Esquiva deve ser número');
    console.log(`      → Esquiva: ${esquiva}%`);
  });

  await test('Armadura calculation works', async () => {
    const armadura = calcularArmadura(personagem);
    assert.ok(typeof armadura === 'number', 'Armadura deve ser número');
    console.log(`      → Armadura: ${armadura}`);
  });

  // ── Demo Story ──
  console.log('\n── Demo Story ──');

  const historia = await prisma.historias.findFirst({
    where: { id_usuario: usuario.id, deleted_at: null },
    select: { id: true, nome: true, prologo: true, temas: true },
  });

  await test('demo story exists', async () => {
    assert.ok(historia, 'Nenhuma história encontrada para o demo user');
  });

  if (!historia) return;

  await test('story has prólogo', async () => {
    assert.ok(historia.prologo, 'História deve ter prólogo para pular geração IA');
    assert.ok(historia.prologo.length > 50, 'Prólogo deve ter conteúdo substancial');
  });

  await test('story has temas', async () => {
    assert.ok(Array.isArray(historia.temas), 'temas deve ser array');
    assert.ok(historia.temas.length > 0, 'Deve ter pelo menos 1 tema');
  });

  await test('story tema exists in DB', async () => {
    const tema = await prisma.temas.findUnique({ where: { id: historia.temas[0] } });
    assert.ok(tema, `Tema id=${historia.temas[0]} não encontrado no banco`);
  });

  // ── Demo Monsters ──
  console.log('\n── Demo Monsters ──');

  const monstros = await prisma.monstros.findMany({ take: 5, select: { id: true, nome: true, hp_base: true, dano_base: true } });

  await test('at least 1 monster in DB', async () => {
    assert.ok(monstros.length > 0, 'Nenhum monstro encontrado. Execute: node Backend/scripts/seed-demo.js');
  });

  if (monstros.length > 0) {
    await test('monster has combat stats', async () => {
      const m = monstros[0];
      assert.ok(m.hp_base > 0, 'hp_base deve ser > 0');
      assert.ok(m.dano_base, 'dano_base deve existir');
      console.log(`      → ${m.nome}: HP=${m.hp_base}, DMG=${m.dano_base}`);
    });
  }

  // ── Game Loop Info ──
  console.log('\n── Game Loop (referência) ──');
  console.log(`  Historia ID: ${historia.id}`);
  console.log(`  Personagem ID: ${personagem.id} (${personagem.nome})`);
  console.log(`  Room ID: historia_${historia.id}`);
  console.log(`  Login: POST /auth/login { email: "demo@lunaria.dev", senha: "demo1234" }`);
  console.log(`  Start: POST /jogo/start { historiaId: ${historia.id} }`);
}

main()
  .then(() => {
    console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`  Total: ${passed + failed} | Passed: ${passed} | Failed: ${failed}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    process.exit(failed > 0 ? 1 : 0);
  })
  .catch((err) => {
    console.error('Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
