import sequelize from './Model/configDB.js';

/**
 * Script para corrigir índices duplicados da tabela de habilidades
 */
async function fixHabilidadesIndexes() {
  try {
    console.log('🔌 Conectando ao banco de dados...');
    
    // Testar conexão
    await sequelize.authenticate();
    console.log('✅ Conexão com banco de dados estabelecida com sucesso');
    
    // Remover índices duplicados
    console.log('🔄 Removendo índices duplicados...');
    
    try {
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key1"');
      await sequelize.query('DROP INDEX IF EXISTS "habilidade_nome_key2"');
      console.log('✅ Índices duplicados removidos');
    } catch (error) {
      console.log('ℹ️  Índices já não existem');
    }
    
    // Verificar índices restantes
    const indexes = await sequelize.query('SELECT indexname, indexdef FROM pg_indexes WHERE tablename = \'habilidade\'');
    console.log('📋 Índices da tabela habilidade após correção:');
    indexes[0].forEach(idx => {
      console.log(`   - ${idx.indexname}: ${idx.indexdef}`);
    });
    
    console.log('✅ Correção concluída');
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao corrigir índices:', error);
    process.exit(1);
  }
}

fixHabilidadesIndexes(); 