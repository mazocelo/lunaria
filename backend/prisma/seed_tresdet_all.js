import { seedTresdetRacas } from './seed_tresdet_racas.js';
import { seedTresdetClasses } from './seed_tresdet_classes.js';

async function runAll() {
  console.log('=== 3D&T Full Catalog Seed ===\n');
  await seedTresdetRacas();
  await seedTresdetClasses();
  console.log('\nNote: Run seed_tresdet_vantagens.js and seed_tresdet_desvantagens.js separately.');
  console.log('\n=== Done ===');
  process.exit(0);
}

runAll().catch(e => { console.error(e); process.exit(1); });
