const HmPersonagem = (prisma) => {
  const model = prisma.hm_personagem;
  return {
    async findByPersonagem(personagemId) {
      return model.findMany({
        where: { personagem_id: personagemId },
        include: { habilidades_magias: true }
      });
    },
    async aprender(personagemId, habilidadeId, origem = 'criacao') {
      return model.upsert({
        where: { personagem_id_habilidade_id: { personagem_id: personagemId, habilidade_id: habilidadeId } },
        create: { personagem_id: personagemId, habilidade_id: habilidadeId, origem },
        update: { origem }
      });
    },
    async desaprender(personagemId, habilidadeId) {
      return model.deleteMany({ where: { personagem_id: personagemId, habilidade_id: habilidadeId } });
    },
    async contarMagias(personagemId) {
      return model.count({
        where: {
          personagem_id: personagemId,
          habilidades_magias: {
            AND: [
              { escola_magia: { not: 'nenhuma' } },
              { escola_magia: { not: null } }
            ]
          }
        }
      });
    }
  };
};
export default HmPersonagem;
