// netlify/functions/multas.js
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
        if (event.httpMethod === 'GET') {
            const { id, cedula, articulo_id, fecha_desde, fecha_hasta, estado, page, limit } = event.queryStringParameters || {};

            if (id) {
                const rows = await sql`
          SELECT m.*, a.descripcion as articulo_descripcion
          FROM multas m
          LEFT JOIN articulos a ON m.articulo_id = a.id
          WHERE m.id = ${id}
        `;
                return { statusCode: 200, headers, body: JSON.stringify(rows[0] || null) };
            }

            const pageNum = parseInt(page || '1');
            const limitNum = parseInt(limit || '20');
            const offset = (pageNum - 1) * limitNum;

            // Build dynamic query conditions
            let conditions = [];

            const baseQuery = await buildFilteredQuery(sql, {
                cedula, articulo_id, fecha_desde, fecha_hasta, estado
            }, limitNum, offset);

            return { statusCode: 200, headers, body: JSON.stringify(baseQuery) };
        }

        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');

            // Get next acta number
            const configRow = await sql`
        SELECT valor FROM configuracion WHERE clave = 'ultimo_numero_acta'
      `;
            const nextNum = (parseInt(configRow[0]?.valor || '0') + 1).toString().padStart(6, '0');

            const {
                fecha, hora, turno, direccion_infraccion,
                nombres, apellidos, cedula, telefono, direccion_infractor,
                marca, modelo, anio, tipo, color, matricula,
                articulo_id, articulo_numero, articulo_literal, descripcion_infraccion,
                valor_ut, valor_tcmmv, importe_multa_bs,
                funcionario, ci_funcionario, estado
            } = body;

            if (!nombres || !apellidos || !cedula || !fecha || !direccion_infraccion) {
                return {
                    statusCode: 400, headers,
                    body: JSON.stringify({ error: 'Campos requeridos: nombres, apellidos, cédula, fecha, dirección de infracción' })
                };
            }

            const rows = await sql`
        INSERT INTO multas (
          numero_acta, fecha, hora, turno, direccion_infraccion,
          nombres, apellidos, cedula, telefono, direccion_infractor,
          marca, modelo, anio, tipo, color, matricula,
          articulo_id, articulo_numero, articulo_literal, descripcion_infraccion,
          valor_ut, valor_tcmmv, importe_multa_bs,
          funcionario, ci_funcionario, estado
        ) VALUES (
          ${nextNum}, ${fecha}, ${hora || null}, ${turno || 'AM'}, ${direccion_infraccion},
          ${nombres}, ${apellidos}, ${cedula}, ${telefono || null}, ${direccion_infractor || null},
          ${marca || null}, ${modelo || null}, ${anio || null}, ${tipo || null}, ${color || null}, ${matricula || null},
          ${articulo_id || null}, ${articulo_numero || null}, ${articulo_literal || null}, ${descripcion_infraccion || null},
          ${valor_ut || null}, ${valor_tcmmv || null}, ${importe_multa_bs || null},
          ${funcionario || null}, ${ci_funcionario || null}, ${estado || 'PENDIENTE'}
        )
        RETURNING *
      `;

            // Update last acta number
            await sql`
        UPDATE configuracion SET valor = ${nextNum}, updated_at = NOW()
        WHERE clave = 'ultimo_numero_acta'
      `;

            return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
        }

        if (event.httpMethod === 'PUT') {
            const body = JSON.parse(event.body || '{}');
            const {
                id, fecha, hora, turno, direccion_infraccion,
                nombres, apellidos, cedula, telefono, direccion_infractor,
                marca, modelo, anio, tipo, color, matricula,
                articulo_id, articulo_numero, articulo_literal, descripcion_infraccion,
                valor_ut, valor_tcmmv, importe_multa_bs,
                funcionario, ci_funcionario, estado
            } = body;

            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID requerido' }) };
            }

            const rows = await sql`
        UPDATE multas SET
          fecha = ${fecha}, hora = ${hora || null}, turno = ${turno || 'AM'},
          direccion_infraccion = ${direccion_infraccion},
          nombres = ${nombres}, apellidos = ${apellidos}, cedula = ${cedula},
          telefono = ${telefono || null}, direccion_infractor = ${direccion_infractor || null},
          marca = ${marca || null}, modelo = ${modelo || null}, anio = ${anio || null},
          tipo = ${tipo || null}, color = ${color || null}, matricula = ${matricula || null},
          articulo_id = ${articulo_id || null}, articulo_numero = ${articulo_numero || null},
          articulo_literal = ${articulo_literal || null}, descripcion_infraccion = ${descripcion_infraccion || null},
          valor_ut = ${valor_ut || null}, valor_tcmmv = ${valor_tcmmv || null},
          importe_multa_bs = ${importe_multa_bs || null},
          funcionario = ${funcionario || null}, ci_funcionario = ${ci_funcionario || null},
          estado = ${estado || 'PENDIENTE'}, updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;
            return { statusCode: 200, headers, body: JSON.stringify(rows[0]) };
        }

        if (event.httpMethod === 'DELETE') {
            const { id } = event.queryStringParameters || {};
            if (!id) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'ID requerido' }) };
            }

            await sql`DELETE FROM multas WHERE id = ${id}`;
            return { statusCode: 200, headers, body: JSON.stringify({ message: 'Multa eliminada' }) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Error in multas:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};

async function buildFilteredQuery(sql, filters, limitNum, offset) {
    const { cedula, articulo_id, fecha_desde, fecha_hasta, estado } = filters;

    // Count total
    let totalRows;
    let dataRows;

    if (cedula && articulo_id && fecha_desde && fecha_hasta && estado) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE cedula = ${cedula} AND articulo_id = ${articulo_id} AND fecha >= ${fecha_desde} AND fecha <= ${fecha_hasta} AND estado = ${estado}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.cedula = ${cedula} AND m.articulo_id = ${articulo_id} AND m.fecha >= ${fecha_desde} AND m.fecha <= ${fecha_hasta} AND m.estado = ${estado} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (cedula && articulo_id && fecha_desde && fecha_hasta) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE cedula = ${cedula} AND articulo_id = ${articulo_id} AND fecha >= ${fecha_desde} AND fecha <= ${fecha_hasta}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.cedula = ${cedula} AND m.articulo_id = ${articulo_id} AND m.fecha >= ${fecha_desde} AND m.fecha <= ${fecha_hasta} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (cedula && fecha_desde && fecha_hasta) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE cedula = ${cedula} AND fecha >= ${fecha_desde} AND fecha <= ${fecha_hasta}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.cedula = ${cedula} AND m.fecha >= ${fecha_desde} AND m.fecha <= ${fecha_hasta} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (articulo_id && fecha_desde && fecha_hasta) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE articulo_id = ${articulo_id} AND fecha >= ${fecha_desde} AND fecha <= ${fecha_hasta}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.articulo_id = ${articulo_id} AND m.fecha >= ${fecha_desde} AND m.fecha <= ${fecha_hasta} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (cedula && articulo_id) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE cedula = ${cedula} AND articulo_id = ${articulo_id}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.cedula = ${cedula} AND m.articulo_id = ${articulo_id} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (cedula) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE cedula = ${cedula}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.cedula = ${cedula} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (articulo_id) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE articulo_id = ${articulo_id}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.articulo_id = ${articulo_id} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (fecha_desde && fecha_hasta) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE fecha >= ${fecha_desde} AND fecha <= ${fecha_hasta}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.fecha >= ${fecha_desde} AND m.fecha <= ${fecha_hasta} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else if (estado) {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas WHERE estado = ${estado}`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id WHERE m.estado = ${estado} ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    } else {
        totalRows = await sql`SELECT COUNT(*) as count FROM multas`;
        dataRows = await sql`SELECT m.*, a.descripcion as articulo_descripcion FROM multas m LEFT JOIN articulos a ON m.articulo_id = a.id ORDER BY m.fecha DESC, m.numero_acta DESC LIMIT ${limitNum} OFFSET ${offset}`;
    }

    return {
        data: dataRows,
        total: parseInt(totalRows[0].count),
        page: Math.floor(offset / limitNum) + 1,
        limit: limitNum
    };
}
