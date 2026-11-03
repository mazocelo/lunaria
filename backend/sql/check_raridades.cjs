const { Client } = require('pg');
async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  const eq = await client.query("SELECT DISTINCT raridade, COUNT(*) as c FROM equipamentos GROUP BY raridade ORDER BY c DESC");
  console.log('=== Raridades em EQUIPAMENTOS ===');
  eq.rows.forEach(r => console.log(' ', r.raridade, ':', r.c));
  const mo = await client.query("SELECT DISTINCT raridade, COUNT(*) as c FROM monstros GROUP BY raridade ORDER BY c DESC");
  console.log('\n=== Raridades em MONSTROS ===');
  mo.rows.forEach(r => console.log(' ', r.raridade, ':', r.c));
  const cat = await client.query("SELECT DISTINCT categoria, COUNT(*) as c FROM equipamentos GROUP BY categoria ORDER BY c DESC");
  console.log('\n=== Categorias em EQUIPAMENTOS ===');
  cat.rows.forEach(r => console.log(' ', r.categoria, ':', r.c));
  await client.end();
}
run().catch(e => console.error(e));
