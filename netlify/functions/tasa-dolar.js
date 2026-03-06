// netlify/functions/tasa-dolar.js
// Proxy a ve.dolarapi.com para obtener tasas del Dólar Oficial y Paralelo BCV
// Evita problemas de CORS al llamar desde el frontend

exports.handler = async (event, context) => {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json',
        // Cache 1 hora en CDN / navegador
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    try {
        // Obtener oficial y paralelo en paralelo
        const [respOficial, respParalelo] = await Promise.all([
            fetch('https://ve.dolarapi.com/v1/dolares/oficial'),
            fetch('https://ve.dolarapi.com/v1/dolares/paralelo')
        ]);

        if (!respOficial.ok || !respParalelo.ok) {
            throw new Error('Error al consultar DolarApi.com');
        }

        const [oficial, paralelo] = await Promise.all([
            respOficial.json(),
            respParalelo.json()
        ]);

        const resultado = {
            oficial: {
                promedio:  parseFloat(oficial.promedio) || null,
                compra:    parseFloat(oficial.compra)   || null,
                venta:     parseFloat(oficial.venta)    || null,
                nombre:    oficial.nombre || 'Oficial (BCV)',
                fuente:    oficial.fuente,
                actualizado: oficial.fechaActualizacion
            },
            paralelo: {
                promedio:  parseFloat(paralelo.promedio) || null,
                compra:    parseFloat(paralelo.compra)   || null,
                venta:     parseFloat(paralelo.venta)    || null,
                nombre:    paralelo.nombre || 'Paralelo',
                fuente:    paralelo.fuente,
                actualizado: paralelo.fechaActualizacion
            },
            consultadoEn: new Date().toISOString()
        };

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify(resultado)
        };

    } catch (error) {
        console.error('Error consultando tasa dólar:', error);
        return {
            statusCode: 502,
            headers,
            body: JSON.stringify({ error: 'No se pudo obtener la tasa del dólar: ' + error.message })
        };
    }
};
