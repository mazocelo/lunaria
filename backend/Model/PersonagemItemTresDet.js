const PersonagemItemTresDet = (prisma) => {
  const model = prisma.personagem_item_tresdet;

  return {
    listarInventario: (personagemId) => model.findMany({
      where: { personagem_id: personagemId },
      include: { item: true },
      orderBy: { item: { nome: 'asc' } }
    }),

    buscar: (personagemId, itemId) => model.findUnique({
      where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
      include: { item: true }
    }),

    upsertQuantidade: (personagemId, itemId, incremento) =>
      model.upsert({
        where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
        create: { personagem_id: personagemId, item_id: itemId, quantidade: incremento },
        update: { quantidade: { increment: incremento } }
      }),

    atualizarEquipado: (personagemId, itemId, equipado) =>
      model.update({
        where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } },
        data: { equipado }
      }),

    remover: (personagemId, itemId) =>
      model.delete({
        where: { personagem_id_item_id: { personagem_id: personagemId, item_id: itemId } }
      }),

    contarEquipados: (personagemId, tipo) =>
      model.count({
        where: {
          personagem_id: personagemId,
          equipado: true,
          item: { tipo }
        }
      }),
  };
};

export default PersonagemItemTresDet;
