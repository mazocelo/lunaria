import express from 'express';
import Criador from '../agents/historia/Criador.js'; 
import Historia from '../Model/Historia.js'; // ajuste o caminho conforme sua estrutura de pastas
const router = express.Router();

router.post('/nova', async (req, res, next) => {
    try {
        console.log('body', req.body);
        // const criador = await Criador();
        const { nome, tema } = req.body;
        

        const novaHistoria = await Historia.create({
            nome,
            tema,
        });

        res.status(201).json(novaHistoria);
    } catch (error) {
        console.error('Erro ao criar nova história:', error);
        res.status(500).json({ error: 'Erro ao criar nova história.' });
    }
});


export default router;
