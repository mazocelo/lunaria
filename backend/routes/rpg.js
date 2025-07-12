// rpgRouter.ts
import express from 'express';
// import { salas } from '../db/salas.js';

const router = express.Router();

// /**
//  * @swagger
//  * tags:
//  *   name: RPG
//  *   description: Operações de RPG em tempo real
//  */

// /**
//  * @swagger
//  * /rpg/acao:
//  *   post:
//  *     summary: Enviar ação do jogador
//  *     tags: [RPG]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/AcaoRPG'
//  *     responses:
//  *       200:
//  *         description: Ação processada com sucesso
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 narrativa:
//  *                   type: string
//  *                   description: Resposta narrativa do mestre
//  *                 precisaRolar:
//  *                   type: boolean
//  *                   description: Indica se é necessário rolar dados
//  *                 success:
//  *                   type: boolean
//  *       400:
//  *         description: Dados inválidos
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  *       404:
//  *         description: Sala não encontrada
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  */
// router.post('/acao', async (req, res) => {
//     const { mensagem, jogadorId, salaId } = req.body;
//     if (!mensagem || !jogadorId || !salaId) {
//         return res.status(400).json({ erro: 'Mensagem, jogadorId e salaId são obrigatórios.' });
//     }

//     const sala = salas.get(salaId);
//     if (!sala) {
//         return res.status(404).json({ erro: 'Sala não encontrada.' });
//     }

//     let { historico, jogadores, mestre } = sala;

//     // Adiciona jogador à sala, se ainda não estiver
//     if (!jogadores.has(Number(jogadorId))) {
//         jogadores.set(Number(jogadorId), { id: jogadorId });
//     }

//     // Adiciona mensagem do jogador ao histórico
//     historico.set(historico.size, { jogador: jogadorId, mensagem });

//     // Gera contexto da conversa com base no histórico
//     const contexto = Array.from(historico.values())
//         .map(entry => (entry.jogador === 'mestre' ? `Mestre: ${entry.mensagem}` : `Jogador: ${entry.mensagem}`))
//         .join('\n');
//     try {
//         const resposta = await mestre.call({ input: contexto });

//         // Adiciona resposta do mestre ao histórico
//         historico.set(historico.size, { jogador: 'mestre', mensagem: resposta.response });

//         // Atualiza sala
//         salas.set(salaId, {
//             ...sala,
//             historico,
//             jogadores
//         });

//         res.json({
//             narrativa: resposta.response,
//             precisaRolar: /\d+d\d+/i.test(resposta.response),
//             success: true
//         });

//     } catch (err) {
//         console.error('Erro na ação:', err);
//         res.status(500).json({ erro: 'Erro ao processar a ação.' });
//     }
// });


// /**
//  * @swagger
//  * /rpg/rolagem:
//  *   post:
//  *     summary: Enviar resultado de rolagem de dados
//  *     tags: [RPG]
//  *     requestBody:
//  *       required: true
//  *       content:
//  *         application/json:
//  *           schema:
//  *             $ref: '#/components/schemas/Rolagem'
//  *     responses:
//  *       200:
//  *         description: Rolagem processada com sucesso
//  *         content:
//  *           application/json:
//  *             schema:
//  *               type: object
//  *               properties:
//  *                 narrativa:
//  *                   type: string
//  *                   description: Interpretação narrativa da rolagem
//  *                 success:
//  *                   type: boolean
//  *       400:
//  *         description: Dados inválidos
//  *         content:
//  *           application/json:
//  *             schema:
//  *               $ref: '#/components/schemas/Error'
//  */
// // Jogador envia o resultado do dado (ex: 17 em 1d20)
// router.post('/rolagem', async (req, res) => {
//     const { resultado, tipo, descricao } = req.body;

//     if (typeof resultado !== 'number' || !tipo) {
//         return res.status(400).json({ erro: 'Resultado numérico e tipo são obrigatórios.' });
//     }

//     const mensagem = `O jogador rolou ${resultado} em um teste de ${tipo}. ${descricao || ''}`;

//     try {
//         const executor = await executorPromise;
//         const resposta = await executor.call({ input: mensagem });

//         res.json({ narrativa: resposta.response, success: true });
//     } catch (err) {
//         console.error('Erro na rolagem:', err);
//         res.status(500).json({ erro: 'Erro ao interpretar a rolagem.' });
//     }
// });


export default router;