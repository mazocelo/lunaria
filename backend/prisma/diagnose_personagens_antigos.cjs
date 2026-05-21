/**
 * Diagnóstico de personagens antigos — passo 3.7 da Fase 3 (sistema H&M).
 *
 * SOMENTE LEITURA. Este script NÃO altera nada no banco — não há DELETE,
 * UPDATE, INSERT nem upsert. Ele apenas classifica cada personagem em buckets
 * e grava um relatório JSON para o tech-lead decidir o critério de corte.
 *
 * Uso: node prisma/diagnose_personagens_antigos.cjs
 * Saída: <repo-root>/.qa/diagnostico-personagens.json
 *
 * Buckets (a "idade" é inferida por estrutura — não há coluna de versão):
 *
 *  - ok            — tem vínculos H&M corretos para o seu sistema:
 *                      • lunaria/dnd5e: ao menos um vínculo em hm_personagem,
 *                        OU é um personagem sem aptidão mágica (raca.pode_magia
 *                        = false) sem nenhuma magia esperada;
 *                      • tresdet: ao menos um vínculo em personagem_magia_tresdet,
 *                        OU stats_sistema.temMagia === false (não-conjurador).
 *
 *  - migravel      — não tem vínculos H&M, mas carrega dados legados de magia
 *                      convertíveis: campos JSON antigos de magia/habilidade
 *                      (arrays "magias"/"habilidades"/"grimorio"/"spells" dentro
 *                      de stats_sistema ou em colunas JSON legadas).
 *
 *  - irrecuperavel — estrutura incompatível, sem dados convertíveis: conjurador
 *                      esperado (pode_magia / temMagia) sem vínculo e sem dados
 *                      legados, ou estrutura mínima inválida (sem raça/classe num
 *                      sistema que as exige).
 */
const { PrismaClient } = require('@prisma/client');
const fs = require('node:fs');
const path = require('node:path');

const prisma = new PrismaClient();

const OUTPUT_DIR = path.resolve(__dirname, '..', '..', '.qa');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'diagnostico-personagens.json');

// Sistemas baseados em escola+nível que usam hm_personagem como vínculo H&M.
const SISTEMAS_HM = new Set(['lunaria', 'dnd5e']);

// Chaves JSON que indicariam um grimório/lista de magias legada convertível.
const CHAVES_MAGIA_LEGADA = ['magias', 'habilidades', 'grimorio', 'spells', 'feiticos'];

/**
 * Procura por dados de magia legados (arrays não-vazios) dentro de um objeto JSON.
 * Retorna a lista de chaves encontradas (vazia se nenhuma).
 */
function detectarMagiaLegada(json) {
  if (!json || typeof json !== 'object') return [];
  const encontradas = [];
  for (const chave of CHAVES_MAGIA_LEGADA) {
    const valor = json[chave];
    if (Array.isArray(valor) && valor.length > 0) encontradas.push(chave);
  }
  return encontradas;
}

/**
 * Classifica um personagem em um bucket. Função pura — não toca no banco.
 * @returns {{ bucket: 'ok'|'migravel'|'irrecuperavel', motivo: string }}
 */
