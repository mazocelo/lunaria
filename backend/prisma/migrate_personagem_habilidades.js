/**
 * Migração: popula hm_personagem para personagens existentes.
 * Uso: node prisma/migrate_personagem_habilidades.js
 *
 * Para cada personagem:
 *  1. Insere habilidades raciais (origem: "racial")
 *  2. Se raça permite magia (pode_magia): seleciona magias aleatórias até preencher slots do nível 1 (origem: "criacao")
 *  3. Insere técnicas de combate da classe com nivel_requerido <= nivel do personagem (origem: "criacao")
 *
 * Idempotente: usa skipDuplicates no createMany (unique constraint em [personagem_id, habilidade_id]).
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function shuffleAndTake(array, count) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}

async function main() {
  // Busca personagens ativos (soft delete filter via middleware)
  const personagens = await prisma.personagens.findMany({
    select: { id: true, classe_id: true, raca_id: true, nivel: true },
  });

  if (personagens.length === 0) {
    console.log('Nenhum personagem encontrado. Nada a migrar.');
    return;
  }

  console.log(`Encontrados ${personagens.length} personagens para migrar.\n`);

  // Pré-carrega dados de referência
  const [racas, habilidadesRaciais, slotsClasse, habilidadesClasse, existentes] = await Promise.all([
    prisma.racas.findMany({ select: { id: true, pode_magia: true } }),
    prisma.hm_raca.findMany({ select: { habilidade_id: true, raca_id: true } }),
    prisma.hm_slots_classe.findMany({ select: { classe_id: true, nivel: true, slots: true } }),
    prisma.hm_classe.findMany({
      include: {
        habilidades_magias: {
          select: { id: true, nivel_requerido: true, escola_magia: true },
        },
      },
    }),
    prisma.hm_personagem.findMany({ select: { personagem_id: true, habilidade_id: true } }),
  ]);

  // Set de vínculos já existentes para idempotência
  const existenteSet = new Set(existentes.map(e => `${e.personagem_id}:${e.habilidade_id}`));

  // Mapas de lookup
  const racaMap = new Map(racas.map(r => [r.id, r]));

  const raciaisPorRaca = new Map();
  for (const hr of habilidadesRaciais) {
    if (!raciaisPorRaca.has(hr.raca_id)) raciaisPorRaca.set(hr.raca_id, []);
    raciaisPorRaca.get(hr.raca_id).push(hr.habilidade_id);
  }

  const slotsPorClasseNivel = new Map();
  for (const s of slotsClasse) {
    slotsPorClasseNivel.set(`${s.classe_id}:${s.nivel}`, s.slots);
  }

  // Agrupa habilidades de classe com seus detalhes
  const habClasseMap = new Map();
  for (const hc of habilidadesClasse) {
    if (!habClasseMap.has(hc.classe_id)) habClasseMap.set(hc.classe_id, []);
    habClasseMap.get(hc.classe_id).push(hc.habilidades_magias);
  }

  // Conta magias já vinculadas por personagem (para não exceder slots)
  const magiasExistentesPorPersonagem = new Map();
  for (const e of existentes) {
    // Precisamos saber se é magia; só contamos as que não são raciais
    // Para simplificar: contamos todas as existentes do personagem (exceto raciais que serão skipDuplicates)
    if (!magiasExistentesPorPersonagem.has(e.personagem_id)) {
      magiasExistentesPorPersonagem.set(e.personagem_id, new Set());
    }
    magiasExistentesPorPersonagem.get(e.personagem_id).add(e.habilidade_id);
  }

  const allBindings = [];

  const addBinding = (personagem_id, habilidade_id, origem) => {
    const key = `${personagem_id}:${habilidade_id}`;
    if (existenteSet.has(key)) return false;
    existenteSet.add(key);
    allBindings.push({ personagem_id, habilidade_id, origem });
    return true;
  };

  for (const p of personagens) {
    const nivel = p.nivel ?? 1;

    // 1. Habilidades raciais
    if (p.raca_id != null) {
      const raciais = raciaisPorRaca.get(p.raca_id) ?? [];
      for (const habId of raciais) {
        addBinding(p.id, habId, 'racial');
      }
    }

    if (p.classe_id == null) continue;

    const habsDaClasse = habClasseMap.get(p.classe_id) ?? [];

    const isMagia = (h) => h.escola_magia != null && h.escola_magia !== 'nenhuma';
    const isTecnica = (h) => !isMagia(h);

    // 2. Magias (se raça permite magia)
    const raca = p.raca_id != null ? racaMap.get(p.raca_id) : null;
    const podeMagia = raca?.pode_magia ?? true;

    if (podeMagia) {
      const slots = slotsPorClasseNivel.get(`${p.classe_id}:1`) ?? 0;

      if (slots > 0) {
        // Conta magias já vinculadas a este personagem
        const habsExistentes = magiasExistentesPorPersonagem.get(p.id) ?? new Set();
        const magiasJaVinculadas = habsDaClasse.filter(h => isMagia(h) && habsExistentes.has(h.id)).length;
        const slotsRestantes = Math.max(0, slots - magiasJaVinculadas);

        if (slotsRestantes > 0) {
          const magiasDisponiveis = habsDaClasse.filter(
            h => isMagia(h) && h.nivel_requerido <= 1 && !habsExistentes.has(h.id)
          );
          const selecionadas = shuffleAndTake(magiasDisponiveis, slotsRestantes);

          for (const hab of selecionadas) {
            addBinding(p.id, hab.id, 'criacao');
          }
        }
      }
    }

    // 3. Técnicas de combate
    const tecnicas = habsDaClasse.filter(h => isTecnica(h) && h.nivel_requerido <= nivel);
    for (const hab of tecnicas) {
      addBinding(p.id, hab.id, 'criacao');
    }
  }

  if (allBindings.length === 0) {
    console.log('Nenhum vínculo novo a criar (todos já existem).');
  } else {
    const BATCH = 500;
    let created = 0;
    for (let i = 0; i < allBindings.length; i += BATCH) {
      const batch = allBindings.slice(i, i + BATCH);
      const result = await prisma.hm_personagem.createMany({
        data: batch,
        skipDuplicates: true,
      });
      created += result.count;
    }
    console.log(`hm_personagem: ${created} vínculos criados (de ${allBindings.length} preparados).\n`);
  }

  // Verificação: contagem agrupada por origem
  const countByOrigem = await prisma.$queryRaw`
    SELECT origem, COUNT(*)::int AS total
    FROM hm_personagem
    GROUP BY origem
    ORDER BY origem
  `;

  console.log('=== Resumo hm_personagem ===');
  let grandTotal = 0;
  for (const row of countByOrigem) {
    console.log(`  ${row.origem}: ${row.total}`);
    grandTotal += row.total;
  }
  console.log(`  TOTAL: ${grandTotal}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
