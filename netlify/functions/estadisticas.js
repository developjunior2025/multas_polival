// netlify/functions/estadisticas.js
const { getDb } = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sql = getDb();
    const { tipo } = event.queryStringParameters || {};

    try {
        // Dashboard summary
        if (!tipo || tipo === 'resumen') {
            const [totalMultas, multasMes, multasHoy, porEstado] = await Promise.all([
                sql`SELECT COUNT(*) as total FROM multas`,
                sql`SELECT COUNT(*) as total FROM multas WHERE DATE_TRUNC('month', fecha) = DATE_TRUNC('month', CURRENT_DATE)`,
                sql`SELECT COUNT(*) as total FROM multas WHERE fecha = CURRENT_DATE`,
                sql`SELECT estado, COUNT(*) as cantidad FROM multas GROUP BY estado ORDER BY cantidad DESC`
            ]);

            return {
                statusCode: 200, headers,
                body: JSON.stringify({
                    total: parseInt(totalMultas[0].total),
                    mes: parseInt(multasMes[0].total),
                    hoy: parseInt(multasHoy[0].total),
                    porEstado
                })
            };
        }

        // By individual (cedula)
        if (tipo === 'por_infractor') {
            const rows = await sql`
        SELECT 
          cedula,
          nombres,
          apellidos,
          COUNT(*) as cantidad_multas,
          SUM(COALESCE(importe_multa_bs, 0)) as total_multa_bs,
          MAX(fecha) as ultima_multa
        FROM multas
        GROUP BY cedula, nombres, apellidos
        ORDER BY cantidad_multas DESC
        LIMIT 50
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows) };
        }

        // By article
        if (tipo === 'por_articulo') {
            const rows = await sql`
        SELECT 
          m.articulo_numero as numero,
          m.articulo_literal as literal,
          COALESCE(a.descripcion, m.descripcion_infraccion) as descripcion,
          COUNT(*) as cantidad_multas,
          SUM(COALESCE(m.importe_multa_bs, 0)) as total_multa_bs
        FROM multas m
        LEFT JOIN articulos a ON m.articulo_id = a.id
        GROUP BY m.articulo_numero, m.articulo_literal, COALESCE(a.descripcion, m.descripcion_infraccion)
        ORDER BY cantidad_multas DESC
        LIMIT 50
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows) };
        }

        // Monthly evolution
        if (tipo === 'evolucion_mensual') {
            const rows = await sql`
        SELECT 
          TO_CHAR(fecha, 'YYYY-MM') as mes,
          TO_CHAR(fecha, 'Mon YYYY') as mes_nombre,
          COUNT(*) as cantidad_multas,
          SUM(COALESCE(importe_multa_bs, 0)) as total_multa_bs
        FROM multas
        WHERE fecha >= CURRENT_DATE - INTERVAL '12 months'
        GROUP BY TO_CHAR(fecha, 'YYYY-MM'), TO_CHAR(fecha, 'Mon YYYY')
        ORDER BY mes
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows) };
        }

        return { statusCode: 400, headers, body: JSON.stringify({ error: 'Tipo inválido' }) };

    } catch (error) {
        console.error('Error in estadisticas:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
