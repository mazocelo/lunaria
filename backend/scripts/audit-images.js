#!/usr/bin/env node
/**
 * Audita imagens de entidades do catálogo usando Gemini Vision.
 * Compara cada imagem com a descrição da entidade e avalia fidelidade.
 *
 * Uso:
 *   node scripts/audit-images.js [opcoes]
 *
 * Opcoes:
 *   --types=monstro,raca,classe    Tipos a auditar (padrão: todos com imagem)
 *   --threshold=6                  Nota mínima para considerar OK (1-10, padrão: 6)
 *   --fix                          Regenera automaticamente as reprovadas
 *   --limit=50                     Máximo de entidades a auditar
 *   --provider=nano_banana         Provider para regeneração
 */

import dotenv from 'dotenv';
dotenv.config();

import { PrismaClient } from '@prisma/client';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { HumanMessage } from '@langchain/core/messages';
import { generateImage } from '../services/imageGenerationService.js';
import { generateImagePrompt } from '../services/imagePromptService.js';

const prisma = new PrismaClient({ log: [] });

// ─── CONFIG ─────────────────────────────────────────────
const AUDIT_MODEL = 'gemini-2.5-flash';

const AUDIT_PROMPT = `You are a strict visual quality auditor for an RPG game.
You will receive an image and an entity description. Evaluate the image on these criteria:

1. **ANATOMICAL ACCURACY** (most important): Does the image match the physical description? Correct number of eyes, limbs, heads, wings? Correct size/proportions?
2. **IDENTITY MATCH**: Does the image clearly represent the named entity? Would a player recognize it?
3. **VISUAL QUALITY**: Is the image well-composed, detailed, and free of artifacts/distortions?
4. **MOOD/THEME**: Does the atmosphere match the entity's nature (dark creature = dark mood, etc.)?

Respond in this EXACT JSON format (no markdown, no explanation outside JSON):
{
  "score": <1-10>,
  "pass": <true if score >= THRESHOLD>,
  "issues": ["list of specific issues found"],
  "critical": <true if anatomically wrong or completely wrong entity>
}

THRESHOLD is SCORE_THRESHOLD.
Be strict. A cyclops with two eyes is a 1. A dragon without wings gets a 3. Wrong creature entirely is a 1.`;

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = {
    types: ['monstro', 'raca', 'classe'],
    threshold: 6,
    fix: false,
    limit: 999,
    skip: 0,
    provider: 'nano_banana',
  };
  for (const arg of args) {
    if (arg === '--fix') { opts.fix = true; continue; }
    const [key, val] = arg.replace(/^--/, '').split('=');
    switch (key) {
      case 'types': opts.types = val.split(','); break;
      case 'threshold': opts.threshold = parseInt(val, 10) || 6; break;
      case 'limit': opts.limit = parseInt(val, 10) || 999; break;
      case 'skip': opts.skip = parseInt(val, 10) || 0; break;
      case 'provider': opts.provider = val; break;
    }
  }
  return opts;
}

async function fetchEntitiesWithImages(type, limit, skip = 0) {
  const where = { imagem: { not: null }, sistema: 'lunaria' };

  switch (type) {
    case 'monstro':
      return (await prisma.monstros.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, tamanho: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'monstro', table: 'monstros' }));

    case 'raca':
      return (await prisma.racas.findMany({
        where, select: { id: true, nome: true, descricao: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'raca', table: 'racas' }));

    case 'classe':
      return (await prisma.classes.findMany({
        where, select: { id: true, nome: true, descricao: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'classe', table: 'classes' }));

    case 'equipamento':
      return (await prisma.equipamentos.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'equipamento', table: 'equipamentos' }));

    case 'vantagem':
      return (await prisma.vantagens.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'vantagem', table: 'vantagens' }));

    case 'desvantagem':
      return (await prisma.desvantagens.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'desvantagem', table: 'desvantagens' }));

    case 'habilidade':
      return (await prisma.habilidades_magias.findMany({
        where, select: { id: true, nome: true, descricao: true, tipo: true, elemento: true, imagem: true },
        orderBy: { id: 'asc' }, take: limit, skip,
      })).map(e => ({ ...e, entityType: 'habilidade', table: 'habilidades_magias' }));

    default: return [];
  }
}

