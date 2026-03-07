const { Client } = require('pg');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Conectado.');

  // 1. Seed raridades
  console.log('\n1. Inserindo raridades...');
  const raridades = [
    { nome: 'Comum',      cor: 'gray',   ordem: 1 },
    { nome: 'Incomum',     cor: 'green',  ordem: 2 },
    { nome: 'Raro',        cor: 'blue',   ordem: 3 },
    { nome: 'Muito Raro',  cor: 'purple', ordem: 4 },
    { nome: 'Epico',       cor: 'orange', ordem: 5 },
    { nome: 'Lendario',    cor: 'amber',  ordem: 6 },
    { nome: 'Artefato',    cor: 'red',    ordem: 7 },
    { nome: 'Variavel',    cor: 'slate',  ordem: 8 },
  ];

  for (const r of raridades) {
    await client.query(
      'INSERT INTO raridades (nome, cor, ordem) VALUES ($1, $2, $3) ON CONFLICT (nome) DO NOTHING',
      [r.nome, r.cor, r.ordem]
    );
  }
  const rarRes = await client.query('SELECT id, nome FROM raridades ORDER BY ordem');
  console.log('   Raridades:', rarRes.rows.map(r => r.id + ':' + r.nome).join(', '));

  const rarMap = {};
  rarRes.rows.forEach(r => { rarMap[r.nome.toLowerCase()] = r.id; });

  // 2. Seed categorias_equipamento
  console.log('\n2. Inserindo categorias...');
  const categorias = [
    { nome: 'Espadas e Laminas',                    icone: 'swords',  ordem: 1 },
    { nome: 'Machados, Martelos e Contundentes',    icone: 'hammer',  ordem: 2 },
    { nome: 'Lancas, Alabardas e Armas de Haste',   icone: 'trident', ordem: 3 },
    { nome: 'Armas de Alcance',                     icone: 'bow',     ordem: 4 },
    { nome: 'Armaduras e Escudos',                  icone: 'shield',  ordem: 5 },
    { nome: 'Aneis Magicos',                        icone: 'ring',    ordem: 6 },
    { nome: 'Amuletos e Colares',                   icone: 'amulet',  ordem: 7 },
    { nome: 'Cajados, Varinhas e Orbes',            icone: 'wand',    ordem: 8 },
    { nome: 'Pocoes e Elixires',                    icone: 'potion',  ordem: 9 },
    { nome: 'Itens de Uso e Ferramentas Magicas',   icone: 'tools',   ordem: 10 },
    { nome: 'Artefatos Lendarios',                  icone: 'crown',   ordem: 11 },
    { nome: 'Miscelanea Magica',                    icone: 'sparkle', ordem: 12 },
  ];

  for (const c of categorias) {
    await client.query(
      'INSERT INTO categorias_equipamento (nome, icone, ordem) VALUES ($1, $2, $3) ON CONFLICT (nome) DO NOTHING',
      [c.nome, c.icone, c.ordem]
    );
  }
  const catRes = await client.query('SELECT id, nome FROM categorias_equipamento ORDER BY ordem');
  console.log('   Categorias:', catRes.rows.map(c => c.id + ':' + c.nome).join(', '));

  const catMap = {};
  catRes.rows.forEach(c => { catMap[c.nome] = c.id; });

  // 3. Update monstros - set all to comum (old column was dropped)
  console.log('\n3. Atualizando monstros raridade_id...');
  await client.query('UPDATE monstros SET raridade_id = $1 WHERE raridade_id IS NULL', [rarMap['comum']]);
  const moCount = await client.query('SELECT COUNT(*) as c FROM monstros WHERE raridade_id IS NOT NULL');
  console.log('   Monstros atualizados:', moCount.rows[0].c);

  // Save maps for generate_seed.cjs
  const fs = require('fs');
  fs.writeFileSync('raridade_map.json', JSON.stringify(rarMap));
  fs.writeFileSync('categoria_map.json', JSON.stringify(catMap));
  console.log('\n   Mapas salvos em raridade_map.json e categoria_map.json');

  // 4. Verify
  const eqCount = await client.query('SELECT COUNT(*) as c FROM equipamentos');
  console.log('\n4. Equipamentos atuais:', eqCount.rows[0].c, '(precisam re-seed com FKs)');

  await client.end();
  console.log('\nPronto! Agora regenerar seed com FKs.');
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
