// seed_tresdet_classes.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const CLASSES = [
  { nome: 'Guerreiro', descricao: 'Especialista em armas e combate. +1 em testes de Força em combate.', custo: 1, nivel: 1, tipo: ['classe'], usar: 0 },
  { nome: 'Mago', descricao: 'Estudioso das artes arcanas. Acesso a magias variadas. +2 PM.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Clérigo', descricao: 'Devoto de uma divindade. Magia Branca básica e cura.', custo: 1, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Paladino', descricao: 'Cavaleiro sagrado. Combate divino com Código de Honra dos Heróis incluso.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Bárbaro', descricao: 'Guerreiro selvagem. Fúria concede +1F e -1A temporário por 1d turnos.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 1 },
  { nome: 'Druida', descricao: 'Guardião da natureza. Magia Natural e Forma de Fera menor.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Ladino', descricao: 'Mestre da furtividade. Ataque Furtivo: +2 dano em alvos surpresos.', custo: 1, nivel: 1, tipo: ['classe', 'furtivo'], usar: 0 },
  { nome: 'Bardo', descricao: 'Artista e inspirador. Aliados próximos ganham +1 em testes por 1d turnos.', custo: 1, nivel: 1, tipo: ['classe', 'suporte'], usar: 1 },
  { nome: 'Ranger', descricao: 'Caçador e explorador. Rastreamento e bônus em combate à distância em terreno natural.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Monge', descricao: 'Mestre do corpo e da mente. Combate Desarmado com F+1 e Deflexão.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Assassino', descricao: 'Mestre da morte silenciosa. Ataque Furtivo aprimorado: +3 dano + uso de venenos.', custo: 2, nivel: 1, tipo: ['classe', 'furtivo'], usar: 0 },
  { nome: 'Necromante', descricao: 'Senhor dos mortos. Magia Negra e capacidade de animar 1 morto-vivo aliado.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Ninja', descricao: 'Guerreiro das sombras. Invisibilidade curta (1 turno) e Ataque Furtivo.', custo: 2, nivel: 1, tipo: ['classe', 'furtivo'], usar: 1 },
  { nome: 'Samurai', descricao: 'Guerreiro honrado do oriente. +1F com espadas. Código de Honra de Combate incluso.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Cavaleiro', descricao: 'Guerreiro montado. +1F quando montado. Montaria inclusa como Aliado.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Pirata', descricao: 'Aventureiro dos mares. Combate Naval e perícias de Crime.', custo: 1, nivel: 1, tipo: ['classe', 'social'], usar: 0 },
  { nome: 'Alquimista', descricao: 'Mestre de poções e transmutações. Cria itens consumíveis com efeitos variados.', custo: 2, nivel: 1, tipo: ['classe', 'crafting'], usar: 0 },
  { nome: 'Inventor', descricao: 'Gênio mecânico. Criação e conserto de máquinas, artefatos e engenhocas.', custo: 1, nivel: 1, tipo: ['classe', 'crafting'], usar: 0 },
  { nome: 'Elementalista', descricao: 'Mago especializado em um elemento. Magia Elemental com +1 em Focus de 1 elemento.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Gladiador', descricao: 'Lutador de arena. Bônus em arenas e coliseus. A torcida o fortalece.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Swashbuckler', descricao: 'Espadachim acrobático. +1H em combate com espadas leves e esgrima.', custo: 1, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Caçador de Monstros', descricao: 'Especialista em criaturas sobrenaturais. +2 dano contra monstros e rastreamento.', custo: 2, nivel: 1, tipo: ['classe', 'combate'], usar: 0 },
  { nome: 'Guerreiro Mágico', descricao: 'Combate e magia unidos. Combate com F+1 e acesso a 1 escola de magia.', custo: 3, nivel: 1, tipo: ['classe', 'combate', 'magico'], usar: 0 },
  { nome: 'Bruxo', descricao: 'Conjurador com pacto sombrio. Magias de Maldição e vínculo com entidade poderosa.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Feiticeiro', descricao: 'Mago nato. Conjura magias instintivamente sem estudo, mas repertório limitado.', custo: 2, nivel: 1, tipo: ['classe', 'magico'], usar: 0 },
  { nome: 'Curandeiro', descricao: 'Especialista em cura. +2 PV recuperados com qualquer magia de cura.', custo: 1, nivel: 1, tipo: ['classe', 'suporte'], usar: 0 },
];

export async function seedTresdetClasses() {
  console.log(`Seeding ${CLASSES.length} 3D&T class vantagens...`);
  for (const c of CLASSES) {
    await prisma.vantagens.upsert({
      where: { nome_sistema: { nome: c.nome, sistema: 'tresdet' } },
      create: { ...c, subtipo: 'classe', sistema: 'tresdet' },
      update: { descricao: c.descricao, custo: c.custo, tipo: c.tipo, subtipo: 'classe', usar: c.usar },
    });
  }
  console.log(`Done: ${CLASSES.length} classes seeded.`);
}
