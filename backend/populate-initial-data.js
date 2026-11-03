import { PrismaClient } from '@prisma/client';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const prisma = new PrismaClient();

/**
 * Converte arrays PostgreSQL (ARRAY['x', 'y']) para arrays JavaScript
 */
function parsePostgreSQLArray(str) {
  if (!str || str === 'NULL' || str === 'null') return null;
  
  // Remove ARRAY[ e ]
  const match = str.match(/ARRAY\[(.*?)\]/);
  if (!match) return null;
  
  const content = match[1];
  if (!content.trim()) return [];
  
  // Parse valores entre aspas simples
  const values = content.match(/'([^']*)'/g);
  if (!values) return [];
  
  return values.map(v => v.slice(1, -1)); // Remove aspas
}

/**
 * Converte JSON string para objeto JavaScript
 */
function parseJSON(str) {
  if (!str || str === 'NULL' || str === 'null' || str === "'null'") return null;
  
  // Remove ::jsonb ou ::json se existir
  str = str.replace(/::jsonb?/g, '');
  
  // Remove aspas simples externas se existirem
  if (str.startsWith("'") && str.endsWith("'")) {
    str = str.slice(1, -1);
    // Desfaz escape de aspas simples duplicadas
    str = str.replace(/''/g, "'");
  }
  
  try {
    return JSON.parse(str);
  } catch (e) {
    console.warn(`⚠️  Erro ao parsear JSON: ${str.substring(0, 50)}...`);
    return null;
  }
}

/**
 * Parseia um arquivo SQL e extrai dados dos INSERTs
 */
function parseSQLInsert(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const rows = [];
  
  // Remove comentários SQL (-- comentário)
  const lines = content.split('\n').filter(line => !line.trim().startsWith('--'));
  const cleanContent = lines.join('\n');
  
  // Encontra todos os INSERT INTO statements
  const insertMatch = cleanContent.match(/INSERT INTO\s+(?:public\.)?(\w+)\s*\(([^)]+)\)\s*VALUES/i);
  if (!insertMatch) {
    throw new Error(`Não foi possível encontrar INSERT statement em ${filePath}`);
  }
  
  const tableName = insertMatch[1];
  const columns = insertMatch[2].split(',').map(c => c.trim());
  
  // Extrai todas as linhas de valores
  const valuesMatch = cleanContent.match(/VALUES\s+(.+)/is);
  if (!valuesMatch) {
    throw new Error(`Não foi possível encontrar valores em ${filePath}`);
  }
  
  const valuesContent = valuesMatch[1].trim();
  
  // Parseia cada linha de valores
  // Usa uma abordagem mais robusta: encontra parênteses balanceados
  let currentRow = '';
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < valuesContent.length; i++) {
    const char = valuesContent[i];
    
    if (escapeNext) {
      currentRow += char;
      escapeNext = false;
      continue;
    }
    
    // Detecta aspas simples (PostgreSQL usa '' para escapar)
    if (char === "'") {
      // Verifica se é aspas duplicadas (escape)
      if (i + 1 < valuesContent.length && valuesContent[i + 1] === "'") {
        currentRow += "''";
        i++; // Pula o próximo caractere
        continue;
      }
      
      inString = !inString;
      currentRow += char;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      currentRow += char;
      continue;
    }
    
    if (!inString) {
      if (char === '(') {
        depth++;
        if (depth === 1) {
          // Início de nova linha
          currentRow = '';
          continue;
        }
      } else if (char === ')') {
        depth--;
        if (depth === 0) {
          // Linha completa
          const row = parseRowValues(currentRow, columns);
          if (row) rows.push(row);
          currentRow = '';
          // Pula vírgula e espaços após o parêntese
          while (i + 1 < valuesContent.length && (valuesContent[i + 1] === ',' || valuesContent[i + 1] === ' ' || valuesContent[i + 1] === '\n')) {
            i++;
          }
          continue;
        }
      }
    }
    
    if (depth > 0) {
      currentRow += char;
    }
  }
  
  return { tableName, columns, rows };
}

/**
 * Parseia uma linha de valores
 */
