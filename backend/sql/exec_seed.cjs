const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Conectado. Executando seed...');
  const sql = fs.readFileSync(__dirname + '/seed_equipamentos.sql', 'utf8');
  await client.query(sql);
  const res = await client.query('SELECT COUNT(*) as total FROM equipamentos');
  console.log('Total equipamentos:', res.rows[0].total);
  const sample = await client.query(`
    SELECT e.nome, r.nome as raridade, c.nome as categoria
    FROM equipamentos e
    LEFT JOIN raridades r ON e.raridade_id = r.id
    LEFT JOIN categorias_equipamento c ON e.categoria_id = c.id
    LIMIT 5
  `);
  sample.rows.forEach(r => console.log(' -', r.nome, '|', r.raridade, '|', r.categoria));
  await client.end();
  console.log('Seed executado com sucesso!');
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
