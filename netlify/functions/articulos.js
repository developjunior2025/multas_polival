// netlify/functions/articulos.js
const { getDb } = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sql = getDb();

    try {
        // GET - List articles
        if (event.httpMethod === 'GET') {
            const { id, activo, search } = event.queryStringParameters || {};

            if (id) {
                const rows = await sql`SELECT * FROM articulos WHERE id = ${id}`;
                return { statusCode: 200, headers, body: JSON.stringify(rows[0] || null) };
            }

            let query = 'SELECT * FROM articulos WHERE 1=1';
            const params = [];

            if (activo !== undefined) {
                query += ` AND activo = $${params.length + 1}`;
                params.push(activo === 'true');
            }

            if (search) {
                const searchLower = `%${search.toLowerCase()}%`;
                const rows = await sql`
          SELECT * FROM articulos 
          WHERE (activo = true OR ${activo === 'all'})
          AND (
            LOWER(numero) LIKE ${searchLower} OR 
            LOWER(descripcion) LIKE ${searchLower} OR
            LOWER(COALESCE(literal, '')) LIKE ${searchLower}
          )
          ORDER BY CAST(REGEXP_REPLACE(numero, '[^0-9]', '', 'g') || '0' AS INTEGER), literal NULLS FIRST
        `;
                return { statusCode: 200, headers, body: JSON.stringify(rows) };
            }

            const rows = await sql`
        SELECT * FROM articulos 
        WHERE activo = true
        ORDER BY CAST(REGEXP_REPLACE(numero, '[^0-9]', '', 'g') || '0' AS INTEGER), literal NULLS FIRST
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows) };
        }

        // POST - Create article
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const { numero, literal, descripcion, valor_ut } = body;

            if (!numero || !descripcion) {
                return {
                    statusCode: 400, headers,
                    body: JSON.stringify({ error: 'Número y descripción son requeridos' })
                };
            }

            const rows = await sql`
        INSERT INTO articulos (numero, literal, descripcion, valor_ut)
        VALUES (${numero}, ${literal || null}, ${descripcion}, ${valor_ut || 0})
        RETURNING *
      `;
            return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
        }

        // PUT - Update article
        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const { id, numero, literal, descripcion, valor_ut, activo } = body;

            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID requerido' }) };
            }

            const rows = await sql`
        UPDATE articulos 
        SET numero = ${numero}, literal = ${literal || null}, descripcion = ${descripcion}, 
            valor_ut = ${valor_ut || 0}, activo = ${activo !== undefined ? activo : true},
            updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
        }

        // DELETE - Soft delete (set activo = false)
        if (event.httpMethod === 'DELETE') {
            const { id } = event.queryStringParameters || {};
            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID requerido' }) };
            }

            // Check if article has associated fines
            const multas = await sql`SELECT COUNT(*) as count FROM multas WHERE articulo_id = ${id}`;
            if (parseInt(multas[0].count) > 0) {
                // Soft delete
                await sql`UPDATE articulos SET activo = false, updated_at = NOW() WHERE id = ${id}`;
                return { statusCode: 200, headers, body: JSON.stringify({ message: 'Artículo desactivado (tiene multas asociadas)' }) };
            }

            await sql`DELETE FROM articulos WHERE id = ${id}`;
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Artículo eliminado' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Error in articulos:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
