const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const categorias = [
  { id: 1, nome: 'Mortos-Vivos', icone: '💀', ordem: 1 },
  { id: 2, nome: 'Demonios e Diabos', icone: '😈', ordem: 2 },
  { id: 3, nome: 'Dragoes', icone: '🐉', ordem: 3 },
  { id: 4, nome: 'Constructos e Golems', icone: '⚙️', ordem: 4 },
  { id: 5, nome: 'Gigantes e Titas', icone: '🗿', ordem: 5 },
  { id: 6, nome: 'Aberracoes', icone: '👁️', ordem: 6 },
  { id: 7, nome: 'Fadas e Criaturas do Sylvaris', icone: '🧚', ordem: 7 },
  { id: 8, nome: 'Humanoides Monstruosos', icone: '👹', ordem: 8 },
  { id: 9, nome: 'Bestas e Animais Magicos', icone: '🦁', ordem: 9 },
  { id: 10, nome: 'Elementais e Genios', icone: '🔥', ordem: 10 },
  { id: 11, nome: 'Criaturas Miticas e Lendarias', icone: '⭐', ordem: 11 },
  { id: 12, nome: 'Mortos-Vivos Especiais', icone: '🧟', ordem: 12 },
  { id: 13, nome: 'Criaturas de Outros Planos', icone: '🌀', ordem: 13 },
  { id: 14, nome: 'Plantas e Criaturas da Natureza', icone: '🌿', ordem: 14 },
  { id: 15, nome: 'Criaturas Aquaticas', icone: '🌊', ordem: 15 },
  { id: 16, nome: 'Vermes e Criaturas Subterraneos', icone: '🪱', ordem: 16 },
  { id: 17, nome: 'Espiritos e Criaturas Incorporeas', icone: '👻', ordem: 17 },
  { id: 18, nome: 'Criaturas de Tempestade e Clima', icone: '⛈️', ordem: 18 },
];

// Mapeamento de tipos existentes para categoria
const tipoToCategoria = {
  'morto-vivo': 1,
  'undead': 1,
  'demonio': 2,
  'diabo': 2,
  'fiend': 2,
  'dragao': 3,
  'dragon': 3,
  'constructo': 4,
  'golem': 4,
  'construct': 4,
  'gigante': 5,
  'giant': 5,
  'aberracao': 6,
  'aberration': 6,
  'fada': 7,
  'fey': 7,
  'humanoide': 8,
  'humanoid': 8,
  'besta': 9,
  'beast': 9,
  'animal': 9,
  'elemental': 10,
  'genio': 10,
  'mitico': 11,
  'celestial': 11,
  'monstrosity': 11,
  'planta': 14,
  'plant': 14,
  'aquatico': 15,
  'ooze': 16,
  'swarm': 9,
};

(async () => {
  // Insert categorias
  for (const cat of categorias) {
    await p.categorias_monstro.upsert({
      where: { nome: cat.nome },
      update: { icone: cat.icone, ordem: cat.ordem },
      create: cat,
    });
  }
  console.log('18 categorias de monstro inseridas.');

  // List all monstros and their tipos
  const monstros = await p.monstros.findMany({ orderBy: { id: 'asc' } });
  console.log(`\n${monstros.length} monstros encontrados. Vinculando categorias...`);

  let linked = 0;
  let unlinked = [];

  for (const m of monstros) {
    let catId = null;

    // Check tipo array for matching category
    if (m.tipo && m.tipo.length > 0) {
      for (const t of m.tipo) {
        const key = t.toLowerCase().trim();
        if (tipoToCategoria[key]) {
          catId = tipoToCategoria[key];
          break;
        }
      }
    }

    if (catId) {
      await p.monstros.update({
        where: { id: m.id },
        data: { categoria_id: catId },
      });
      linked++;
    } else {
      unlinked.push(`${m.nome} (tipo: ${m.tipo?.join(', ') || 'nenhum'})`);
    }
  }

  console.log(`\nVinculados: ${linked}`);
  if (unlinked.length > 0) {
    console.log(`Sem categoria (${unlinked.length}):`);
    unlinked.forEach(u => console.log('  -', u));
  }

  // Save map for reference
  const fs = require('fs');
  const map = {};
  categorias.forEach(c => { map[c.nome] = c.id; });
  fs.writeFileSync(__dirname + '/categoria_monstro_map.json', JSON.stringify(map, null, 2));

  await p.$disconnect();
})();
