require('dotenv').config();

const axios = require("axios");

const { getHeaders } = require("../config/http");

module.exports = {
    login: async () => {
        const path = '/api/v1/auth/login';
        const url = `${process.env.API_HOST}${path}`;
    
        try {
            const response = await axios.post(url, { 
                email: process.env.AUTH_USER, 
                password: process.env.AUTH_PASSWORD
            });
            
            return response;
        } catch (error) {
            throw new Error(error);
        }
    },
    getBanks: async (token) => {
        const path = `/api/v1/setup-odissey/bank?perpage=200`;
        const url = `${process.env.API_HOST}${path}`;

        try {
            const { data } = await axios.get(url, { headers: getHeaders(token) });

            return data?.data;
        } catch (error) {
            throw new Error(error.message);
        }
    },
    uploadBank: async (body, token, headers) => {
        const path = "/api/v1/bank/upload";
        const url = `${process.env.API_HOST}${path}`;

        try {
            const { data } = await axios.post(url, body, { headers: {
                "Authorization": `Bearer ${token}`,
                "Cache-Control": "no-cache",
                ...headers,
            }});

            return data;
        } catch (error) {
            throw new Error(error);
        }
    }
}