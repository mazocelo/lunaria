const HmClasse = (prisma) => {
  const model = prisma.hm_classe;
  return {
    async findByHabilidade(habilidadeId) {
      return model.findMany({ where: { habilidade_id: habilidadeId }, include: { classes: true } });
    },
    async findByClasse(classeId) {
      return model.findMany({ where: { classe_id: classeId }, include: { habilidades_magias: true } });
    },
    async vincular(habilidadeId, classeId) {
      return model.upsert({
        where: { habilidade_id_classe_id: { habilidade_id: habilidadeId, classe_id: classeId } },
        create: { habilidade_id: habilidadeId, classe_id: classeId },
        update: {}
      });
    },
    async desvincular(habilidadeId, classeId) {
      return model.deleteMany({ where: { habilidade_id: habilidadeId, classe_id: classeId } });
    }
  };
};
export default HmClasse;