function parseRowValues(rowStr, columns) {
  const values = [];
  let currentValue = '';
  let depth = 0;
  let inString = false;
  let escapeNext = false;
  
  for (let i = 0; i < rowStr.length; i++) {
    const char = rowStr[i];
    
    if (escapeNext) {
      currentValue += char;
      escapeNext = false;
      continue;
    }
    
    // Detecta aspas simples (PostgreSQL usa '' para escapar)
    if (char === "'") {
      // Verifica se é aspas duplicadas (escape)
      if (i + 1 < rowStr.length && rowStr[i + 1] === "'") {
        currentValue += "''";
        i++; // Pula o próximo caractere
        continue;
      }
      
      inString = !inString;
      currentValue += char;
      continue;
    }
    
    if (char === '\\' && inString) {
      escapeNext = true;
      currentValue += char;
      continue;
    }
    
    if (!inString) {
      if (char === '(' || char === '[') {
        depth++;
        currentValue += char;
        continue;
      } else if (char === ')' || char === ']') {
        depth--;
        currentValue += char;
        continue;
      } else if (char === ',' && depth === 0) {
        // Valor completo
        values.push(parseValue(currentValue.trim()));
        currentValue = '';
        // Pula espaços após vírgula
        while (i + 1 < rowStr.length && (rowStr[i + 1] === ' ' || rowStr[i + 1] === '\n')) {
          i++;
        }
        continue;
      }
    }
    
    currentValue += char;
  }
  
  // Último valor
  if (currentValue.trim()) {
    values.push(parseValue(currentValue.trim()));
  }
  
  // Cria objeto com chaves das colunas
  const row = {};
  columns.forEach((col, index) => {
    if (values[index] !== undefined) {
      row[col] = values[index];
    }
  });
  
  return row;
}

/**
 * Parseia um valor individual
 */
