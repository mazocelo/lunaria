import db from '../../Model/index.js';
import {
  processarCompra,
  processarVenda,
  equiparItem,
  desequiparItem,
} from '../../services/economiaService.js';

function criarErro(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  return err;
}

async function obterSaldo(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const personagem = await db.prisma.personagens.findFirst({
    where: { id: personagemId, deleted_at: null },
    select: { id: true, moedas: true },
  });
  if (!personagem) throw criarErro(404, 'Personagem não encontrado');

  return res.json({ success: true, data: { moedas: personagem.moedas } });
}

async function obterInventario(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const personagem = await db.prisma.personagens.findFirst({
    where: { id: personagemId, deleted_at: null },
    select: { id: true, sistema: true },
  });
  if (!personagem) throw criarErro(404, 'Personagem não encontrado');

  let inventario;
  if (personagem.sistema === 'tresdet') {
    inventario = await db.prisma.personagem_item_tresdet.findMany({
      where: { personagem_id: personagemId },
      include: { item: true },
    });
  } else {
    inventario = await db.prisma.personagem_equipamento.findMany({
      where: { personagem_id: personagemId },
      include: { equipamentos: true },
    });
  }

  return res.json({ success: true, data: inventario });
}

async function comprar(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const { itemId, quantidade = 1, sistema } = req.body;
  if (!itemId || !sistema) throw criarErro(400, 'itemId e sistema são obrigatórios');

  const parsedItemId = parseInt(itemId, 10);
  const parsedQuantidade = parseInt(quantidade, 10);
  if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) throw criarErro(400, 'itemId inválido');
  if (!Number.isInteger(parsedQuantidade) || parsedQuantidade <= 0) throw criarErro(400, 'quantidade inválida');

  const resultado = await processarCompra(personagemId, parsedItemId, parsedQuantidade, sistema);
  return res.json({ success: true, data: resultado });
}

async function vender(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const { itemId, quantidade = 1, sistema } = req.body;
  if (!itemId || !sistema) throw criarErro(400, 'itemId e sistema são obrigatórios');

  const parsedItemId = parseInt(itemId, 10);
  const parsedQuantidade = parseInt(quantidade, 10);
  if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) throw criarErro(400, 'itemId inválido');
  if (!Number.isInteger(parsedQuantidade) || parsedQuantidade <= 0) throw criarErro(400, 'quantidade inválida');

  const resultado = await processarVenda(personagemId, parsedItemId, parsedQuantidade, sistema);
  return res.json({ success: true, data: resultado });
}

async function equipar(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const { itemId, sistema } = req.body;
  if (!itemId || !sistema) throw criarErro(400, 'itemId e sistema são obrigatórios');

  const parsedItemId = parseInt(itemId, 10);
  if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) throw criarErro(400, 'itemId inválido');

  const resultado = await equiparItem(personagemId, parsedItemId, sistema);
  return res.json({ success: true, data: resultado });
}

async function desequipar(req, res) {
  const personagemId = parseInt(req.params.id, 10);
  if (!Number.isInteger(personagemId) || personagemId <= 0) {
    throw criarErro(400, 'ID de personagem inválido');
  }

  const { itemId, sistema } = req.body;
  if (!itemId || !sistema) throw criarErro(400, 'itemId e sistema são obrigatórios');

  const parsedItemId = parseInt(itemId, 10);
  if (!Number.isInteger(parsedItemId) || parsedItemId <= 0) throw criarErro(400, 'itemId inválido');

  const resultado = await desequiparItem(personagemId, parsedItemId, sistema);
  return res.json({ success: true, data: resultado });
}

export default { obterSaldo, obterInventario, comprar, vender, equipar, desequipar };
