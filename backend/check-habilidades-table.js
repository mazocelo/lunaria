import sequelize from './Model/configDB.js';
import db from './Model/index.js';

/**
 * Script para verificar a estrutura da tabela de habilidades
 */
async function checkHabilidadesTable() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    
    // Verificar se a tabela existe
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'habilidade\'');
    console.log('📋 Tabela habilidade existe:', tables[0].length > 0);
    
    if (tables[0].length > 0) {
      // Verificar estrutura da tabela
      const columns = await sequelize.query('SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_schema = \'public\' AND table_name = \'habilidade\' ORDER BY ordinal_position');
      console.log('📋 Colunas da tabela habilidade:');
      columns[0].forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Verificar índices
      const indexes = await sequelize.query('SELECT indexname, indexdef FROM pg_indexes WHERE tablename = \'habilidade\'');
      console.log('📋 Índices da tabela habilidade:');
      indexes[0].forEach(idx => {
        console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
      });
    }
    
    console.log('✅ Verificação concluída');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao verificar tabela habilidades:', error);
    process.exit(1);
  }
}

checkHabilidadesTable(); 