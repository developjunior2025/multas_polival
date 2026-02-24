// netlify/functions/configuracion.js
const { getDb } = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sql = getDb();

    try {
        if (event.httpMethod === 'GET') {
            const rows = await sql`SELECT * FROM configuracion ORDER BY clave`;
            const config = {};
            rows.forEach(row => { config[row.clave] = row.valor; });
            return { statusCode: 200, headers, body: JSON.stringify(config) };
        }

        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const updates = [];

            for (const [clave, valor] of Object.entries(body)) {
                await sql`
          INSERT INTO configuracion (clave, valor)
          VALUES (${clave}, ${String(valor)})
          ON CONFLICT (clave) DO UPDATE SET valor = ${String(valor)}, updated_at = NOW()
        `;
                updates.push(clave);
            }

            return { statusCode: 200, headers, body: JSON.stringify({ updated: updates }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Error in configuracion:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
