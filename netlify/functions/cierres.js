// netlify/functions/cierres.js
// Gestión de Cierres de Caja del sistema de multas IAPMLG
const { getDb } = require('./db');

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    const sql = getDb();

    try {
        // ==================== GET ====================
        // Puede traer: resumen actual, historial de cierres, o un cierre específico
        if (event.httpMethod === 'GET') {
            const { tipo, id, fecha_desde, fecha_hasta } = event.queryStringParameters || {};

            // --- Resumen para cierre actual (datos en tiempo real) ---
            if (!tipo || tipo === 'resumen_actual') {
                const { fecha_desde: fd, fecha_hasta: fh, turno } = event.queryStringParameters || {};

                let resumenQuery;
                let pendientesQuery;
                let detalleEstadosQuery;
                let topArticulosQuery;

                if (fd && fh && turno) {
                    resumenQuery = await sql`
                        SELECT 
                            COUNT(*) AS total_multas,
                            COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS total_pendientes,
                            COUNT(*) FILTER (WHERE estado = 'PAGADO') AS total_pagadas,
                            COUNT(*) FILTER (WHERE estado = 'ANULADO') AS total_anuladas,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PENDIENTE'), 0) AS monto_pendiente_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PAGADO'), 0) AS monto_pagado_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'ANULADO'), 0) AS monto_anulado_bs,
                            COUNT(DISTINCT cedula) AS infractores_unicos
                        FROM multas
                        WHERE fecha >= ${fd} AND fecha <= ${fh} AND turno = ${turno}
                    `;
                    topArticulosQuery = await sql`
                        SELECT 
                            COALESCE(articulo_numero, 'N/A') AS articulo_numero,
                            COALESCE(articulo_literal, '') AS articulo_literal,
                            COUNT(*) AS cantidad,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total
                        FROM multas
                        WHERE fecha >= ${fd} AND fecha <= ${fh} AND turno = ${turno}
                        GROUP BY articulo_numero, articulo_literal
                        ORDER BY cantidad DESC
                        LIMIT 10
                    `;
                } else if (fd && fh) {
                    resumenQuery = await sql`
                        SELECT 
                            COUNT(*) AS total_multas,
                            COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS total_pendientes,
                            COUNT(*) FILTER (WHERE estado = 'PAGADO') AS total_pagadas,
                            COUNT(*) FILTER (WHERE estado = 'ANULADO') AS total_anuladas,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PENDIENTE'), 0) AS monto_pendiente_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PAGADO'), 0) AS monto_pagado_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'ANULADO'), 0) AS monto_anulado_bs,
                            COUNT(DISTINCT cedula) AS infractores_unicos
                        FROM multas
                        WHERE fecha >= ${fd} AND fecha <= ${fh}
                    `;
                    topArticulosQuery = await sql`
                        SELECT 
                            COALESCE(articulo_numero, 'N/A') AS articulo_numero,
                            COALESCE(articulo_literal, '') AS articulo_literal,
                            COUNT(*) AS cantidad,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total
                        FROM multas
                        WHERE fecha >= ${fd} AND fecha <= ${fh}
                        GROUP BY articulo_numero, articulo_literal
                        ORDER BY cantidad DESC
                        LIMIT 10
                    `;
                } else {
                    // Por defecto: hoy
                    resumenQuery = await sql`
                        SELECT 
                            COUNT(*) AS total_multas,
                            COUNT(*) FILTER (WHERE estado = 'PENDIENTE') AS total_pendientes,
                            COUNT(*) FILTER (WHERE estado = 'PAGADO') AS total_pagadas,
                            COUNT(*) FILTER (WHERE estado = 'ANULADO') AS total_anuladas,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PENDIENTE'), 0) AS monto_pendiente_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'PAGADO'), 0) AS monto_pagado_bs,
                            COALESCE(SUM(importe_multa_bs) FILTER (WHERE estado = 'ANULADO'), 0) AS monto_anulado_bs,
                            COUNT(DISTINCT cedula) AS infractores_unicos
                        FROM multas
                        WHERE fecha = CURRENT_DATE
                    `;
                    topArticulosQuery = await sql`
                        SELECT 
                            COALESCE(articulo_numero, 'N/A') AS articulo_numero,
                            COALESCE(articulo_literal, '') AS articulo_literal,
                            COUNT(*) AS cantidad,
                            COALESCE(SUM(importe_multa_bs), 0) AS monto_total
                        FROM multas
                        WHERE fecha = CURRENT_DATE
                        GROUP BY articulo_numero, articulo_literal
                        ORDER BY cantidad DESC
                        LIMIT 10
                    `;
                }

                // Multas pendientes HISTÓRICAS (anteriores a hoy o al rango)
                const fechaCorte = fd || new Date().toISOString().slice(0, 10);
                const pendientesHistoricasQuery = await sql`
                    SELECT 
                        COUNT(*) AS total,
                        COALESCE(SUM(importe_multa_bs), 0) AS monto_total
                    FROM multas
                    WHERE estado = 'PENDIENTE' AND fecha < ${fechaCorte}
                `;

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({
                        resumen: resumenQuery[0],
                        top_articulos: topArticulosQuery,
                        pendientes_historicas: pendientesHistoricasQuery[0]
                    })
                };
            }

            // --- Listado de multas pendientes históricas (para verificar) ---
            if (tipo === 'pendientes_historicas') {
                const page = parseInt(event.queryStringParameters?.page || '1');
                const limit = parseInt(event.queryStringParameters?.limit || '20');
                const offset = (page - 1) * limit;

                const fechaCorte = event.queryStringParameters?.fecha_corte || new Date().toISOString().slice(0, 10);

                const [totalRows, dataRows] = await Promise.all([
                    sql`SELECT COUNT(*) as count FROM multas WHERE estado = 'PENDIENTE' AND fecha < ${fechaCorte}`,
                    sql`
                        SELECT m.*, a.descripcion as articulo_descripcion
                        FROM multas m
                        LEFT JOIN articulos a ON m.articulo_id = a.id
                        WHERE m.estado = 'PENDIENTE' AND m.fecha < ${fechaCorte}
                        ORDER BY m.fecha ASC, m.numero_acta ASC
                        LIMIT ${limit} OFFSET ${offset}
                    `
                ]);

                return {
                    statusCode: 200, headers,
                    body: JSON.stringify({
                        data: dataRows,
                        total: parseInt(totalRows[0].count),
                        page,
                        limit
                    })
                };
            }

            // --- Historial de cierres guardados ---
            if (tipo === 'historial') {
                // Intentar leer la tabla de cierres; si no existe, retorna vacío
                try {
                    let rows;
                    if (fecha_desde && fecha_hasta) {
                        rows = await sql`
                            SELECT * FROM cierres_caja
                            WHERE fecha_cierre >= ${fecha_desde} AND fecha_cierre <= ${fecha_hasta}
                            ORDER BY created_at DESC
                            LIMIT 50
                        `;
                    } else {
                        rows = await sql`
                            SELECT * FROM cierres_caja
                            ORDER BY created_at DESC
                            LIMIT 50
                        `;
                    }
                    return { statusCode: 200, headers, body: JSON.stringify(rows) };
                } catch (e) {
                    // Tabla no existe aún
                    return { statusCode: 200, headers, body: JSON.stringify([]) };
                }
            }

            // --- Cierre específico por ID ---
            if (tipo === 'detalle' && id) {
                const rows = await sql`SELECT * FROM cierres_caja WHERE id = ${id}`;
                return { statusCode: 200, headers, body: JSON.stringify(rows[0] || null) };
            }

            return { statusCode: 400, headers, body: JSON.stringify({ error: 'Tipo de consulta no válido' }) };
        }

        // ==================== POST (Guardar cierre) ====================
        if (event.httpMethod === 'POST') {
            const body = JSON.parse(event.body || '{}');
            const {
                fecha_desde, fecha_hasta, turno,
                total_multas, total_pendientes, total_pagadas, total_anuladas,
                monto_total_bs, monto_pendiente_bs, monto_pagado_bs, monto_anulado_bs,
                infractores_unicos, pendientes_historicas_count, pendientes_historicas_monto,
                observaciones, funcionario_cierre
            } = body;

            if (!fecha_desde || !fecha_hasta) {
                return {
                    statusCode: 400, headers,
                    body: JSON.stringify({ error: 'Fecha desde y hasta son requeridas' })
                };
            }

            // Crear tabla si no existe
            await sql`
                CREATE TABLE IF NOT EXISTS cierres_caja (
                    id SERIAL PRIMARY KEY,
                    numero_cierre VARCHAR(20) UNIQUE NOT NULL,
                    fecha_desde DATE NOT NULL,
                    fecha_hasta DATE NOT NULL,
                    turno VARCHAR(2),
                    total_multas INTEGER DEFAULT 0,
                    total_pendientes INTEGER DEFAULT 0,
                    total_pagadas INTEGER DEFAULT 0,
                    total_anuladas INTEGER DEFAULT 0,
                    monto_total_bs DECIMAL(15,2) DEFAULT 0,
                    monto_pendiente_bs DECIMAL(15,2) DEFAULT 0,
                    monto_pagado_bs DECIMAL(15,2) DEFAULT 0,
                    monto_anulado_bs DECIMAL(15,2) DEFAULT 0,
                    infractores_unicos INTEGER DEFAULT 0,
                    pendientes_historicas_count INTEGER DEFAULT 0,
                    pendientes_historicas_monto DECIMAL(15,2) DEFAULT 0,
                    observaciones TEXT,
                    funcionario_cierre VARCHAR(100),
                    fecha_cierre DATE DEFAULT CURRENT_DATE,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `;

            // Generar número de cierre
            let numeroCierre;
            try {
                const lastRow = await sql`SELECT numero_cierre FROM cierres_caja ORDER BY id DESC LIMIT 1`;
                const lastNum = lastRow.length > 0 ? parseInt(lastRow[0].numero_cierre.replace('CC-', '')) : 0;
                numeroCierre = `CC-${(lastNum + 1).toString().padStart(5, '0')}`;
            } catch (e) {
                numeroCierre = 'CC-00001';
            }

            const rows = await sql`
                INSERT INTO cierres_caja (
                    numero_cierre, fecha_desde, fecha_hasta, turno,
                    total_multas, total_pendientes, total_pagadas, total_anuladas,
                    monto_total_bs, monto_pendiente_bs, monto_pagado_bs, monto_anulado_bs,
                    infractores_unicos, pendientes_historicas_count, pendientes_historicas_monto,
                    observaciones, funcionario_cierre
                ) VALUES (
                    ${numeroCierre}, ${fecha_desde}, ${fecha_hasta}, ${turno || null},
                    ${total_multas || 0}, ${total_pendientes || 0}, ${total_pagadas || 0}, ${total_anuladas || 0},
                    ${monto_total_bs || 0}, ${monto_pendiente_bs || 0}, ${monto_pagado_bs || 0}, ${monto_anulado_bs || 0},
                    ${infractores_unicos || 0}, ${pendientes_historicas_count || 0}, ${pendientes_historicas_monto || 0},
                    ${observaciones || null}, ${funcionario_cierre || null}
                )
                RETURNING *
            `;

            return { statusCode: 201, headers, body: JSON.stringify(rows[0]) };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Error in cierres:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
