#!/usr/bin/env node
/**
 * Job diário de geração de imagens para catálogo.
 * Roda automaticamente via cron, gera o máximo possível com a cota disponível,
 * e para quando a cota esgotar ou todas as entidades estiverem preenchidas.
 *
 * Prioridade: monstro > raca > classe > equipamento > vantagem > desvantagem > habilidade
 *
 * Cron sugerido (5h BRT = 8h UTC, após reset de cota Google):
 *   0 8 * * * cd /opt/role-chat-game/backend && node --max-old-space-size=200 scripts/daily-image-job.js >> /var/log/lunaria-images.log 2>&1
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { generateImage } from '../services/imageGenerationService.js';
import { generateImagePrompt } from '../services/imagePromptService.js';

const prisma = new PrismaClient({ log: [] });

// ─── CONFIG ─────────────────────────────────────────────
const PROVIDER = process.env.IMAGE_JOB_PROVIDER || 'nano_banana';
const DELAY_MS = parseInt(process.env.IMAGE_JOB_DELAY || '6000', 10);
const MAX_CONSECUTIVE_ERRORS = 5;   // Para se muitos erros seguidos
const MAX_QUOTA_ERRORS = 2;         // Para imediatamente se cota esgotou

const ENTITY_PRIORITY = [
  'monstro',
  'raca',
  'classe',
  'equipamento',
  'vantagem',
  'desvantagem',
  'habilidade',
];

const ALL_STYLES = [
  'fantasy_painting', 'anime', 'dark_gothic',
  'watercolor', 'comic_book', 'pixel_art', 'realistic',
];

const STYLE_WEIGHTS = {
  monstro:      { fantasy_painting: 3, dark_gothic: 4, anime: 2, comic_book: 2, watercolor: 1, realistic: 2, pixel_art: 1 },
  equipamento:  { fantasy_painting: 4, dark_gothic: 2, anime: 1, comic_book: 2, watercolor: 2, realistic: 3, pixel_art: 1 },
  vantagem:     { fantasy_painting: 3, dark_gothic: 1, anime: 3, comic_book: 2, watercolor: 2, realistic: 1, pixel_art: 1 },
  desvantagem:  { fantasy_painting: 2, dark_gothic: 5, anime: 1, comic_book: 2, watercolor: 1, realistic: 2, pixel_art: 1 },
  habilidade:   { fantasy_painting: 3, dark_gothic: 2, anime: 3, comic_book: 2, watercolor: 2, realistic: 1, pixel_art: 1 },
  raca:         { fantasy_painting: 4, dark_gothic: 2, anime: 3, comic_book: 2, watercolor: 2, realistic: 3, pixel_art: 1 },
  classe:       { fantasy_painting: 4, dark_gothic: 2, anime: 3, comic_book: 2, watercolor: 1, realistic: 2, pixel_art: 1 },
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

// ─── FETCH PENDING ENTITIES ─────────────────────────────
async function fetchPending(type, limit = 50) {
  const where = { imagem: null, sistema: 'lunaria' };

  switch (type) {
    case 'monstro':
      return (await prisma.monstros.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, habitat: true, tamanho: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'monstro', table: 'monstros' }));

    case 'equipamento':
      return (await prisma.equipamentos.findMany({
        where,
        select: {
          id: true, nome: true, descricao: true, tipo: true, elemento: true, propriedades: true,
          raridade_rel: { select: { nome: true } },
          categoria_rel: { select: { nome: true } },
        },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, raridade: e.raridade_rel?.nome, categoria: e.categoria_rel?.nome, entityType: 'equipamento', table: 'equipamentos' }));

    case 'vantagem':
      return (await prisma.vantagens.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, dano_base: true, nivel: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'vantagem', table: 'vantagens' }));

    case 'desvantagem':
      return (await prisma.desvantagens.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, nivel: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'desvantagem', table: 'desvantagens' }));

    case 'habilidade':
      return (await prisma.habilidades_magias.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, escola_magia: true, categoria: true, dano_base: true, alcance: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'habilidade', table: 'habilidades_magias' }));

    case 'raca':
      return (await prisma.racas.findMany({
        where, select: { id: true, nome: true, descricao: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'raca', table: 'racas' }));

    case 'classe':
      return (await prisma.classes.findMany({
        where, select: { id: true, nome: true, descricao: true },
        orderBy: { id: 'asc' }, take: limit,
      })).map(e => ({ ...e, entityType: 'classe', table: 'classes' }));

    default:
      return [];
  }
}

// ─── MAIN ───────────────────────────────────────────────
async function main() {
  const startTime = Date.now();
  const ts = () => new Date().toISOString().slice(0, 19);

  console.log(`\n[${ts()}] === DAILY IMAGE JOB START (provider: ${PROVIDER}) ===`);

  // Count all pending
  const pendingCounts = {};
  let totalPending = 0;
  for (const type of ENTITY_PRIORITY) {
    const count = (await fetchPending(type, 1)).length > 0
      ? (await fetchPending(type, 9999)).length
      : 0;
    pendingCounts[type] = count;
    totalPending += count;
  }

  console.log(`[${ts()}] Pendentes:`, Object.entries(pendingCounts).map(([k, v]) => `${k}=${v}`).join(' | '), `| TOTAL=${totalPending}`);

  if (totalPending === 0) {
    console.log(`[${ts()}] Todas as entidades já possuem imagem. Job finalizado.`);
    return;
  }

  const stats = { success: 0, failed: 0, quotaExhausted: false };
  let consecutiveErrors = 0;
  let quotaErrors = 0;

  for (const type of ENTITY_PRIORITY) {
    if (stats.quotaExhausted) break;
    if (pendingCounts[type] === 0) continue;

    console.log(`[${ts()}] --- Processando: ${type} (${pendingCounts[type]} pendentes) ---`);

    // Process in batches of 20
    while (true) {
      if (stats.quotaExhausted) break;

      const batch = await fetchPending(type, 20);
      if (batch.length === 0) break;

      for (const entity of batch) {
        if (stats.quotaExhausted) break;

        const style = weightedRandom(entity.entityType);

        try {
          const entityData = { ...entity, estilo_imagem: style };
          const prompt = await generateImagePrompt(entity.entityType, entityData);
          const url = await generateImage(prompt, {
            estilo_imagem: style,
            provider: PROVIDER,
            entityType: entity.entityType,
            entityId: String(entity.id),
          });

          await prisma[entity.table].update({
            where: { id: entity.id },
            data: { imagem: url },
          });

          stats.success++;
          consecutiveErrors = 0;
          console.log(`[${ts()}] OK ${entity.entityType}#${entity.id} "${entity.nome}" (${style}) [${stats.success} total]`);

          await new Promise(r => setTimeout(r, DELAY_MS));
        } catch (err) {
          const msg = err.message || '';
          const isQuota = /429|quota|rate.*limit|not enough.*token|RESOURCE_EXHAUSTED/i.test(msg);

          if (isQuota) {
            quotaErrors++;
            console.log(`[${ts()}] QUOTA ${entity.entityType}#${entity.id} "${entity.nome}" (${quotaErrors}/${MAX_QUOTA_ERRORS})`);
            if (quotaErrors >= MAX_QUOTA_ERRORS) {
              stats.quotaExhausted = true;
              console.log(`[${ts()}] Cota esgotada. Parando job.`);
              break;
            }
            // Wait longer on quota errors
            await new Promise(r => setTimeout(r, 60000));
          } else {
            consecutiveErrors++;
            stats.failed++;
            console.log(`[${ts()}] ERRO ${entity.entityType}#${entity.id} "${entity.nome}": ${msg.slice(0, 150)}`);

            if (consecutiveErrors >= MAX_CONSECUTIVE_ERRORS) {
              console.log(`[${ts()}] ${MAX_CONSECUTIVE_ERRORS} erros consecutivos. Parando job.`);
              stats.quotaExhausted = true;
              break;
            }
            await new Promise(r => setTimeout(r, DELAY_MS));
          }
        }
      }

      // GC between batches
      if (global.gc) global.gc();
    }
  }

  // ─── RELATÓRIO ──────────────────────────────────────
  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  // Recount pending
  let remainingTotal = 0;
  const remainingCounts = {};
  for (const type of ENTITY_PRIORITY) {
    const pending = await fetchPending(type, 9999);
    remainingCounts[type] = pending.length;
    remainingTotal += pending.length;
  }

  console.log(`[${ts()}] === DAILY IMAGE JOB DONE ===`);
  console.log(`  Geradas:   ${stats.success}`);
  console.log(`  Falhas:    ${stats.failed}`);
  console.log(`  Quota:     ${stats.quotaExhausted ? 'ESGOTADA' : 'OK'}`);
  console.log(`  Tempo:     ${elapsed} min`);
  console.log(`  Restantes: ${remainingTotal}`, Object.entries(remainingCounts).map(([k, v]) => `${k}=${v}`).join(' | '));

  if (remainingTotal === 0) {
    console.log(`  >>> TODAS AS ENTIDADES DO CATALOGO POSSUEM IMAGEM! <<<`);
  }
}

main()
  .catch(err => {
    console.error('Erro fatal no daily-image-job:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
