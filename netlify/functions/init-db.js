// netlify/functions/init-db.js
const { initDb } = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        await initDb();
        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ success: true, message: 'Base de datos inicializada correctamente' })
        };
    } catch (error) {
        console.error('Error initializing DB:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ success: false, error: error.message })
        };
    }
};
