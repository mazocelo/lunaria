import express from 'express';
import socketManager from '../websocket/socketManager.js';

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: WebSocket
 *   description: Gerenciamento de WebSocket e comunicação em tempo real
 */

/**
 * @swagger
 * /websocket/stats:
 *   get:
 *     summary: Obter estatísticas do WebSocket
 *     tags: [WebSocket]
 *     responses:
 *       200:
 *         description: Estatísticas do servidor WebSocket
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     connectedUsers:
 *                       type: integer
 *                       description: Número de usuários conectados
 *                     activeRooms:
 *                       type: integer
 *                       description: Número de salas ativas
 *                     totalRooms:
 *                       type: integer
 *                       description: Total de salas no servidor
 */
router.get('/stats', (req, res) => {
  try {
    const stats = socketManager.getStats();
    
    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('❌ Erro ao obter estatísticas do WebSocket:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /websocket/broadcast:
 *   post:
 *     summary: Enviar mensagem broadcast para todas as salas
 *     tags: [WebSocket]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Nome do evento
 *               data:
 *                 type: object
 *                 description: Dados a serem enviados
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/broadcast', (req, res) => {
  try {
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        error: 'event e data são obrigatórios'
      });
    }
    
    // Enviar para todos os clientes conectados
    socketManager.io.emit(event, data);
    
    res.status(200).json({
      success: true,
      message: 'Mensagem broadcast enviada com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro ao enviar broadcast:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /websocket/room/{roomId}/message:
 *   post:
 *     summary: Enviar mensagem para sala específica
 *     tags: [WebSocket]
 *     parameters:
 *       - in: path
 *         name: roomId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID da sala
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Nome do evento
 *               data:
 *                 type: object
 *                 description: Dados a serem enviados
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/room/:roomId/message', (req, res) => {
  try {
    const { roomId } = req.params;
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        error: 'event e data são obrigatórios'
      });
    }
    
    // Enviar para a sala específica
    socketManager.sendToRoom(roomId, event, data);
    
    res.status(200).json({
      success: true,
      message: `Mensagem enviada para sala ${roomId}`
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para sala:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

/**
 * @swagger
 * /websocket/user/{userId}/message:
 *   post:
 *     summary: Enviar mensagem para usuário específico
 *     tags: [WebSocket]
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID do usuário
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - event
 *               - data
 *             properties:
 *               event:
 *                 type: string
 *                 description: Nome do evento
 *               data:
 *                 type: object
 *                 description: Dados a serem enviados
 *     responses:
 *       200:
 *         description: Mensagem enviada com sucesso
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 */
router.post('/user/:userId/message', (req, res) => {
  try {
    const { userId } = req.params;
    const { event, data } = req.body;
    
    if (!event || !data) {
      return res.status(400).json({
        success: false,
        error: 'event e data são obrigatórios'
      });
    }
    
    // Enviar para o usuário específico
    socketManager.sendToUser(userId, event, data);
    
    res.status(200).json({
      success: true,
      message: `Mensagem enviada para usuário ${userId}`
    });
  } catch (error) {
    console.error('❌ Erro ao enviar mensagem para usuário:', error);
    res.status(500).json({
      success: false,
      error: 'Erro interno do servidor'
    });
  }
});

export default router; 