async function auditImage(entity, threshold) {
  const model = new ChatGoogleGenerativeAI({
    apiKey: process.env.GOOGLE_API_KEY,
    model: AUDIT_MODEL,
    temperature: 0.2,
    maxOutputTokens: 300,
  });

  const description = [
    `Entity: ${entity.entityType}`,
    `Name: ${entity.nome}`,
    entity.descricao ? `Description: ${entity.descricao}` : '',
    entity.tipo ? `Type: ${Array.isArray(entity.tipo) ? entity.tipo.join(', ') : entity.tipo}` : '',
    entity.elemento ? `Element: ${Array.isArray(entity.elemento) ? entity.elemento.join(', ') : entity.elemento}` : '',
    entity.tamanho ? `Size: ${entity.tamanho}` : '',
  ].filter(Boolean).join('\n');

  const prompt = AUDIT_PROMPT
    .replace('SCORE_THRESHOLD', String(threshold))
    .replace('THRESHOLD', String(threshold));

  // Fetch image as base64
  const imgResponse = await fetch(entity.imagem);
  if (!imgResponse.ok) {
    return { score: 0, pass: false, issues: ['Image URL returned ' + imgResponse.status], critical: true };
  }
  const buffer = Buffer.from(await imgResponse.arrayBuffer());
  const contentType = imgResponse.headers.get('content-type') || 'image/jpeg';
  const base64 = buffer.toString('base64');

  const message = new HumanMessage({
    content: [
      { type: 'text', text: `${prompt}\n\n--- ENTITY DATA ---\n${description}` },
      { type: 'image_url', image_url: { url: `data:${contentType};base64,${base64}` } },
    ],
  });

  const response = await model.invoke([message]);
  const text = (response.content || '').toString().trim();

  try {
    // Extract JSON - handle markdown code blocks and multiline
    let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON');
    const parsed = JSON.parse(jsonMatch[0]);
    // Ensure pass field uses threshold
    if (parsed.pass === undefined) parsed.pass = (parsed.score || 0) >= threshold;
    return parsed;
  } catch {
    // Try to extract just the score
    const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 5;
    const issuesMatch = text.match(/"issues"\s*:\s*\[([\s\S]*?)\]/);
    const issues = issuesMatch ? issuesMatch[1].split(',').map(s => s.trim().replace(/"/g, '')).filter(Boolean) : [];
    const critical = text.includes('"critical": true') || text.includes('"critical":true');
    return { score, pass: score >= threshold, issues, critical };
  }
}

async function regenerateEntity(entity, provider) {
  const style = ['fantasy_painting', 'dark_gothic', 'anime', 'comic_book'][Math.floor(Math.random() * 4)];
  const entityData = { ...entity, estilo_imagem: style };
  const prompt = await generateImagePrompt(entity.entityType, entityData);
  const url = await generateImage(prompt, {
    estilo_imagem: style,
    provider,
    entityType: entity.entityType,
    entityId: String(entity.id),
  });
  await prisma[entity.table].update({ where: { id: entity.id }, data: { imagem: url } });
  return { url, style };
}

async function main() {
  const opts = parseArgs();
  const ts = () => new Date().toISOString().slice(0, 19);

  console.log(`\n[${ts()}] === IMAGE AUDIT START ===`);
  console.log(`  Tipos:     ${opts.types.join(', ')}`);
  console.log(`  Threshold: ${opts.threshold}/10`);
  console.log(`  Fix:       ${opts.fix}`);
  console.log(`  Limite:    ${opts.limit}`);
  console.log(`  Skip:      ${opts.skip}`);
  console.log('');

  let allEntities = [];
  for (const type of opts.types) {
    const entities = await fetchEntitiesWithImages(type, opts.limit, opts.skip);
    allEntities = allEntities.concat(entities);
    console.log(`  ${type}: ${entities.length} com imagem`);
  }

  const total = allEntities.length;
  console.log(`\n  Total a auditar: ${total}\n`);

  const results = { passed: 0, failed: 0, critical: 0, fixed: 0, errors: 0 };
  const failures = [];

  for (let i = 0; i < total; i++) {
    const entity = allEntities[i];
    process.stdout.write(`[${i + 1}/${total}] ${entity.entityType}#${entity.id} "${entity.nome}"... `);

    try {
      const audit = await auditImage(entity, opts.threshold);

      if (audit.pass) {
        console.log(`PASS (${audit.score}/10)`);
        results.passed++;
      } else {
        const label = audit.critical ? 'CRITICAL' : 'FAIL';
        console.log(`${label} (${audit.score}/10) - ${(audit.issues || []).join('; ')}`);
        results.failed++;
        if (audit.critical) results.critical++;

        failures.push({
          entity: `${entity.entityType}#${entity.id}`,
          nome: entity.nome,
          score: audit.score,
          critical: audit.critical,
          issues: audit.issues,
        });

        if (opts.fix && audit.critical) {
          try {
            process.stdout.write(`  Regenerando... `);
            const regen = await regenerateEntity(entity, opts.provider);
            console.log(`OK (${regen.style})`);
            results.fixed++;
          } catch (fixErr) {
            console.log(`ERRO: ${fixErr.message.slice(0, 80)}`);
          }
        }
      }

      // Rate limit: 1s between audits
      await new Promise(r => setTimeout(r, 1000));
    } catch (err) {
      console.log(`ERRO: ${err.message.slice(0, 100)}`);
      results.errors++;
      await new Promise(r => setTimeout(r, 2000));
    }
  }

  // ─── RELATÓRIO ──────────────────────────────────────
  console.log(`\n[${ts()}] === AUDIT REPORT ===`);
  console.log(`  Passed:   ${results.passed}/${total}`);
  console.log(`  Failed:   ${results.failed} (${results.critical} critical)`);
  console.log(`  Fixed:    ${results.fixed}`);
  console.log(`  Errors:   ${results.errors}`);

  if (failures.length > 0) {
    console.log(`\n  Failures:`);
    for (const f of failures) {
      console.log(`    ${f.critical ? '!!!' : ' ! '} ${f.entity} "${f.nome}" (${f.score}/10): ${(f.issues || []).join('; ')}`);
    }
  }

  if (failures.length > 0 && !opts.fix) {
    console.log(`\n  Para corrigir automaticamente as críticas, rode:`);
    console.log(`    node scripts/audit-images.js --types=${opts.types.join(',')} --fix --provider=nano_banana`);
  }
}

main()
  .catch(err => { console.error('Erro fatal:', err); process.exit(1); })
  .finally(() => prisma.$disconnect());