function classificar(p) {
  const sistema = p.sistema;
  const stats = p.stats_sistema;
  const temMagiaLegada = detectarMagiaLegada(stats).length > 0;

  if (SISTEMAS_HM.has(sistema)) {
    const temVinculoHm = p._count.hm_personagem > 0;
    const conjurador = p.racas ? p.racas.pode_magia !== false : true;

    if (temVinculoHm) {
      return { bucket: 'ok', motivo: `tem ${p._count.hm_personagem} vínculo(s) em hm_personagem` };
    }
    // Sem vínculo H&M.
    if (temMagiaLegada) {
      return { bucket: 'migravel', motivo: 'sem hm_personagem, mas tem dados de magia legados em stats_sistema' };
    }
    if (!conjurador && p.raca_id != null && p.classe_id != null) {
      return { bucket: 'ok', motivo: 'raça sem aptidão mágica (pode_magia=false); ausência de magia é esperada' };
    }
    if (p.raca_id == null || p.classe_id == null) {
      return { bucket: 'irrecuperavel', motivo: 'sistema HM sem raça e/ou classe; estrutura incompatível' };
    }
    return { bucket: 'irrecuperavel', motivo: 'conjurador esperado sem vínculo hm_personagem e sem dados legados' };
  }

  if (sistema === 'tresdet') {
    const temVinculoMagia = p._count.personagem_magia_tresdet > 0;
    const temMagia = stats && typeof stats === 'object' ? stats.temMagia === true : false;

    if (temVinculoMagia) {
      return { bucket: 'ok', motivo: `tem ${p._count.personagem_magia_tresdet} vínculo(s) em personagem_magia_tresdet` };
    }
    if (temMagiaLegada) {
      return { bucket: 'migravel', motivo: 'sem personagem_magia_tresdet, mas tem dados de magia legados' };
    }
    if (!temMagia) {
      return { bucket: 'ok', motivo: 'não-conjurador (stats_sistema.temMagia=false); ausência de magia é esperada' };
    }
    return { bucket: 'irrecuperavel', motivo: 'conjurador 3D&T (temMagia=true) sem vínculo personagem_magia_tresdet e sem dados legados' };
  }

  // Sistemas não suportados pelo H&M (ex.: daemon) — estrutura fora do escopo.
  return { bucket: 'irrecuperavel', motivo: `sistema '${sistema}' não suportado pelo modelo H&M` };
}

function bucketVazio() {
  return { ok: 0, migravel: 0, irrecuperavel: 0 };
}

async function main() {
  const personagens = await prisma.personagens.findMany({
    select: {
      id: true,
      nome: true,
      sistema: true,
      raca_id: true,
      classe_id: true,
      nivel: true,
      stats_sistema: true,
      deleted_at: true,
      racas: { select: { pode_magia: true } },
      _count: { select: { hm_personagem: true, personagem_magia_tresdet: true } },
    },
  });

  const relatorio = {
    gerado_em: new Date().toISOString(),
    total: personagens.length,
    observacao:
      'Diagnóstico read-only (passo 3.7). Nenhuma escrita no banco. ' +
      'O critério de corte de personagens antigos é decidido pelo tech-lead a partir destes números.',
    por_bucket: bucketVazio(),
    por_sistema: {},
    amostras: { ok: [], migravel: [], irrecuperavel: [] },
  };

  const MAX_AMOSTRA = 25;

  for (const p of personagens) {
    const { bucket, motivo } = classificar(p);

    relatorio.por_bucket[bucket] += 1;

    if (!relatorio.por_sistema[p.sistema]) {
      relatorio.por_sistema[p.sistema] = bucketVazio();
    }
    relatorio.por_sistema[p.sistema][bucket] += 1;

    if (relatorio.amostras[bucket].length < MAX_AMOSTRA) {
      relatorio.amostras[bucket].push({
        id: p.id,
        nome: p.nome,
        sistema: p.sistema,
        nivel: p.nivel,
        deleted: p.deleted_at != null,
        motivo,
      });
    }
  }

  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(relatorio, null, 2));

  console.log('=== Diagnóstico de personagens antigos (read-only) ===');
  console.log(`Total: ${relatorio.total}`);
  console.log('Por bucket:', JSON.stringify(relatorio.por_bucket));
  console.log('Por sistema:');
  for (const [sis, contagens] of Object.entries(relatorio.por_sistema)) {
    console.log(`  ${sis}: ${JSON.stringify(contagens)}`);
  }
  console.log(`\nRelatório gravado em: ${OUTPUT_FILE}`);
  console.log('Nenhuma alteração feita no banco.');
}

main()
  .catch((e) => {
    console.error('Erro no diagnóstico:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
