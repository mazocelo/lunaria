/**
 * seed-demo.js — Cria dados mínimos para um "first playable" demo.
 *
 * Cria (via upsert): 1 tema, 1 raça, 1 classe, 1 usuário demo,
 * 1 personagem com atributos, 1 história com prólogo.
 *
 * Idempotente — pode rodar múltiplas vezes sem duplicar dados.
 *
 * Uso: node Backend/scripts/seed-demo.js
 *
 * Pré-requisito: DATABASE_URL configurado no .env
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('\n── seed-demo: criando dados mínimos ──\n');

  // 1. Tema
  const tema = await prisma.temas.upsert({
    where: { nome: 'Fantasia Medieval' },
    update: {},
    create: { nome: 'Fantasia Medieval', descricao: 'Reinos, dragões, magia e espadas' },
  });
  console.log(`  ✓ Tema: ${tema.nome} (id=${tema.id})`);

  // 2. Raça
  const raca = await prisma.racas.upsert({
    where: { nome: 'Humano' },
    update: {},
    create: { nome: 'Humano', descricao: 'Versáteis e adaptáveis', custo: 0 },
  });
  console.log(`  ✓ Raça: ${raca.nome} (id=${raca.id})`);

  // 3. Classe
  const classe = await prisma.classes.upsert({
    where: { nome: 'Guerreiro' },
    update: {},
    create: { nome: 'Guerreiro', descricao: 'Mestre do combate corpo a corpo', custo: 0 },
  });
  console.log(`  ✓ Classe: ${classe.nome} (id=${classe.id})`);

  // 4. Usuário demo
  const senhaHash = await bcrypt.hash('demo1234', 10);
  const usuario = await prisma.usuarios.upsert({
    where: { email: 'demo@lunaria.dev' },
    update: {},
    create: {
      nome: 'Demo Player',
      email: 'demo@lunaria.dev',
      senha: senhaHash,
      role: 'player',
    },
  });
  console.log(`  ✓ Usuário: ${usuario.nome} (id=${usuario.id}, email=${usuario.email})`);

  // 5. Personagem
  let personagem = await prisma.personagens.findFirst({
    where: { nome: 'Aldric', id_usuario: usuario.id, deleted_at: null },
    select: { id: true, nome: true, nivel: true, forca: true, destreza: true, constituicao: true, inteligencia: true, agilidade: true, carisma: true },
  });
  if (!personagem) {
    personagem = await prisma.personagens.create({
      data: {
        nome: 'Aldric',
        nivel: 3,
        id_usuario: usuario.id,
        raca_id: raca.id,
        classe_id: classe.id,
        forca: 14,
        destreza: 12,
        constituicao: 13,
        inteligencia: 10,
        agilidade: 11,
        carisma: 10,
        pontos_totais: 70,
        pontos_iniciais: 60,
        background: 'Um guerreiro veterano das fronteiras do norte, marcado por cicatrizes de batalha.',
      },
      select: { id: true, nome: true, nivel: true, forca: true, destreza: true, constituicao: true, inteligencia: true, agilidade: true, carisma: true },
    });
    console.log(`  ✓ Personagem: ${personagem.nome} (id=${personagem.id}) [criado]`);
  } else {
    console.log(`  ✓ Personagem: ${personagem.nome} (id=${personagem.id}) [já existia]`);
  }

  // 6. História com prólogo
  let historia = await prisma.historias.findFirst({
    where: { nome: 'A Cripta dos Reis Esquecidos', id_usuario: usuario.id, deleted_at: null },
    select: { id: true, nome: true },
  });
  if (!historia) {
    historia = await prisma.historias.create({
      data: {
        nome: 'A Cripta dos Reis Esquecidos',
        descricao: 'Uma aventura curta nas ruínas de uma cripta ancestral, onde segredos antigos aguardam os corajosos.',
        id_usuario: usuario.id,
        temas: [tema.id],
        maximo_de_participantes: 4,
        publica: true,
        prologo: `As tochas tremem nas paredes de pedra úmida enquanto vocês descem os degraus da Cripta dos Reis Esquecidos. O ar é denso, carregado de poeira e o cheiro de séculos de abandono. Segundo os pergaminhos encontrados na biblioteca da cidade, esta cripta abriga os restos dos antigos reis de Valdoria — e com eles, artefatos de poder inimaginável.\n\nO mercador que contratou vocês foi claro: "Tragam a Coroa de Ossos e serão recompensados com ouro suficiente para uma vida inteira." Mas os olhos dele traíam algo mais — medo, talvez. Ou ganância.\n\nAgora, diante de vocês, o corredor se divide em três passagens escuras. Da esquerda vem um som ritmado, como batidas de um coração gigante. Do centro, silêncio absoluto. Da direita, um brilho pálido e azulado pulsa fraco.\n\nO que vocês fazem?`,
      },
      select: { id: true, nome: true },
    });
    console.log(`  ✓ História: ${historia.nome} (id=${historia.id}) [criada]`);
  } else {
    console.log(`  ✓ História: ${historia.nome} (id=${historia.id}) [já existia]`);
  }

  // 7. Monstros demo (2 básicos)
  const monstrosDemo = [
    {
      nome: 'Esqueleto Guardião',
      descricao: 'Um esqueleto animado por magia necrótica, armado com espada enferrujada.',
      tipo: ['morto-vivo'],
      nivel_min: 1,
      nivel_max: 5,
      hp_base: 15,
      forca: 12,
      destreza: 10,
      constituicao: 10,
      inteligencia: 6,
      agilidade: 8,
      carisma: 3,
      ataque_base: 12,
      defesa_base: 10,
      dano_base: '1d6+2',
      elemento: ['necrotico'],
      xp_base: 50,
      tamanho: 'medio',
      habilidades: [
        { nome: 'Golpe de Espada', descricao: 'Ataque com espada enferrujada', tipo: 'ofensiva', dano: '1d6+2', efeito: null, cooldown: 0, chance: 70 },
      ],
      resistencias: { necrotico: 0.5 },
      imunidades: ['veneno'],
    },
    {
      nome: 'Aranha Sombria',
      descricao: 'Uma aranha do tamanho de um cão, com presas que gotejam veneno.',
      tipo: ['besta'],
      nivel_min: 1,
      nivel_max: 4,
      hp_base: 10,
      forca: 8,
      destreza: 14,
      constituicao: 8,
      inteligencia: 3,
      agilidade: 14,
      carisma: 2,
      ataque_base: 10,
      defesa_base: 6,
      dano_base: '1d4+1',
      elemento: ['veneno'],
      xp_base: 30,
      tamanho: 'pequeno',
      habilidades: [
        { nome: 'Mordida Venenosa', descricao: 'Mordida que pode envenenar', tipo: 'ofensiva', dano: '1d4+1', efeito: { nome: 'envenenado', duracao: 2, dano_por_turno: '1d4' }, cooldown: 2, chance: 40 },
      ],
      resistencias: {},
      imunidades: ['veneno'],
    },
  ];

  for (const m of monstrosDemo) {
    const existente = await prisma.monstros.findFirst({ where: { nome: m.nome }, select: { id: true, nome: true } });
    if (!existente) {
      const criado = await prisma.monstros.create({ data: m, select: { id: true, nome: true } });
      console.log(`  ✓ Monstro: ${criado.nome} (id=${criado.id}) [criado]`);
    } else {
      console.log(`  ✓ Monstro: ${existente.nome} (id=${existente.id}) [já existia]`);
    }
  }

  // Resumo
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  Demo seed completo!');
  console.log('');
  console.log('  Para jogar:');
  console.log(`    1. Login: POST /auth/login { email: "demo@lunaria.dev", senha: "demo1234" }`);
  console.log(`    2. Join room: WS authenticate → join_room({ roomId: "historia_${historia.id}", personagemId: ${personagem.id} })`);
  console.log(`    3. Start: POST /jogo/start { historiaId: ${historia.id} }`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((err) => {
    console.error('Erro no seed-demo:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
