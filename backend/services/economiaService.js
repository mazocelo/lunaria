import prisma from '../prisma/prisma.js';
import { calcularPrecoVenda, LIMITES_EQUIP } from '../helpers/economiaHelper.js';

function resolverTabelas(sistema) {
  if (sistema === 'tresdet') {
    return {
      tabelaItens: 'itens_tresdet',
      tabelaInventario: 'personagem_item_tresdet',
      campoPreco: 'preco_moedas',
      campoItemFk: 'item_id',
    };
  }
  return {
    tabelaItens: 'equipamentos',
    tabelaInventario: 'personagem_equipamento',
    campoPreco: 'preco',
    campoItemFk: 'equipamento_id',
  };
}

function criarErro(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

export async function processarCompra(personagemId, itemId, quantidade, sistema) {
  const { tabelaItens, tabelaInventario, campoPreco, campoItemFk } = resolverTabelas(sistema);

  return prisma.$transaction(async (tx) => {
    const personagem = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { id: true, moedas: true },
    });
    if (!personagem) throw criarErro(404, 'Personagem não encontrado');

    const item = await tx[tabelaItens].findUnique({ where: { id: itemId } });
    if (!item) throw criarErro(404, 'Item não encontrado');

    const custo = item[campoPreco] * quantidade;
    if (personagem.moedas < custo) {
      throw criarErro(400, `Saldo insuficiente: ${personagem.moedas} moedas, custo: ${custo}`);
    }

    await tx.personagens.update({
      where: { id: personagemId },
      data: { moedas: { decrement: custo } },
    });

    const inventarioExistente = await tx[tabelaInventario].findUnique({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
    });

    if (inventarioExistente) {
      await tx[tabelaInventario].update({
        where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
        data: { quantidade: { increment: quantidade } },
      });
    } else {
      await tx[tabelaInventario].create({
        data: { personagem_id: personagemId, [campoItemFk]: itemId, quantidade },
      });
    }

    const personagemAtualizado = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { moedas: true },
    });

    return { moedas: personagemAtualizado.moedas, custo };
  });
}

export async function processarVenda(personagemId, itemId, quantidade, sistema) {
  const { tabelaItens, tabelaInventario, campoPreco, campoItemFk } = resolverTabelas(sistema);

  return prisma.$transaction(async (tx) => {
    const personagem = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { id: true, moedas: true },
    });
    if (!personagem) throw criarErro(404, 'Personagem não encontrado');

    const registro = await tx[tabelaInventario].findUnique({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
    });
    if (!registro) throw criarErro(404, 'Item não encontrado no inventário');
    if (registro.quantidade < quantidade) {
      throw criarErro(400, `Quantidade insuficiente: possui ${registro.quantidade}, tentando vender ${quantidade}`);
    }

    const item = await tx[tabelaItens].findUnique({ where: { id: itemId } });
    if (!item) throw criarErro(404, 'Item não encontrado no catálogo');

    const ganho = calcularPrecoVenda(item[campoPreco]) * quantidade;

    await tx.personagens.update({
      where: { id: personagemId },
      data: { moedas: { increment: ganho } },
    });

    if (registro.quantidade === quantidade) {
      await tx[tabelaInventario].delete({
        where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
      });
    } else {
      await tx[tabelaInventario].update({
        where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
        data: { quantidade: { decrement: quantidade } },
      });
    }

    const personagemAtualizado = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { moedas: true },
    });

    return { moedas: personagemAtualizado.moedas, ganho };
  });
}

export async function equiparItem(personagemId, itemId, sistema) {
  const { tabelaItens, tabelaInventario, campoItemFk } = resolverTabelas(sistema);

  return prisma.$transaction(async (tx) => {
    const personagem = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { id: true },
    });
    if (!personagem) throw criarErro(404, 'Personagem não encontrado');

    const registro = await tx[tabelaInventario].findUnique({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
    });
    if (!registro) throw criarErro(404, 'Item não encontrado no inventário');
    if (registro.equipado) throw criarErro(400, 'Item já está equipado');

    const item = await tx[tabelaItens].findUnique({ where: { id: itemId } });
    if (!item) throw criarErro(404, 'Item não encontrado no catálogo');

    // Normaliza tipo: equipamentos usa String[], itens_tresdet usa String
    const tipoNormalizado = Array.isArray(item.tipo) ? item.tipo[0] : item.tipo;
    const limite = LIMITES_EQUIP[tipoNormalizado] ?? null;

    if (limite === null) {
      throw criarErro(400, `Tipo de item desconhecido: ${tipoNormalizado}`);
    }
    if (limite === 0) {
      throw criarErro(400, `Itens do tipo ${tipoNormalizado} não podem ser equipados`);
    }

    const equipadosDoTipo = await tx[tabelaInventario].count({
      where: {
        personagem_id: personagemId,
        equipado: true,
        [campoItemFk]: {
          in: await tx[tabelaItens]
            .findMany({
              where: sistema === 'tresdet' ? { tipo: tipoNormalizado } : { tipo: { has: tipoNormalizado } },
              select: { id: true },
            })
            .then((rows) => rows.map((r) => r.id)),
        },
      },
    });

    if (equipadosDoTipo >= limite) {
      throw criarErro(400, `Limite de ${limite} item(ns) do tipo ${tipoNormalizado} já atingido`);
    }

    await tx[tabelaInventario].update({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
      data: { equipado: true },
    });

    return { equipado: true };
  });
}

export async function desequiparItem(personagemId, itemId, sistema) {
  const { tabelaInventario, campoItemFk } = resolverTabelas(sistema);

  return prisma.$transaction(async (tx) => {
    const personagem = await tx.personagens.findFirst({
      where: { id: personagemId, deleted_at: null },
      select: { id: true },
    });
    if (!personagem) throw criarErro(404, 'Personagem não encontrado');

    const registro = await tx[tabelaInventario].findUnique({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
    });
    if (!registro) throw criarErro(404, 'Item não encontrado no inventário');
    if (!registro.equipado) throw criarErro(400, 'Item não está equipado');

    await tx[tabelaInventario].update({
      where: { [`personagem_id_${campoItemFk}`]: { personagem_id: personagemId, [campoItemFk]: itemId } },
      data: { equipado: false },
    });

    return { equipado: false };
  });
}
