/**
 * Seed de habilidades V2 — popula a tabela habilidades com 350 skills enriquecidas.
 * Uso: node prisma/seed_habilidades.js
 */
import { PrismaClient } from '@prisma/client';
import habilidades from './habilidades_completas.js';

const prisma = new PrismaClient();

function buildData(hab) {
  return {
    nome: hab.nome,
    descricao: hab.descricao,
    custo_mana: hab.custo_mana,
    dano_base: hab.dano_base || null,
    tipo: hab.tipo,
    elemento: hab.elemento || null,
    nivel_requerido: hab.nivel_requerido,
    cooldown_turnos: hab.cooldown_turnos,
    classe_id: hab.classe_id || null,
    efeito: hab.efeito || null,
    alvo: hab.alvo,
    // V2 fields
    alcance: hab.alcance || 'medio',
    area_efeito: hab.area_efeito || null,
    tempo_conjuracao: hab.tempo_conjuracao || 'acao',
    usa_concentracao: hab.usa_concentracao ?? false,
    categoria: hab.categoria || 'combate_fisico',
    escola_magia: hab.escola_magia || null,
    escalamento: hab.escalamento || null,
    pre_requisito: hab.pre_requisito || null,
    raca_id: hab.raca_id || null,
    usos_por_descanso: hab.usos_por_descanso ?? null,
    componente_material: hab.componente_material || null,
    saving_throw: hab.saving_throw || null,
  };
}

async function main() {
  console.log(`Inserindo ${habilidades.length} habilidades (V2)...`);

  let inseridas = 0;
  let puladas = 0;

  for (const hab of habilidades) {
    try {
      const data = buildData(hab);
      await prisma.habilidades_magias.upsert({
        where: { nome_sistema: { nome: hab.nome, sistema: 'lunaria' } },
        create: { ...data, sistema: 'lunaria' },
        update: data,
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em "${hab.nome}":`, err.message);
      puladas++;
    }
  }

  console.log(`Concluído: ${inseridas} inseridas/atualizadas, ${puladas} com erro.`);

  const total = await prisma.habilidades_magias.count();
  console.log(`Total no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
