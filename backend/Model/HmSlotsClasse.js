const HmSlotsClasse = (prisma) => {
  const model = prisma.hm_slots_classe;
  return {
    async getSlots(classeId, nivel) {
      const row = await model.findUnique({
        where: { classe_id_nivel: { classe_id: classeId, nivel } }
      });
      return row?.slots || 0;
    },
    async getProgressao(classeId) {
      return model.findMany({ where: { classe_id: classeId }, orderBy: { nivel: 'asc' } });
    }
  };
};
export default HmSlotsClasse;
