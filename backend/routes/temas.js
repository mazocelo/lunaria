
import express from 'express';
import db from '../Model/index.js';
const router = express.Router();

export default router;

router.get('/', (req, res) => {
    db.Temas.findAll()
        .then(temas => {
            res.status(200).json(temas);
        })
        .catch(error => {
            console.error('Erro ao buscar temas:', error);
            res.status(500).json({ error: 'Erro ao buscar temas.' });
        });
})