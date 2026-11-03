/**
 * Seed de Crafting — popula ingredientes, ferramentas e receitas.
 * Uso: node prisma/seed_crafting.js
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ─── INGREDIENTES (64) ───────────────────────────────────────

const ingredientes = [
  { id: 1,  nome: "Frasco de Vidro",       tipo: "material",       raridade_id: 1, preco_base: 2,    peso: 0.2,  icone: "🧪" },
  { id: 2,  nome: "Frasco Reforçado",      tipo: "material",       raridade_id: 2, preco_base: 10,   peso: 0.3,  icone: "🧪" },
  { id: 3,  nome: "Frasco Dourado",        tipo: "material",       raridade_id: 4, preco_base: 100,  peso: 0.3,  icone: "✨" },
  { id: 4,  nome: "Ampola de Gás",         tipo: "material",       raridade_id: 2, preco_base: 15,   peso: 0.2,  icone: "💨" },
  { id: 5,  nome: "Ampola Reforçada",      tipo: "material",       raridade_id: 3, preco_base: 50,   peso: 0.3,  icone: "💨" },
  { id: 6,  nome: "Pó de Enxofre",         tipo: "quimico",        raridade_id: 1, preco_base: 3,    peso: 0.1,  icone: "🔥" },
  { id: 7,  nome: "Ácido Concentrado",     tipo: "quimico",        raridade_id: 2, preco_base: 20,   peso: 0.3,  icone: "☠️" },
  { id: 8,  nome: "Pó Metálico",           tipo: "quimico",        raridade_id: 2, preco_base: 15,   peso: 0.2,  icone: "⚙️" },
  { id: 9,  nome: "Pólvora Negra",         tipo: "quimico",        raridade_id: 2, preco_base: 12,   peso: 0.3,  icone: "💣" },
  { id: 10, nome: "Pólvora Comprimida",    tipo: "quimico",        raridade_id: 3, preco_base: 30,   peso: 0.2,  icone: "💣" },
  { id: 11, nome: "Pó de Fumaça",          tipo: "quimico",        raridade_id: 1, preco_base: 5,    peso: 0.1,  icone: "🌫️" },
  { id: 12, nome: "Carcaça de Vidro",      tipo: "material",       raridade_id: 1, preco_base: 3,    peso: 0.1,  icone: "🔮" },
  { id: 13, nome: "Carcaça de Metal",      tipo: "material",       raridade_id: 2, preco_base: 10,   peso: 0.3,  icone: "🔩" },
  { id: 14, nome: "Erva Curativa",         tipo: "erva",           raridade_id: 1, preco_base: 5,    peso: 0.05, icone: "🌿" },
  { id: 15, nome: "Essência de Fogo",      tipo: "essencia",       raridade_id: 2, preco_base: 25,   peso: 0.1,  icone: "🔥" },
  { id: 16, nome: "Essência Arcana",       tipo: "essencia",       raridade_id: 3, preco_base: 50,   peso: 0.1,  icone: "💜" },
  { id: 17, nome: "Cristal de Gelo",       tipo: "mineral",        raridade_id: 2, preco_base: 20,   peso: 0.2,  icone: "❄️" },
  { id: 18, nome: "Cristal Arcano",        tipo: "mineral",        raridade_id: 3, preco_base: 80,   peso: 0.2,  icone: "💎" },
  { id: 19, nome: "Cristal de Energia",    tipo: "mineral",        raridade_id: 3, preco_base: 60,   peso: 0.2,  icone: "⚡" },
  { id: 20, nome: "Cristal Ressonante",    tipo: "mineral",        raridade_id: 3, preco_base: 70,   peso: 0.2,  icone: "📡" },
  { id: 21, nome: "Cristal Celestial",     tipo: "mineral",        raridade_id: 14, preco_base: 500,  peso: 0.3,  icone: "🌟" },
  { id: 22, nome: "Fragmento Elemental",   tipo: "essencia",       raridade_id: 4, preco_base: 200,  peso: 0.1,  icone: "🌀" },
  { id: 23, nome: "Lágrima de Fênix",      tipo: "essencia",       raridade_id: 14, preco_base: 1000, peso: 0.05, icone: "🔥" },
  { id: 24, nome: "Orvalho Lunar",         tipo: "essencia",       raridade_id: 4, preco_base: 150,  peso: 0.05, icone: "🌙" },
  { id: 25, nome: "Orvalho Noturno",       tipo: "essencia",       raridade_id: 3, preco_base: 40,   peso: 0.05, icone: "🌑" },
  { id: 26, nome: "Veneno de Víbora",      tipo: "orgao_monstro",  raridade_id: 2, preco_base: 15,   peso: 0.1,  icone: "🐍" },
  { id: 27, nome: "Veneno de Cobra-Rei",   tipo: "orgao_monstro",  raridade_id: 3, preco_base: 40,   peso: 0.1,  icone: "🐍" },
  { id: 28, nome: "Veneno de Aranha",      tipo: "orgao_monstro",  raridade_id: 2, preco_base: 20,   peso: 0.1,  icone: "🕷️" },
  { id: 29, nome: "Sangue de Touro",       tipo: "orgao_monstro",  raridade_id: 1, preco_base: 8,    peso: 0.2,  icone: "🩸" },
  { id: 30, nome: "Pétala de Sombra",      tipo: "erva",           raridade_id: 3, preco_base: 35,   peso: 0.02, icone: "🌸" },
  { id: 31, nome: "Erva Sagrada",          tipo: "erva",           raridade_id: 2, preco_base: 15,   peso: 0.05, icone: "🌿" },
  { id: 32, nome: "Erva Alucinógena",      tipo: "erva",           raridade_id: 2, preco_base: 12,   peso: 0.05, icone: "🍄" },
  { id: 33, nome: "Raiz de Força",         tipo: "erva",           raridade_id: 2, preco_base: 10,   peso: 0.1,  icone: "🌱" },
  { id: 34, nome: "Runa de Fogo",          tipo: "mistico",        raridade_id: 3, preco_base: 45,   peso: 0.05, icone: "🔥" },
  { id: 35, nome: "Material Diverso",      tipo: "material",       raridade_id: 1, preco_base: 1,    peso: 0.5,  icone: "📦" },
  { id: 36, nome: "Água Benta",            tipo: "mistico",        raridade_id: 2, preco_base: 25,   peso: 0.3,  icone: "💧" },
  { id: 37, nome: "Sal Abençoado",         tipo: "mistico",        raridade_id: 2, preco_base: 15,   peso: 0.2,  icone: "🧂" },
  { id: 38, nome: "Pó de Prata",           tipo: "mineral",        raridade_id: 2, preco_base: 20,   peso: 0.1,  icone: "🥈" },
  { id: 39, nome: "Prata Líquida",         tipo: "mineral",        raridade_id: 3, preco_base: 50,   peso: 0.2,  icone: "🥈" },
  { id: 40, nome: "Corrente de Prata",     tipo: "material",       raridade_id: 2, preco_base: 30,   peso: 0.5,  icone: "⛓️" },
  { id: 41, nome: "Engrenagem de Aço",     tipo: "material",       raridade_id: 2, preco_base: 15,   peso: 0.3,  icone: "⚙️" },
  { id: 42, nome: "Engrenagem Leve",       tipo: "material",       raridade_id: 2, preco_base: 12,   peso: 0.1,  icone: "⚙️" },
  { id: 43, nome: "Engrenagem Mestra",     tipo: "material",       raridade_id: 4, preco_base: 200,  peso: 0.5,  icone: "⚙️" },
  { id: 44, nome: "Mola de Tensão",        tipo: "material",       raridade_id: 2, preco_base: 10,   peso: 0.1,  icone: "🔧" },
  { id: 45, nome: "Pistão Hidráulico",     tipo: "material",       raridade_id: 3, preco_base: 60,   peso: 0.5,  icone: "🔧" },
  { id: 46, nome: "Placa de Aço",          tipo: "material",       raridade_id: 2, preco_base: 20,   peso: 1.0,  icone: "🛡️" },
  { id: 47, nome: "Asa Mecânica",          tipo: "material",       raridade_id: 3, preco_base: 50,   peso: 0.3,  icone: "🦅" },
  { id: 48, nome: "Tubo de Bronze",        tipo: "material",       raridade_id: 2, preco_base: 25,   peso: 0.8,  icone: "🔫" },
  { id: 49, nome: "Caldeira Portátil",     tipo: "material",       raridade_id: 3, preco_base: 80,   peso: 2.0,  icone: "♨️" },
  { id: 50, nome: "Bobina de Tesla",       tipo: "material",       raridade_id: 3, preco_base: 90,   peso: 0.5,  icone: "⚡" },
  { id: 51, nome: "Esqueleto de Aço",      tipo: "material",       raridade_id: 4, preco_base: 300,  peso: 5.0,  icone: "🦾" },
  { id: 52, nome: "Núcleo de Energia",     tipo: "mineral",        raridade_id: 4, preco_base: 250,  peso: 0.5,  icone: "⚡" },
  { id: 53, nome: "Lente Arcana",          tipo: "material",       raridade_id: 4, preco_base: 350,  peso: 0.3,  icone: "🔭" },
  { id: 54, nome: "Circuito Mestre",       tipo: "material",       raridade_id: 14, preco_base: 500,  peso: 0.2,  icone: "💠" },
  { id: 55, nome: "Munição Comum",         tipo: "material",       raridade_id: 1, preco_base: 1,    peso: 0.05, icone: "🏹" },
  { id: 56, nome: "Munição de Chumbo",     tipo: "material",       raridade_id: 1, preco_base: 2,    peso: 0.1,  icone: "🔫" },
  { id: 57, nome: "Munição Pesada",        tipo: "material",       raridade_id: 2, preco_base: 10,   peso: 0.5,  icone: "💣" },
  { id: 58, nome: "Flecha Comum",          tipo: "material",       raridade_id: 1, preco_base: 1,    peso: 0.05, icone: "🏹" },
  { id: 59, nome: "Shuriken de Aço",       tipo: "material",       raridade_id: 1, preco_base: 3,    peso: 0.05, icone: "⭐" },
  { id: 60, nome: "Espinhos de Ferro",     tipo: "material",       raridade_id: 1, preco_base: 5,    peso: 0.3,  icone: "📌" },
  { id: 61, nome: "Corda Resistente",      tipo: "material",       raridade_id: 1, preco_base: 3,    peso: 0.5,  icone: "🪢" },
  { id: 62, nome: "Barril de Madeira",     tipo: "material",       raridade_id: 1, preco_base: 5,    peso: 3.0,  icone: "🪵" },
  { id: 63, nome: "Rum Pirata",            tipo: "material",       raridade_id: 1, preco_base: 5,    peso: 0.5,  icone: "🍺" },
  { id: 64, nome: "Símbolo Sagrado",       tipo: "mistico",        raridade_id: 2, preco_base: 25,   peso: 0.2,  icone: "✝️" },
];

// ─── FERRAMENTAS (8) ─────────────────────────────────────────

const ferramentas = [
  { id: 1, nome: "Kit de Alquimia",    tipo: "kit",     preco_base: 50,  peso: 3.0,  classe_id: 1 },
  { id: 2, nome: "Kit de Venenos",      tipo: "kit",     preco_base: 50,  peso: 1.5,  classe_id: 3 },
  { id: 3, nome: "Bancada de Inventor", tipo: "bancada", preco_base: 100, peso: 10.0, classe_id: 23 },
  { id: 4, nome: "Kit de Ferreiro",     tipo: "kit",     preco_base: 75,  peso: 8.0,  classe_id: null },
  { id: 5, nome: "Kit de Herbalismo",   tipo: "kit",     preco_base: 30,  peso: 1.5,  classe_id: null },
  { id: 6, nome: "Kit de Armadilhas",   tipo: "kit",     preco_base: 40,  peso: 2.0,  classe_id: null },
  { id: 7, nome: "Kit de Caçador",      tipo: "kit",     preco_base: 60,  peso: 3.0,  classe_id: 6 },
  { id: 8, nome: "Kit de Navegação",    tipo: "kit",     preco_base: 40,  peso: 2.0,  classe_id: 18 },
];

// ─── RECEITAS (34) ────────────────────────────────────────────

const receitas = [
  { id: 1,  nome: "Receita: Bomba Alquímica",         categoria: "bomba",     habilidade_id: 1,   classe_id: 1,    nivel_requerido: 1,  dificuldade: 10, tempo_fabricacao: 1,  tempo_fora_combate: 10,   ingredientes: [{ id: 1, qtd: 1 }, { id: 6, qtd: 1 }],                             ferramentas: [1] },
  { id: 2,  nome: "Receita: Elixir de Cura",          categoria: "pocao",     habilidade_id: 2,   classe_id: 1,    nivel_requerido: 1,  dificuldade: 12, tempo_fabricacao: 2,  tempo_fora_combate: 15,   ingredientes: [{ id: 14, qtd: 2 }, { id: 1, qtd: 1 }],                            ferramentas: [1] },
  { id: 3,  nome: "Receita: Frasco de Ácido",         categoria: "bomba",     habilidade_id: 3,   classe_id: 1,    nivel_requerido: 3,  dificuldade: 14, tempo_fabricacao: 2,  tempo_fora_combate: 20,   ingredientes: [{ id: 7, qtd: 1 }, { id: 2, qtd: 1 }],                             ferramentas: [1] },
  { id: 4,  nome: "Receita: Poção de Potência",       categoria: "pocao",     habilidade_id: 4,   classe_id: 1,    nivel_requerido: 3,  dificuldade: 14, tempo_fabricacao: 2,  tempo_fora_combate: 20,   ingredientes: [{ id: 15, qtd: 1 }, { id: 29, qtd: 1 }, { id: 1, qtd: 1 }],       ferramentas: [1] },
  { id: 5,  nome: "Receita: Nuvem Tóxica",            categoria: "bomba",     habilidade_id: 5,   classe_id: 1,    nivel_requerido: 5,  dificuldade: 16, tempo_fabricacao: 2,  tempo_fora_combate: 25,   ingredientes: [{ id: 26, qtd: 2 }, { id: 4, qtd: 1 }],                            ferramentas: [1] },
  { id: 6,  nome: "Receita: Transmutação Defensiva",   categoria: "pocao",     habilidade_id: 6,   classe_id: 1,    nivel_requerido: 5,  dificuldade: 16, tempo_fabricacao: 2,  tempo_fora_combate: 25,   ingredientes: [{ id: 8, qtd: 2 }, { id: 16, qtd: 1 }],                            ferramentas: [1] },
  { id: 7,  nome: "Receita: Bomba de Congelamento",    categoria: "bomba",     habilidade_id: 7,   classe_id: 1,    nivel_requerido: 8,  dificuldade: 18, tempo_fabricacao: 3,  tempo_fora_combate: 30,   ingredientes: [{ id: 17, qtd: 2 }, { id: 1, qtd: 1 }],                            ferramentas: [1] },
  { id: 8,  nome: "Receita: Elixir da Imortalidade",  categoria: "pocao",     habilidade_id: 8,   classe_id: 1,    nivel_requerido: 10, dificuldade: 22, tempo_fabricacao: 5,  tempo_fora_combate: 60,   ingredientes: [{ id: 23, qtd: 1 }, { id: 24, qtd: 1 }, { id: 3, qtd: 1 }],       ferramentas: [1] },
  { id: 9,  nome: "Receita: Explosão Primordial",     categoria: "bomba",     habilidade_id: 9,   classe_id: 1,    nivel_requerido: 12, dificuldade: 24, tempo_fabricacao: 5,  tempo_fora_combate: 60,   ingredientes: [{ id: 22, qtd: 2 }, { id: 18, qtd: 1 }, { id: 5, qtd: 1 }],       ferramentas: [1] },
  { id: 10, nome: "Receita: Poção de Invisibilidade", categoria: "pocao",     habilidade_id: 281, classe_id: 1,    nivel_requerido: 5,  dificuldade: 16, tempo_fabricacao: 3,  tempo_fora_combate: 30,   ingredientes: [{ id: 30, qtd: 1 }, { id: 25, qtd: 1 }, { id: 1, qtd: 1 }],       ferramentas: [1] },
  { id: 11, nome: "Receita: Torreta Automática",      categoria: "engenhoca", habilidade_id: 219, classe_id: 23,   nivel_requerido: 1,  dificuldade: 12, tempo_fabricacao: 3,  tempo_fora_combate: 30,   ingredientes: [{ id: 41, qtd: 2 }, { id: 44, qtd: 1 }, { id: 19, qtd: 1 }],      ferramentas: [3] },
  { id: 12, nome: "Receita: Granada de Fragmentação", categoria: "bomba",     habilidade_id: 220, classe_id: 23,   nivel_requerido: 1,  dificuldade: 10, tempo_fabricacao: 1,  tempo_fora_combate: 10,   ingredientes: [{ id: 13, qtd: 1 }, { id: 9, qtd: 1 }],                            ferramentas: [3] },
  { id: 13, nome: "Receita: Armadura Mecânica",       categoria: "engenhoca", habilidade_id: 221, classe_id: 23,   nivel_requerido: 3,  dificuldade: 16, tempo_fabricacao: 5,  tempo_fora_combate: 120,  ingredientes: [{ id: 46, qtd: 3 }, { id: 41, qtd: 2 }, { id: 45, qtd: 2 }],      ferramentas: [3, 4] },
  { id: 14, nome: "Receita: Drone de Reconhecimento", categoria: "engenhoca", habilidade_id: 222, classe_id: 23,   nivel_requerido: 3,  dificuldade: 14, tempo_fabricacao: 3,  tempo_fora_combate: 45,   ingredientes: [{ id: 42, qtd: 2 }, { id: 20, qtd: 1 }, { id: 47, qtd: 1 }],      ferramentas: [3] },
  { id: 15, nome: "Receita: Canhão a Vapor",          categoria: "engenhoca", habilidade_id: 223, classe_id: 23,   nivel_requerido: 5,  dificuldade: 18, tempo_fabricacao: 5,  tempo_fora_combate: 90,   ingredientes: [{ id: 48, qtd: 1 }, { id: 49, qtd: 1 }, { id: 57, qtd: 3 }],      ferramentas: [3, 4] },
  { id: 16, nome: "Receita: Campo Elétrico",          categoria: "engenhoca", habilidade_id: 224, classe_id: 23,   nivel_requerido: 5,  dificuldade: 18, tempo_fabricacao: 3,  tempo_fora_combate: 60,   ingredientes: [{ id: 50, qtd: 1 }, { id: 19, qtd: 2 }],                           ferramentas: [3] },
  { id: 17, nome: "Receita: Golem Mecânico",          categoria: "engenhoca", habilidade_id: 225, classe_id: 23,   nivel_requerido: 8,  dificuldade: 22, tempo_fabricacao: 10, tempo_fora_combate: 480,  ingredientes: [{ id: 51, qtd: 1 }, { id: 18, qtd: 1 }, { id: 43, qtd: 1 }, { id: 52, qtd: 1 }], ferramentas: [3, 4] },
  { id: 18, nome: "Receita: Artilharia Orbital",      categoria: "engenhoca", habilidade_id: 226, classe_id: 23,   nivel_requerido: 12, dificuldade: 26, tempo_fabricacao: 15, tempo_fora_combate: 1440, ingredientes: [{ id: 53, qtd: 1 }, { id: 21, qtd: 1 }, { id: 54, qtd: 1 }],       ferramentas: [3] },
  { id: 19, nome: "Receita: Armadilha de Prata",      categoria: "armadilha", habilidade_id: 39,  classe_id: 6,    nivel_requerido: 1,  dificuldade: 12, tempo_fabricacao: 2,  tempo_fora_combate: 15,   ingredientes: [{ id: 40, qtd: 1 }, { id: 36, qtd: 1 }],                           ferramentas: [7] },
  { id: 20, nome: "Receita: Círculo de Proteção",     categoria: "armadilha", habilidade_id: 42,  classe_id: 6,    nivel_requerido: 8,  dificuldade: 18, tempo_fabricacao: 3,  tempo_fora_combate: 30,   ingredientes: [{ id: 37, qtd: 2 }, { id: 38, qtd: 2 }],                           ferramentas: [7] },
  { id: 21, nome: "Receita: Veneno de Prata",         categoria: "veneno",    habilidade_id: 295, classe_id: 6,    nivel_requerido: 3,  dificuldade: 14, tempo_fabricacao: 2,  tempo_fora_combate: 20,   ingredientes: [{ id: 39, qtd: 1 }, { id: 31, qtd: 1 }],                           ferramentas: [7] },
  { id: 22, nome: "Receita: Lâmina Envenenada",       categoria: "veneno",    habilidade_id: 18,  classe_id: 3,    nivel_requerido: 1,  dificuldade: 10, tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 26, qtd: 1 }],                                               ferramentas: [2] },
  { id: 23, nome: "Receita: Shuriken Venenosa",       categoria: "municao",   habilidade_id: 149, classe_id: 16,   nivel_requerido: 1,  dificuldade: 10, tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 59, qtd: 3 }, { id: 27, qtd: 1 }],                           ferramentas: [2] },
  { id: 24, nome: "Receita: Armadilha de Espinhos",   categoria: "armadilha", habilidade_id: 169, classe_id: 19,   nivel_requerido: 3,  dificuldade: 12, tempo_fabricacao: 2,  tempo_fora_combate: 15,   ingredientes: [{ id: 60, qtd: 3 }, { id: 61, qtd: 1 }],                           ferramentas: [6] },
  { id: 25, nome: "Receita: Tiro de Mosquete",        categoria: "municao",   habilidade_id: 161, classe_id: 18,   nivel_requerido: 1,  dificuldade: 8,  tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 56, qtd: 3 }],                                               ferramentas: [] },
  { id: 26, nome: "Receita: Grog de Coragem",         categoria: "pocao",     habilidade_id: 162, classe_id: 18,   nivel_requerido: 1,  dificuldade: 8,  tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 63, qtd: 1 }, { id: 33, qtd: 1 }],                           ferramentas: [] },
  { id: 27, nome: "Receita: Barril de Pólvora",       categoria: "bomba",     habilidade_id: 165, classe_id: 18,   nivel_requerido: 8,  dificuldade: 16, tempo_fabricacao: 3,  tempo_fora_combate: 30,   ingredientes: [{ id: 62, qtd: 1 }, { id: 9, qtd: 5 }],                            ferramentas: [] },
  { id: 28, nome: "Receita: Rum dos Mortos",          categoria: "pocao",     habilidade_id: 298, classe_id: 18,   nivel_requerido: 5,  dificuldade: 14, tempo_fabricacao: 2,  tempo_fora_combate: 15,   ingredientes: [{ id: 63, qtd: 1 }, { id: 32, qtd: 1 }],                           ferramentas: [] },
  { id: 29, nome: "Receita: Bomba de Fumaça",         categoria: "bomba",     habilidade_id: 138, classe_id: null, nivel_requerido: 1,  dificuldade: 8,  tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 11, qtd: 1 }, { id: 12, qtd: 1 }],                           ferramentas: [] },
  { id: 30, nome: "Receita: Veneno Paralisante",      categoria: "veneno",    habilidade_id: 250, classe_id: null, nivel_requerido: 3,  dificuldade: 14, tempo_fabricacao: 2,  tempo_fora_combate: 15,   ingredientes: [{ id: 28, qtd: 2 }],                                               ferramentas: [2] },
  { id: 31, nome: "Receita: Armadilha de Fogo",       categoria: "armadilha", habilidade_id: 330, classe_id: null, nivel_requerido: 5,  dificuldade: 16, tempo_fabricacao: 2,  tempo_fora_combate: 20,   ingredientes: [{ id: 34, qtd: 1 }, { id: 6, qtd: 2 }],                            ferramentas: [6] },
  { id: 32, nome: "Receita: Flecha Explosiva",        categoria: "municao",   habilidade_id: 279, classe_id: null, nivel_requerido: 5,  dificuldade: 14, tempo_fabricacao: 1,  tempo_fora_combate: 10,   ingredientes: [{ id: 58, qtd: 3 }, { id: 10, qtd: 1 }],                           ferramentas: [] },
  { id: 33, nome: "Receita: Armadilha Improvisada",   categoria: "armadilha", habilidade_id: 291, classe_id: null, nivel_requerido: 3,  dificuldade: 10, tempo_fabricacao: 1,  tempo_fora_combate: 5,    ingredientes: [{ id: 35, qtd: 3 }],                                               ferramentas: [] },
  { id: 34, nome: "Receita: Tiro Abençoado",          categoria: "municao",   habilidade_id: 41,  classe_id: 6,    nivel_requerido: 5,  dificuldade: 14, tempo_fabricacao: 1,  tempo_fora_combate: 10,   ingredientes: [{ id: 55, qtd: 3 }, { id: 36, qtd: 1 }],                           ferramentas: [7] },
];

// ─── SEED FUNCTIONS ──────────────────────────────────────────

async function seedIngredientes() {
  console.log(`Inserindo ${ingredientes.length} ingredientes...`);
  let ok = 0;
  for (const ing of ingredientes) {
    try {
      await prisma.ingredientes.upsert({
        where: { nome: ing.nome },
        create: { nome: ing.nome, tipo: ing.tipo, raridade_id: ing.raridade_id, preco_base: ing.preco_base, peso: ing.peso, icone: ing.icone },
        update: { tipo: ing.tipo, raridade_id: ing.raridade_id, preco_base: ing.preco_base, peso: ing.peso, icone: ing.icone },
      });
      ok++;
    } catch (err) {
      console.error(`  Erro ingrediente "${ing.nome}":`, err.message);
    }
  }
  console.log(`  ${ok}/${ingredientes.length} ingredientes OK`);
}

async function seedFerramentas() {
  console.log(`Inserindo ${ferramentas.length} ferramentas...`);
  let ok = 0;
  for (const fer of ferramentas) {
    try {
      await prisma.ferramentas.upsert({
        where: { nome: fer.nome },
        create: { nome: fer.nome, tipo: fer.tipo, preco_base: fer.preco_base, peso: fer.peso, classe_id: fer.classe_id },
        update: { tipo: fer.tipo, preco_base: fer.preco_base, peso: fer.peso, classe_id: fer.classe_id },
      });
      ok++;
    } catch (err) {
      console.error(`  Erro ferramenta "${fer.nome}":`, err.message);
    }
  }
  console.log(`  ${ok}/${ferramentas.length} ferramentas OK`);
}

async function seedReceitas() {
  console.log(`Inserindo ${receitas.length} receitas...`);

  // Build lookup maps: seed data id -> actual DB id (by nome)
  const dbIngredientes = await prisma.ingredientes.findMany();
  const dbFerramentas = await prisma.ferramentas.findMany();

  // Map from seed array index (id in seed data) to actual DB id
  const ingIdMap = new Map();
  for (const ing of ingredientes) {
    const dbIng = dbIngredientes.find(d => d.nome === ing.nome);
    if (dbIng) ingIdMap.set(ing.id, dbIng.id);
  }
  const ferIdMap = new Map();
  for (const fer of ferramentas) {
    const dbFer = dbFerramentas.find(d => d.nome === fer.nome);
    if (dbFer) ferIdMap.set(fer.id, dbFer.id);
  }

  let ok = 0;
  for (const rec of receitas) {
    try {
      const receita = await prisma.receitas.upsert({
        where: { nome: rec.nome },
        create: {
          nome: rec.nome,
          categoria: rec.categoria,
          habilidade_id: rec.habilidade_id,
          classe_id: rec.classe_id,
          nivel_requerido: rec.nivel_requerido,
          dificuldade: rec.dificuldade,
          tempo_fabricacao: rec.tempo_fabricacao,
          tempo_fora_combate: rec.tempo_fora_combate,
        },
        update: {
          categoria: rec.categoria,
          habilidade_id: rec.habilidade_id,
          classe_id: rec.classe_id,
          nivel_requerido: rec.nivel_requerido,
          dificuldade: rec.dificuldade,
          tempo_fabricacao: rec.tempo_fabricacao,
          tempo_fora_combate: rec.tempo_fora_combate,
        },
      });

      // Delete old pivots and recreate (cleaner than upsert for remapped IDs)
      await prisma.receita_ingrediente.deleteMany({ where: { receita_id: receita.id } });
      await prisma.receita_ferramenta.deleteMany({ where: { receita_id: receita.id } });

      // Insert ingredientes pivot with resolved DB IDs
      for (const ing of rec.ingredientes) {
        const dbId = ingIdMap.get(ing.id);
        if (!dbId) { console.error(`    Ingrediente seed id ${ing.id} não encontrado no DB`); continue; }
        await prisma.receita_ingrediente.create({
          data: { receita_id: receita.id, ingrediente_id: dbId, quantidade: ing.qtd },
        });
      }

      // Insert ferramentas pivot with resolved DB IDs
      for (const ferId of rec.ferramentas) {
        const dbId = ferIdMap.get(ferId);
        if (!dbId) { console.error(`    Ferramenta seed id ${ferId} não encontrada no DB`); continue; }
        await prisma.receita_ferramenta.create({
          data: { receita_id: receita.id, ferramenta_id: dbId },
        });
      }

      ok++;
    } catch (err) {
      console.error(`  Erro receita "${rec.nome}":`, err.message);
    }
  }
  console.log(`  ${ok}/${receitas.length} receitas OK`);
}

async function main() {
  console.log('=== SEED CRAFTING ===');
  await seedIngredientes();
  await seedFerramentas();
  await seedReceitas();

  const counts = {
    ingredientes: await prisma.ingredientes.count(),
    ferramentas: await prisma.ferramentas.count(),
    receitas: await prisma.receitas.count(),
    receita_ingrediente: await prisma.receita_ingrediente.count(),
    receita_ferramenta: await prisma.receita_ferramenta.count(),
  };
  console.log('\nTotais no banco:', counts);
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
