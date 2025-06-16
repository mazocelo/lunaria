import axios from 'axios';

//let baseURL = 'https://role-chat-play-fcb920fa09f3.herokuapp.com/'; // URL padrão da API
let baseURL = 'http://localhost:3000/'; // URL da API em desenvolvimento

const gameApi = axios.create({
    baseURL: baseURL,
    timeout: 10000, // Tempo limite em milissegundos
    headers: {
        'Content-Type': 'application/json',
    },
});

export default gameApi;