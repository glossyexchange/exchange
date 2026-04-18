// src/api/index.ts

// import axios, { type AxiosInstance } from 'axios'

// const local = 'http://56.228.24.94'
// // const local = 'https://api.365promo.net'
// // const REACT_APP_API_URL = 'http://54.166.173.167';

// const api: AxiosInstance = axios.create({
//   baseURL: `${local}/api/v1`,
// })

// export default api

import axios from "axios";

// const baseURL = 'http://localhost:5000';
const baseURL = "https://exchange.glossycode.com";
// const baseURL = 'http://56.228.24.94'

// const apiVersion = process.env.REACT_APP_API_VERSION || 'v1';

const api = axios.create({
  baseURL: `${baseURL}/api/v1`,
  // ... rest of config
});

export default api;
