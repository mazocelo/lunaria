import sequelize from './Model/configDB.js';
import db from './Model/index.js';

/**
 * Script para resetar completamente a tabela de habilidades
 */
async function resetHabilidadesTable() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    
    // Remover tabela existente
    console.log('🔄 Removendo tabela existente...');
    await sequelize.query('DROP TABLE IF EXISTS "habilidade" CASCADE');
    await sequelize.query('DROP TABLE IF EXISTS "habilidades" CASCADE');
    console.log('✅ Tabelas removidas');
    
    // Remover índices órfãos
    console.log('🔄 Removendo índices órfãos...');
    try {
      await sequelize.query('DROP INDEX IF EXISTS "idx_habilidade_nivel"');
      await sequelize.query('DROP INDEX IF EXISTS "idx_habilidade_usar"');
      await sequelize.query('DROP INDEX IF EXISTS "idx_habilidade_nome"');
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key"');
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key1"');
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key2"');
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key3"');
      console.log('✅ Índices removidos');
    } catch (error) {
      console.log('ℹ️  Índices já não existem');
    }
    
    // Criar tabela do zero
    console.log('🔄 Criando tabela habilidades...');
    await db.Habilidade.sync({ force: true });
    console.log('✅ Tabela habilidades criada com sucesso');

    // Verificar se a tabela foi criada
    const tables = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\' AND table_name = \'habilidades\'');
    const tableExists = tables[0] && tables[0].length > 0;
    console.log('📋 Tabela habilidades existe:', tableExists);
    
    if (tableExists) {
      // Verificar estrutura da tabela
      const columns = await sequelize.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = \'public\' AND table_name = \'habilidades\' ORDER BY ordinal_position');
      console.log('📋 Colunas da tabela habilidades:');
      if (columns[0]) {
        columns[0].forEach(col => {
          console.log(`   - ${col.column_name}: ${col.data_type}`);
        });
      }
      
      // Verificar índices
      const indexes = await sequelize.query('SELECT indexname, indexdef FROM pg_indexes WHERE tablename = \'habilidades\'');
      console.log('📋 Índices da tabela habilidades:');
      if (indexes[0]) {
        indexes[0].forEach(idx => {
          console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
        });
      }
    }
    
    console.log('✅ Reset concluído com sucesso');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao resetar tabela habilidades:', error);
    process.exit(1);
  }
}

resetHabilidadesTable(); 