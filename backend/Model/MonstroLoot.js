/**
 * Modelo MonstroLoot - Tabela de loot dos monstros
 * Define quais equipamentos cada monstro pode dropar e com qual chance
 */
const MonstroLoot = (prisma) => {
  const model = prisma.monstro_loot;

  const methods = {
    async findByMonstroId(monstroId) {
      return await model.findMany({
        where: { monstro_id: monstroId },
        include: { equipamento: true }
      });
    },

    async findByMonstroIds(monstroIds) {
      return await model.findMany({
        where: { monstro_id: { in: monstroIds } },
        include: { equipamento: true }
      });
    },

    async create(data) {
      return await model.create({ data });
    },

    async update(id, data) {
      return await model.update({ where: { id }, data });
    },

    async delete(id) {
      return await model.delete({ where: { id } });
    },

    /**
     * Rola loot para um monstro especifico
     * Filtra por nivel minimo e rola contra drop_rate
     * @returns {Array} itens dropados [{equipamento_id, nome, quantidade, ...equipamento}]
     */
    async rolarLoot(monstroId, nivelJogador) {
      const entries = await model.findMany({
        where: {
          monstro_id: monstroId,
          nivel_minimo: { lte: nivelJogador }
        },
        include: { equipamento: true }
      });

      const drops = [];
      for (const entry of entries) {
        if (!entry.equipamento) continue;
        if (Math.random() < entry.drop_rate) {
          const min = entry.min_quantidade ?? 1;
          const max = entry.max_quantidade ?? 1;
          const quantidade = Math.floor(Math.random() * (max - min + 1)) + min;
          drops.push({
            equipamento_id: entry.equipamento_id,
            nome: entry.equipamento.nome,
            quantidade,
            tipo: entry.equipamento.tipo,
            bonus: entry.equipamento.bonus,
            raridade_id: entry.equipamento.raridade_id
          });
        }
      }
      return drops;
    }
  };

  return Object.assign(model, methods);
};

export default MonstroLoot;
