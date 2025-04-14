import axios from 'axios';

const url = 'http://'

const api = axios.create({
    baseURL: url,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
