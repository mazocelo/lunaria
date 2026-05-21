const HmRaca = (prisma) => {
  const model = prisma.hm_raca;
  return {
    async findByRaca(racaId) {
      return model.findMany({ where: { raca_id: racaId }, include: { habilidades_magias: true } });
    },
    async vincular(habilidadeId, racaId) {
      return model.upsert({
        where: { habilidade_id_raca_id: { habilidade_id: habilidadeId, raca_id: racaId } },
        create: { habilidade_id: habilidadeId, raca_id: racaId },
        update: {}
      });
    }
  };
};
export default HmRaca;
