/**
 * Seed 3D&T pericias — popula a tabela vantagens com pericias do sistema 3D&T Alpha.
 * Pericias sao um tipo especial de vantagem com tipo=['pericia'].
 * Cada pericia tambem gera uma entrada de especializacao (tipo=['especializacao'], custo=1).
 * Uso: node prisma/seed_tresdet_pericias.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const pericias = [
  {
    nome: 'Animais',
    descricao: 'Conhecimento sobre criaturas, domesticacao e cuidados com animais.',
    efeito: { especializacoes: ['Doma', 'Montaria', 'Tratamento', 'Treinamento', 'Veterinária'] },
  },
  {
    nome: 'Arte',
    descricao: 'Talento artistico em diversas formas de expressao criativa.',
    efeito: { especializacoes: ['Atuação', 'Falsificação', 'Fotografia', 'Instrumentos Musicais', 'Prestidigitação', 'Redação', 'Canto', 'Culinária', 'Dança', 'Desenho', 'Escultura', 'Pintura', 'Joalheria'] },
  },
  {
    nome: 'Ciência',
    descricao: 'Conhecimento cientifico amplo em diversas areas do saber.',
    efeito: { especializacoes: ['Astronomia', 'Biologia', 'Ciências Proibidas', 'Geografia', 'História', 'Meteorologia', 'Psicologia', 'Antropologia', 'Arqueologia', 'Criminalística', 'Ecologia', 'Genética', 'Literatura', 'Metalografia', 'Química'] },
  },
  {
    nome: 'Crime',
    descricao: 'Habilidades relacionadas a atividades furtivas e ilegais.',
    efeito: { especializacoes: ['Armadilhas', 'Arrombamento', 'Criptografia', 'Disfarce', 'Falsificação', 'Furtividade'] },
  },
  {
    nome: 'Esporte',
    descricao: 'Aptidao fisica e habilidades atleticas diversas.',
    efeito: { especializacoes: ['Acrobacia', 'Alpinismo', 'Arquearia', 'Corrida', 'Jogos', 'Mergulho', 'Natação', 'Pilotagem', 'Arremesso', 'Artes Marciais', 'Boxe', 'Caça', 'Parkour', 'Pesca', 'Paraquedismo', 'Salto'] },
  },
  {
    nome: 'Idiomas',
    descricao: 'Conhecimento de linguas e formas de comunicacao.',
    efeito: { especializacoes: ['Código Morse', 'Linguagem de Sinais', 'Inglês', 'Francês', 'Italiano', 'Alemão', 'Espanhol'] },
  },
  {
    nome: 'Investigação',
    descricao: 'Capacidade de encontrar pistas, interrogar e rastrear.',
    efeito: { especializacoes: ['Armadilhas', 'Arrombamento', 'Criptografia', 'Disfarce', 'Falsificação', 'Furtividade', 'Interrogatório', 'Intimidação', 'Leitura Labial', 'Rastreio'] },
  },
  {
    nome: 'Máquinas',
    descricao: 'Conhecimento tecnico para operar, construir e consertar equipamentos.',
    efeito: { especializacoes: ['Armadilhas', 'Computação', 'Condução', 'Eletrônica', 'Engenharia', 'Mecânica', 'Pilotagem'] },
  },
  {
    nome: 'Manipulação',
    descricao: 'Habilidade de influenciar, convencer e controlar outras pessoas.',
    efeito: { especializacoes: ['Hipnose', 'Interrogatório', 'Intimidação', 'Lábia', 'Sedução'] },
  },
  {
    nome: 'Medicina',
    descricao: 'Conhecimento medico para diagnosticar e tratar ferimentos e doencas.',
    efeito: { especializacoes: ['Cirurgia', 'Diagnose', 'Primeiros Socorros', 'Psiquiatria', 'Veterinária'] },
  },
  {
    nome: 'Sobrevivência',
    descricao: 'Habilidades para sobreviver em ambientes selvagens e hostis.',
    efeito: { especializacoes: ['Alpinismo', 'Armadilhas', 'Arquearia', 'Furtividade', 'Meteorologia', 'Navegação', 'Pesca', 'Rastreio'] },
  },
];

async function main() {
  const registros = [];

  for (const p of pericias) {
    // Pericia completa (2 pts)
    registros.push({
      nome: p.nome,
      descricao: p.descricao,
      custo: 2,
      nivel: 1,
      tipo: ['pericia'],
      usar: 0,
      efeito: p.efeito,
      subtipo: null,
      sistema: 'tresdet',
    });

    // Especializacao bundle (1 pt, 3 specs)
    registros.push({
      nome: `${p.nome} (Especialização)`,
      descricao: `Escolha 3 especializações de ${p.nome}: ${p.efeito.especializacoes.join(', ')}.`,
      custo: 1,
      nivel: 1,
      tipo: ['especializacao'],
      usar: 0,
      efeito: p.efeito,
      subtipo: p.nome,
      sistema: 'tresdet',
    });
  }

  console.log(`Inserindo ${registros.length} pericias/especializacoes 3D&T...`);

  let inseridas = 0;
  let erros = 0;

  for (const r of registros) {
    try {
      await prisma.vantagens.upsert({
        where: { nome_sistema: { nome: r.nome, sistema: 'tresdet' } },
        create: r,
        update: {
          descricao: r.descricao,
          custo: r.custo,
          nivel: r.nivel,
          tipo: r.tipo,
          usar: r.usar,
          efeito: r.efeito,
          subtipo: r.subtipo,
        },
      });
      inseridas++;
    } catch (err) {
      console.error(`Erro em "${r.nome}":`, err.message);
      erros++;
    }
  }

  console.log(`Pericias 3D&T: ${inseridas} inseridas/atualizadas, ${erros} com erro.`);

  const total = await prisma.vantagens.count({ where: { sistema: 'tresdet', tipo: { hasSome: ['pericia', 'especializacao'] } } });
  console.log(`Total pericias+especializacoes 3D&T no banco: ${total}`);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
