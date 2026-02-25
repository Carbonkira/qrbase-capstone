import axios from 'axios';

const api = axios.create({
  baseURL: 'https://qrbase.onrender.com/api', 
});

export default api;
