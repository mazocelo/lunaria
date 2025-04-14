import axios from 'axios';

const gameApi = axios.create({
    baseURL: 'https://role-chat-play-fcb920fa09f3.herokuapp.com/', // Substitua pela URL da sua API
    timeout: 10000, // Tempo limite em milissegundos
    headers: {
        'Content-Type': 'application/json',
    },
});

export default gameApi;