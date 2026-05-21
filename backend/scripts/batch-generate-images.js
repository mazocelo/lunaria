#!/usr/bin/env node
/**
 * Script de geração em lote de imagens para entidades do catálogo.
 *
 * Uso:
 *   node --max-old-space-size=256 scripts/batch-generate-images.js [opcoes]
 *
 * Opcoes:
 *   --types=monstro,equipamento,vantagem,desvantagem,habilidade  (padrão: todos)
 *   --limit=50          Máximo de imagens por execução (padrão: ilimitado)
 *   --delay=8000        Delay entre gerações em ms (padrão: 8000)
 *   --dry-run           Apenas mostra o que seria gerado, sem chamar a API
 *   --style=random      Estilo fixo ou "random" para variar (padrão: random)
 *   --force             Regerar mesmo para entidades que já têm imagem
 *   --batch=50          Processa N entidades por batch antes de limpar memória (padrão: 50)
 *   --provider=pollinations  Provider de imagem: pollinations, leonardo (padrão: pollinations)
 *
 * Exemplos:
 *   node scripts/batch-generate-images.js --types=monstro --limit=10 --dry-run
 *   node scripts/batch-generate-images.js --types=monstro,equipamento --delay=10000
 *   node scripts/batch-generate-images.js --style=dark_gothic --types=monstro
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { generateImage } from '../services/imageGenerationService.js';
import { generateImagePrompt } from '../services/imagePromptService.js';

const prisma = new PrismaClient({ log: [] });

// ─── CONFIG ─────────────────────────────────────────────
const ALL_STYLES = [
  'fantasy_painting',
  'anime',
  'dark_gothic',
  'watercolor',
  'comic_book',
  'pixel_art',
  'realistic',
];

// Pesos de estilo por tipo de entidade — certos estilos combinam melhor com certas entidades
const STYLE_WEIGHTS = {
  monstro: {
    fantasy_painting: 3,
    dark_gothic: 4,
    anime: 2,
    comic_book: 2,
    watercolor: 1,
    realistic: 2,
    pixel_art: 1,
  },
  equipamento: {
    fantasy_painting: 4,
    dark_gothic: 2,
    anime: 1,
    comic_book: 2,
    watercolor: 2,
    realistic: 3,
    pixel_art: 1,
  },
  vantagem: {
    fantasy_painting: 3,
    dark_gothic: 1,
    anime: 3,
    comic_book: 2,
    watercolor: 2,
    realistic: 1,
    pixel_art: 1,
  },
  desvantagem: {
    fantasy_painting: 2,
    dark_gothic: 5,
    anime: 1,
    comic_book: 2,
    watercolor: 1,
    realistic: 2,
    pixel_art: 1,
  },
  habilidade: {
    fantasy_painting: 3,
    dark_gothic: 2,
    anime: 3,
    comic_book: 2,
    watercolor: 2,
    realistic: 1,
    pixel_art: 1,
  },
  raca: {
    fantasy_painting: 4,
    dark_gothic: 2,
    anime: 3,
    comic_book: 2,
    watercolor: 2,
    realistic: 3,
    pixel_art: 1,
  },
  classe: {
    fantasy_painting: 4,
    dark_gothic: 2,
    anime: 3,
    comic_book: 2,
    watercolor: 1,
    realistic: 2,
    pixel_art: 1,
  },
};

function weightedRandom(entityType) {
  const weights = STYLE_WEIGHTS[entityType] || STYLE_WEIGHTS.monstro;
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = Math.random() * total;
  for (const [style, weight] of entries) {
    r -= weight;
    if (r <= 0) return style;
  }
  return entries[0][0];
}

// ─── PARSE ARGS ─────────────────────────────────────────
function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    types: ['monstro', 'equipamento', 'vantagem', 'desvantagem', 'habilidade', 'raca', 'classe'],
    limit: Number.POSITIVE_INFINITY,
    delay: 5000,
    dryRun: false,
    style: 'random',
    force: false,
    concurrency: 1,
    batch: 50,
    provider: 'pollinations',
  };

  for (const arg of args) {
    if (arg === '--dry-run') { opts.dryRun = true; continue; }
    if (arg === '--force') { opts.force = true; continue; }
    const [key, val] = arg.replace(/^--/, '').split('=');
    switch (key) {
      case 'types': opts.types = val.split(','); break;
      case 'limit': opts.limit = parseInt(val, 10) || Number.POSITIVE_INFINITY; break;
      case 'delay': opts.delay = parseInt(val, 10) || 5000; break;
      case 'style': opts.style = val; break;
      case 'batch': opts.batch = Math.max(10, parseInt(val, 10) || 50); break;
      case 'concurrency': opts.concurrency = Math.max(1, parseInt(val, 10) || 1); break;
      case 'provider': opts.provider = val || 'pollinations'; break;
    }
  }
  return opts;
}

// ─── FETCH ENTITIES ─────────────────────────────────────
async function fetchEntities(type, force) {
  const where = force ? { sistema: 'lunaria' } : { imagem: null, sistema: 'lunaria' };

  switch (type) {
    case 'monstro':
      return (await prisma.monstros.findMany({
        where,
        select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, habitat: true, tamanho: true, habilidades: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'monstro', table: 'monstros' }));

    case 'equipamento':
      return (await prisma.equipamentos.findMany({
        where,
        select: {
          id: true, nome: true, descricao: true, tipo: true, elemento: true, propriedades: true,
          raridade_rel: { select: { nome: true } },
          categoria_rel: { select: { nome: true } },
        },
        orderBy: { id: 'asc' },
      })).map(e => ({
        ...e,
        raridade: e.raridade_rel?.nome,
        categoria: e.categoria_rel?.nome,
        entityType: 'equipamento',
        table: 'equipamentos',
      }));

    case 'vantagem':
      return (await prisma.vantagens.findMany({
        where,
        select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, dano_base: true, nivel: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'vantagem', table: 'vantagens' }));

    case 'desvantagem':
      return (await prisma.desvantagens.findMany({
        where,
        select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, nivel: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'desvantagem', table: 'desvantagens' }));

    case 'habilidade':
      return (await prisma.habilidades_magias.findMany({
        where,
        select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, escola_magia: true, categoria: true, dano_base: true, alcance: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'habilidade', table: 'habilidades_magias' }));

    case 'raca':
      return (await prisma.racas.findMany({
        where,
        select: { id: true, nome: true, descricao: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'raca', table: 'racas' }));

    case 'classe':
      return (await prisma.classes.findMany({
        where,
        select: { id: true, nome: true, descricao: true },
        orderBy: { id: 'asc' },
      })).map(e => ({ ...e, entityType: 'classe', table: 'classes' }));

    default:
      console.warn(`Tipo desconhecido: ${type}`);
      return [];
  }
}

// ─── GENERATE SINGLE IMAGE ──────────────────────────────
async function generateEntityImage(entity, style, dryRun, opts = {}) {
  const entityData = {
    ...entity,
    estilo_imagem: style,
  };

  // Gera prompt otimizado via LLM
  const prompt = await generateImagePrompt(entity.entityType, entityData);

  if (dryRun) {
    return { prompt, style, url: null };
  }

  // Gera imagem via provider configurado
  const url = await generateImage(prompt, { estilo_imagem: style, provider: opts.provider });
  return { prompt, style, url };
}

// ─── SAVE IMAGE URL ─────────────────────────────────────
async function saveImageUrl(table, id, url) {
  await prisma[table].update({
    where: { id },
    data: { imagem: url },
  });
}

// ─── PROGRESS ───────────────────────────────────────────
function progressBar(current, total, width = 30) {
  const pct = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * width);
  const bar = '█'.repeat(filled) + '░'.repeat(width - filled);
  return `[${bar}] ${pct}% (${current}/${total})`;
}

// ─── MAIN ───────────────────────────────────────────────
async function main() {
  const opts = parseArgs();

  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║   BATCH IMAGE GENERATOR — Role Chat Game            ║');
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Provider:    ${opts.provider}`);
  console.log(`  Tipos:       ${opts.types.join(', ')}`);
  console.log(`  Estilo:      ${opts.style}`);
  console.log(`  Delay:       ${opts.delay}ms`);
  console.log(`  Limite:      ${opts.limit === Number.POSITIVE_INFINITY ? 'sem limite' : opts.limit}`);
  console.log(`  Concurrency: ${opts.concurrency}`);
  console.log(`  Dry-run:     ${opts.dryRun}`);
  console.log(`  Force:       ${opts.force}`);
  console.log('');

  // Coleta todas as entidades
  let allEntities = [];
  for (const type of opts.types) {
    const entities = await fetchEntities(type, opts.force);
    allEntities = allEntities.concat(entities);
    console.log(`  ${type}: ${entities.length} entidades pendentes`);
  }

  // Aplica limite
  if (opts.limit < allEntities.length) {
    allEntities = allEntities.slice(0, opts.limit);
  }

  const total = allEntities.length;
  if (total === 0) {
    console.log('\nNenhuma entidade pendente. Todas já possuem imagem!');
    return;
  }

  console.log(`\nTotal a gerar: ${total} imagens\n`);

  const stats = { success: 0, failed: 0, skipped: 0 };
  const errors = [];
  const startTime = Date.now();

  for (let i = 0; i < total; i++) {
    const entity = allEntities[i];
    const style = opts.style === 'random' ? weightedRandom(entity.entityType) : opts.style;

    const prefix = `[${i + 1}/${total}]`;

    try {
      process.stdout.write(`${prefix} ${entity.entityType}#${entity.id} "${entity.nome}" (${style})... `);

      const result = await generateEntityImage(entity, style, opts.dryRun, opts);

      if (opts.dryRun) {
        console.log(`\n  PROMPT: ${result.prompt.slice(0, 120)}...`);
        stats.skipped++;
      } else {
        await saveImageUrl(entity.table, entity.id, result.url);
        console.log('OK');
        stats.success++;
      }

      // Delay entre gerações (exceto na última)
      if (i < total - 1 && !opts.dryRun) {
        await new Promise(r => setTimeout(r, opts.delay));
      }
    } catch (err) {
      console.log(`ERRO: ${err.message}`);
      errors.push({ entity: `${entity.entityType}#${entity.id} ${entity.nome}`, error: err.message });
      stats.failed++;

      // Se for rate limit, espera mais
      if (/429|rate.?limit|too.?many/i.test(err.message)) {
        console.log(`  Rate limited! Aguardando 60s...`);
        await new Promise(r => setTimeout(r, 60000));
      } else {
        // Delay normal mesmo em erro
        await new Promise(r => setTimeout(r, opts.delay));
      }
    }

    // Progress e GC a cada batch
    if ((i + 1) % opts.batch === 0) {
      const elapsed = ((Date.now() - startTime) / 1000).toFixed(0);
      const rate = (stats.success / (elapsed / 60)).toFixed(1);
      const eta = stats.success > 0
        ? (((total - i - 1) * (Date.now() - startTime)) / (i + 1) / 1000 / 60).toFixed(1)
        : '?';
      const mem = (process.memoryUsage.rss() / 1024 / 1024).toFixed(0);
      console.log(`\n  ${progressBar(i + 1, total)} | ${rate} img/min | ETA: ${eta}min | RAM: ${mem}MB\n`);
      if (global.gc) global.gc();
    }
  }

  // ─── RELATÓRIO FINAL ────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log('\n╔══════════════════════════════════════════════════════╗');
  console.log('║   RELATÓRIO FINAL                                   ║');
  console.log('╠══════════════════════════════════════════════════════╣');
  console.log(`║  Sucesso:  ${String(stats.success).padStart(5)}                                  ║`);
  console.log(`║  Falhas:   ${String(stats.failed).padStart(5)}                                  ║`);
  console.log(`║  Skipped:  ${String(stats.skipped).padStart(5)}                                  ║`);
  console.log(`║  Tempo:    ${elapsed.padStart(5)} min                               ║`);
  console.log('╚══════════════════════════════════════════════════════╝');

  if (errors.length > 0) {
    console.log('\nErros detalhados:');
    for (const e of errors) {
      console.log(`  - ${e.entity}: ${e.error}`);
    }
  }
}

main()
  .catch(err => {
    console.error('Erro fatal:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
