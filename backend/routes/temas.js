
import express from 'express';
import Temas from '../Model/Temas.js'; // ajuste o caminho conforme sua estrutura de pastas
const router = express.Router();

export default router;

router.get('/', (req, res) => {
    Temas.findAll()
        .then(temas => {
            res.status(200).json(temas);
        })
        .catch(error => {
            console.error('Erro ao buscar temas:', error);
            res.status(500).json({ error: 'Erro ao buscar temas.' });
        });
})