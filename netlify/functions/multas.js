// netlify/functions/multas.js
const { getDb } = require('./db');

// Normaliza una multa: convierte el campo fecha (que Neon puede devolver como objeto Date)
// a string 'YYYY-MM-DD' para evitar problemas de zona horaria en el frontend.
function normalizeMulta(m) {
    if (!m) return m;
    if (m.fecha) {
        if (m.fecha instanceof Date) {
            // Usar getUTCFullYear/Month/Date para que no cambie el día por timezone
            const y = m.fecha.getUTCFullYear();
            const mo = String(m.fecha.getUTCMonth() + 1).padStart(2, '0');
            const d = String(m.fecha.getUTCDate()).padStart(2, '0');
            m.fecha = `${y}-${mo}-${d}`;
        } else if (typeof m.fecha === 'string' && m.fecha.length > 10) {
            m.fecha = m.fecha.substring(0, 10);
        }
    }
    return m;
}

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
                return { statusCode: 200, headers, body: JSON.stringify(normalizeMulta(rows[0] || null)) };
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

            const {
                fecha, hora, turno, direccion_infraccion,
                nombres, apellidos, cedula, telefono, direccion_infractor,
                marca, modelo, anio, tipo, color, matricula,
                articulo_id, articulo_numero, articulo_literal, descripcion_infraccion,
                valor_ut, valor_tcmmv, importe_multa_bs,
                funcionario, ci_funcionario, estado,
                numero_acta_manual
            } = body;

            if (!nombres || !apellidos || !cedula || !fecha || !direccion_infraccion) {
                return {
                    statusCode: 400, headers,
                    body: JSON.stringify({ error: 'Campos requeridos: nombres, apellidos, cédula, fecha, dirección de infracción' })
                };
            }

            let nextNum;

            if (numero_acta_manual && numero_acta_manual.trim() !== '') {
                // --- Modo MANUAL: usar el número provisto ---
                nextNum = numero_acta_manual.trim();

                // Verificar que no exista ya una multa con ese número
                const existing = await sql`SELECT id FROM multas WHERE numero_acta = ${nextNum}`;
                if (existing.length > 0) {
                    return {
                        statusCode: 409, headers,
                        body: JSON.stringify({ error: `Ya existe un acta con el número ${nextNum}. Por favor, use un número diferente.` })
                    };
                }
            } else {
                // --- Modo AUTOMÁTICO: obtener el siguiente número ---
                const configRow = await sql`
          SELECT valor FROM configuracion WHERE clave = 'ultimo_numero_acta'
        `;
                nextNum = (parseInt(configRow[0]?.valor || '0') + 1).toString().padStart(6, '0');
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

            // Actualizar el contador solo si fue modo automático
            if (!numero_acta_manual || numero_acta_manual.trim() === '') {
                await sql`
          UPDATE configuracion SET valor = ${nextNum}, updated_at = NOW()
          WHERE clave = 'ultimo_numero_acta'
        `;
            }

            return { statusCode: 201, headers, body: JSON.stringify(normalizeMulta(rows[0])) };
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
            return { statusCode: 200, headers, body: JSON.stringify(normalizeMulta(rows[0])) };
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
        data: dataRows.map(normalizeMulta),
        total: parseInt(totalRows[0].count),
        page: Math.floor(offset / limitNum) + 1,
        limit: limitNum
    };
}
