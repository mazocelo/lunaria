import prisma from '../prisma/prisma.js';
import Historia from './Historia.js';
import Temas from './Temas.js';
import Personagem from './Personagem.js';
import Vantagem from './Vantagem.js';
import Desvantagem from './Desvantagem.js';
import Raca from './Raca.js';
import Classe from './Classe.js';
import Equipamento from './Equipamento.js';
import Usuario from './Usuario.js';

// Exportar o cliente Prisma e todos os modelos
const db = {
  prisma,
  Historia: Historia(prisma),
  Temas: Temas(prisma),
  Personagem: Personagem(prisma),
  Vantagem: Vantagem(prisma),
  Desvantagem: Desvantagem(prisma),
  Raca: Raca(prisma),
  Classe: Classe(prisma),
  Equipamento: Equipamento(prisma),
  Usuario: Usuario(prisma)
};

export default db;
