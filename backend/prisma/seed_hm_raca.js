/**
 * Seed hm_raca — vincula habilidades raciais às suas raças (Lunaria).
 * Uso: node prisma/seed_hm_raca.js
 *
 * Decisão D4 do modelo híbrido H&M: `hm_raca` é a FONTE DE VERDADE das
 * habilidades raciais. Este seed DECLARA os vínculos [habilidade, raça]
 * explicitamente — a partir do arquivo de dados versionado
 * `habilidades_completas.js` (entradas com `raca_id`), e NÃO derivando da
 * coluna legada `habilidades_magias.raca_id` lida do banco.
 *
 * Idempotente: usa upsert pela chave única @@unique([habilidade_id, raca_id]).
 * Rodar duas vezes não duplica linha.
 */
import { PrismaClient } from '@prisma/client';
import habilidades from './habilidades_completas.js';

const prisma = new PrismaClient();

/**
 * Declaração explícita dos vínculos raciais: cada habilidade do catálogo de
 * dados que possui `raca_id` é uma habilidade racial. (nome, raca_id) é a
 * fonte da declaração; o seed resolve para os ids reais do banco.
 */
const VINCULOS_RACIAIS = habilidades
  .filter((h) => h.raca_id != null)
  .map((h) => ({ habilidade: h.nome, raca_id: h.raca_id }));

async function main() {
  if (VINCULOS_RACIAIS.length === 0) {
    console.log('hm_raca: nenhum vínculo racial declarado.');
    return;
  }

  const antes = await prisma.hm_raca.count();

  let vinculados = 0;
  const semHabilidade = [];
  const semRaca = [];

  for (const { habilidade, raca_id } of VINCULOS_RACIAIS) {
    const hab = await prisma.habilidades_magias.findUnique({
      where: { nome_sistema: { nome: habilidade, sistema: 'lunaria' } },
      select: { id: true },
    });
    if (!hab) {
      semHabilidade.push(habilidade);
      continue;
    }

    const raca = await prisma.racas.findUnique({ where: { id: raca_id }, select: { id: true } });
    if (!raca) {
      semRaca.push({ habilidade, raca_id });
      continue;
    }

    await prisma.hm_raca.upsert({
      where: { habilidade_id_raca_id: { habilidade_id: hab.id, raca_id } },
      create: { habilidade_id: hab.id, raca_id },
      update: {},
    });
    vinculados++;
  }

  const depois = await prisma.hm_raca.count();

  console.log(`hm_raca: ${vinculados} vínculos declarados aplicados (de ${VINCULOS_RACIAIS.length}).`);
  if (semHabilidade.length > 0) {
    console.warn(`  ${semHabilidade.length} habilidade(s) racial(is) ausente(s) no catálogo: ${semHabilidade.join(', ')}`);
  }
  if (semRaca.length > 0) {
    console.warn(`  ${semRaca.length} raça(s) ausente(s): ${semRaca.map((r) => `${r.habilidade}→raca ${r.raca_id}`).join(', ')}`);
  }
  console.log(`Total hm_raca no banco: ${antes} → ${depois}.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
