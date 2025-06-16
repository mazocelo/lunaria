import express from 'express';
import Criador from '../agents/historia/Criador.js';
import Historia from '../Model/Historia.js'; // ajuste o caminho conforme sua estrutura de pastas
const router = express.Router();

router.post('/nova', async (req, res, next) => {
    try {
        console.log('body', req.body);
        // const criador = await Criador();
        const { nome, tema, maximo_de_participantes } = req.body;
        const novaHistoria = await Historia.create({
            nome,
            tema,
            maximo_de_participantes
        });

        res.status(201).json(novaHistoria);
    } catch (error) {
        console.error('Erro ao criar nova história:', error);
        // res.status(500).json({ error: 'Erro ao criar nova história.' });
        res.status(500).json({ error: error.message });
    }
});

router.get('/' , async (req, res, next) => {
    try {
        const historias = await Historia.findAll();
        res.status(200).json(historias);
    } catch (error) {
        console.error('Erro ao buscar histórias:', error);
        res.status(500).json({ error: error.message });
    }
});


export default router;