function parseValue(value) {
  value = value.trim();
  
  // NULL
  if (value === 'NULL' || value === 'null') {
    return null;
  }
  
  // String com aspas simples
  if (value.startsWith("'") && value.endsWith("'")) {
    let str = value.slice(1, -1);
    // Desfaz escape de aspas simples duplicadas (PostgreSQL usa '' para escapar)
    str = str.replace(/''/g, "'");
    // Remove escapes de barra invertida
    str = str.replace(/\\'/g, "'");
    return str;
  }
  
  // Array PostgreSQL
  if (value.includes('ARRAY[')) {
    return parsePostgreSQLArray(value);
  }
  
  // JSON (pode ter ::jsonb ou ::json)
  if (value.includes('{') || value.includes('[') || value.includes('::json')) {
    return parseJSON(value);
  }
  
  // Número
  if (/^-?\d+$/.test(value)) {
    return parseInt(value, 10);
  }
  
  // String sem aspas (não deveria acontecer, mas...)
  return value;
}

/**
 * Limpa todas as tabelas na ordem inversa de dependências
 */
async function clearAllTables() {
  console.log('🧹 Limpando todas as tabelas...');
  
  try {
    // Ordem inversa de dependências
    await prisma.personagem_desvantagem.deleteMany({});
    await prisma.personagem_equipamento.deleteMany({});
    await prisma.personagem_vantagem.deleteMany({});
    await prisma.historias_personagens.deleteMany({});
    await prisma.historias_convite.deleteMany({});
    await prisma.personagens.deleteMany({});
    await prisma.desvantagens.deleteMany({});
    await prisma.vantagens.deleteMany({});
    await prisma.racas.deleteMany({});
    await prisma.classes.deleteMany({});
    await prisma.temas.deleteMany({});
    
    console.log('✅ Tabelas limpas com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao limpar tabelas:', error);
    throw error;
  }
}

/**
 * Seed de Temas
 */
async function seedTemas() {
  console.log('📚 Inserindo temas...');
  
  const queryPath = join(__dirname, '..', 'Query', 'INSERT temas.sql');
  const { rows } = parseSQLInsert(queryPath);
  
  let count = 0;
  for (const row of rows) {
    try {
      await prisma.temas.create({
        data: {
          id: row.id,
          nome: row.nome,
          descricao: row.descricao
        }
      });
      count++;
    } catch (error) {
      console.error(`❌ Erro ao inserir tema ${row.id} (${row.nome}):`, error.message);
    }
  }
  
  console.log(`✅ ${count} temas inseridos!`);
  return count;
}

/**
 * Seed de Classes
 */
async function seedClasses() {
  console.log('⚔️  Inserindo classes...');
  
  const queryPath = join(__dirname, '..', 'Query', 'INSERT classe.sql');
  const { rows } = parseSQLInsert(queryPath);
  
  let count = 0;
  for (const row of rows) {
    try {
      const bonus = row.bonus ? parseJSON(row.bonus) : null;
      
      await prisma.classes.create({
        data: {
          id: row.id,
          nome: row.nome,
          descricao: row.descricao,
          custo: row.custo,
          bonus: bonus ? JSON.stringify(bonus) : null
        }
      });
      count++;
    } catch (error) {
      console.error(`❌ Erro ao inserir classe ${row.id} (${row.nome}):`, error.message);
    }
  }
  
  console.log(`✅ ${count} classes inseridas!`);
  return count;
}

/**
 * Seed de Raças
 */
async function seedRacas() {
  console.log('🧬 Inserindo raças...');
  
  const queryPath = join(__dirname, '..', 'Query', 'INSERT raça.sql');
  const { rows } = parseSQLInsert(queryPath);
  
  let count = 0;
  for (const row of rows) {
    try {
      const bonus = row.bonus ? parseJSON(row.bonus) : null;
      
      await prisma.racas.create({
        data: {
          id: row.id,
          nome: row.nome,
          descricao: row.descricao,
          custo: row.custo,
          bonus: bonus ? JSON.stringify(bonus) : null
        }
      });
      count++;
    } catch (error) {
      console.error(`❌ Erro ao inserir raça ${row.id} (${row.nome}):`, error.message);
    }
  }
  
  console.log(`✅ ${count} raças inseridas!`);
  return count;
}

/**
 * Seed de Vantagens
 */
async function seedVantagens() {
  console.log('✨ Inserindo vantagens...');
  
  const queryPath = join(__dirname, '..', 'Query', 'INSERT vantagens.sql');
  const { rows } = parseSQLInsert(queryPath);
  
  let count = 0;
  for (const row of rows) {
    try {
      await prisma.vantagens.create({
        data: {
          nome: row.nome,
          descricao: row.descricao,
          custo: row.custo || 0,
          tipo: row.tipo || [],
          bonus: row.bonus,
          restricao: row.restricao,
          dano_base: row.dano_base,
          efeito: row.efeito,
          usar: row.usar,
          elemento: row.elemento || [],
          nivel: row.nivel || 1,
          requisitos: row.requisitos
        }
      });
      count++;
    } catch (error) {
      console.error(`❌ Erro ao inserir vantagem "${row.nome}":`, error.message);
    }
  }
  
  console.log(`✅ ${count} vantagens inseridas!`);
  return count;
}

/**
 * Seed de Desvantagens
 */
async function seedDesvantagens() {
  console.log('⚠️  Inserindo desvantagens...');
  
  const queryPath = join(__dirname, '..', 'Query', 'INSERT desvantagem.sql');
  const { rows } = parseSQLInsert(queryPath);
  
  let count = 0;
  for (const row of rows) {
    try {
      await prisma.desvantagens.create({
        data: {
          nome: row.nome,
          descricao: row.descricao,
          custo: row.custo || 0,
          tipo: row.tipo || [],
          bonus: row.bonus,
          restricao: row.restricao,
          dano_base: row.dano_base,
          efeito: row.efeito,
          usar: row.usar,
          elemento: row.elemento || [],
          nivel: row.nivel || 1,
          requisitos: row.requisitos
        }
      });
      count++;
    } catch (error) {
      console.error(`❌ Erro ao inserir desvantagem "${row.nome}":`, error.message);
    }
  }
  
  console.log(`✅ ${count} desvantagens inseridas!`);
  return count;
}

/**
 * Função principal
 */
async function main() {
  console.log('🚀 Iniciando seed do banco de dados...\n');
  
  try {
    // Limpar todas as tabelas
    await clearAllTables();
    console.log('');
    
    // Inserir dados na ordem correta
    await seedTemas();
    console.log('');
    
    await seedClasses();
    console.log('');
    
    await seedRacas();
    console.log('');
    
    await seedVantagens();
    console.log('');
    
    await seedDesvantagens();
    console.log('');
    
    console.log('🎉 Seed concluído com sucesso!');
  } catch (error) {
    console.error('❌ Erro durante o seed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Executa o seed
main();

