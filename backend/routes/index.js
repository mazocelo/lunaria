import express from 'express';
import { createExecutor } from '../tools/master.js';
import { salas } from '../db/salas.js';

const router = express.Router();

/* GET home page. */
router.get('/:id', async (req, res, next) => {
  const { id } = req.params;
  const sala = salas.get(id);

  // Cria novo jogador
  const novoJogadorId = Math.floor(Math.random() * 1000000);

  if (!sala) {
    // Criação de nova sala
    const historico = new Map();
    const jogadores = new Map();
    const mestre = await createExecutor();

    const firstMessage = "Você entrou no jogo";
    const inicio = await mestre.call({ input: firstMessage });

    historico.set(0, { jogador: novoJogadorId, mensagem: firstMessage });
    historico.set(1, { jogador: 'mestre', mensagem: inicio.response });
    jogadores.set(novoJogadorId, { id: novoJogadorId });

    const novaSala = {
      id,
      jogadores,
      historico,
      mestre,
    };

    salas.set(id, novaSala);
    console.log(`Criando sala ${id} com jogador ${novoJogadorId}`);

    return res.render('index', {
      salaId: id,
      jogadorId: novoJogadorId,
      historico: [{ jogador: novoJogadorId, mensagem: firstMessage }],
      inicio: inicio.response,

    });
  } else {
    // Sala já existe — adiciona jogador se ainda não estiver
    if (!sala.jogadores.has(novoJogadorId)) {
      sala.jogadores.set(novoJogadorId, { id: novoJogadorId });
    }

    console.log(`Entrando na sala ${id} com jogador ${novoJogadorId}`);

    // Converte Map de histórico para array para renderizar no front
    const historicoArray = Array.from(sala.historico.values());

    return res.render('index', {
      salaId: id,
      jogadorId: novoJogadorId,
      historico: historicoArray,
    });
  }
});

router.get("/", (req, res) => {
  //send to random room
  const roomId = Math.floor(Math.random() * 1000000);
  res.redirect(`/${roomId}`);
})

export default router;
