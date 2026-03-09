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
import Mestre from './Mestre.js';
import Monstro from './Monstro.js';
import SessaoJogo from './SessaoJogo.js';
import Elemento from './Elemento.js';
import Amizade from './Amizade.js';
import FeedPost from './FeedPost.js';
import PersonagemSessao from './PersonagemSessao.js';
import MonstroLoot from './MonstroLoot.js';

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
  Usuario: Usuario(prisma),
  Mestre: Mestre(prisma),
  Monstro: Monstro(prisma),
  SessaoJogo: SessaoJogo(prisma),
  Elemento: Elemento(prisma),
  Amizade: Amizade(prisma),
  FeedPost: FeedPost(prisma),
  PersonagemSessao: PersonagemSessao(prisma),
  MonstroLoot: MonstroLoot(prisma)
};

export default db;
