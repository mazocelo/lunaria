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
import HabilidadeMagia from './HabilidadeMagia.js';
import HmClasse from './HmClasse.js';
import HmRaca from './HmRaca.js';
import HmPersonagem from './HmPersonagem.js';
import HmSlotsClasse from './HmSlotsClasse.js';
import ItensTresDet from './ItensTresDet.js';
import PersonagemItemTresDet from './PersonagemItemTresDet.js';

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
  MonstroLoot: MonstroLoot(prisma),
  HabilidadeMagia: HabilidadeMagia(prisma),
  HmClasse: HmClasse(prisma),
  HmRaca: HmRaca(prisma),
  HmPersonagem: HmPersonagem(prisma),
  HmSlotsClasse: HmSlotsClasse(prisma),
  ItensTresDet: ItensTresDet(prisma),
  PersonagemItemTresDet: PersonagemItemTresDet(prisma),
  // Legacy alias — remover quando todas as referências forem atualizadas
  get Habilidade() { return this.HabilidadeMagia; },
};

export default db;
