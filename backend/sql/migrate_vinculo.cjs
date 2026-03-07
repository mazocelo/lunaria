const { Client } = require('pg');
const fs = require('fs');

async function run() {
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  console.log('Conectado ao banco.');

  // 1. Add vinculo column
  console.log('1. Adicionando coluna vinculo...');
  await client.query('ALTER TABLE public.equipamentos ADD COLUMN IF NOT EXISTS vinculo JSONB');
  console.log('   OK');

  // 2. Drop old columns
  console.log('2. Removendo colunas sintonizacao e sintonizacao_restricao...');
  await client.query('ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS sintonizacao');
  await client.query('ALTER TABLE public.equipamentos DROP COLUMN IF EXISTS sintonizacao_restricao');
  console.log('   OK');

  // 3. Re-seed
  console.log('3. Executando seed SQL...');
  const sql = fs.readFileSync('seed_equipamentos.sql', 'utf8');
  await client.query(sql);
  console.log('   OK');

  // 4. Verify
  const res = await client.query('SELECT COUNT(*) as total FROM public.equipamentos');
  console.log('Total equipamentos:', res.rows[0].total);

  const vincRes = await client.query("SELECT COUNT(*) as total FROM public.equipamentos WHERE vinculo IS NOT NULL");
  console.log('Com vinculo:', vincRes.rows[0].total);

  // Sample
  const sample = await client.query("SELECT nome, vinculo FROM public.equipamentos WHERE vinculo IS NOT NULL LIMIT 3");
  sample.rows.forEach(r => console.log(' -', r.nome, ':', JSON.stringify(r.vinculo)));

  await client.end();
  console.log('\nMigracao concluida!');
}
run().catch(e => { console.error('ERRO:', e.message); process.exit(1); });
