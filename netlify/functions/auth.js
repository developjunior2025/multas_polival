// netlify/functions/auth.js
const { getDb } = require('./db');
const crypto = require('crypto');

function hashPassword(password) {
    return crypto.createHash('sha256').update(password + 'iapmlg_salt_2024').digest('hex');
}

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
        // POST /api/auth → Login
        if (event.httpMethod === 'POST') {
            const { username, password } = JSON.parse(event.body || '{}');

            if (!username || !password) {
                return { statusCode: 400, headers, body: JSON.stringify({ error: 'Usuario y contraseña son requeridos' }) };
            }

            // Get stored credentials from configuracion
            const rows = await sql`
                SELECT clave, valor FROM configuracion 
                WHERE clave IN ('admin_username', 'admin_password_hash')
            `;

            const cfg = {};
            rows.forEach(r => { cfg[r.clave] = r.valor; });

            // Default credentials if not set: admin / admin123
            const storedUsername = cfg['admin_username'] || 'admin';
            const storedHash = cfg['admin_password_hash'] || hashPassword('admin123');

            if (username !== storedUsername || hashPassword(password) !== storedHash) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Usuario o contraseña incorrectos' }) };
            }

            // Generate simple session token
            const token = crypto.randomBytes(32).toString('hex');
            const expiry = new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(); // 8 hours

            // Store token in configuracion
            await sql`
                INSERT INTO configuracion (clave, valor, descripcion)
                VALUES ('session_token', ${token}, 'Token de sesión activo')
                ON CONFLICT (clave) DO UPDATE SET valor = ${token}, updated_at = NOW()
            `;
            await sql`
                INSERT INTO configuracion (clave, valor, descripcion)
                VALUES ('session_expiry', ${expiry}, 'Fecha de expiración de sesión')
                ON CONFLICT (clave) DO UPDATE SET valor = ${expiry}, updated_at = NOW()
            `;

            return {
                statusCode: 200, headers,
                body: JSON.stringify({ success: true, token, username: storedUsername })
            };
        }

        // GET /api/auth → Verify token
        if (event.httpMethod === 'GET') {
            const token = event.queryStringParameters?.token;
            if (!token) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Token no proporcionado' }) };
            }

            const rows = await sql`
                SELECT clave, valor FROM configuracion 
                WHERE clave IN ('session_token', 'session_expiry', 'admin_username')
            `;
            const cfg = {};
            rows.forEach(r => { cfg[r.clave] = r.valor; });

            if (!cfg['session_token'] || cfg['session_token'] !== token) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesión inválida' }) };
            }

            if (cfg['session_expiry'] && new Date(cfg['session_expiry']) < new Date()) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'Sesión expirada' }) };
            }

            return {
                statusCode: 200, headers,
                body: JSON.stringify({ valid: true, username: cfg['admin_username'] || 'admin' })
            };
        }

        // PUT /api/auth → Change password
        if (event.httpMethod === 'PUT') {
            const { token, newUsername, newPassword } = JSON.parse(event.body || '{}');

            // Verify token first
            const rows = await sql`
                SELECT clave, valor FROM configuracion 
                WHERE clave IN ('session_token', 'session_expiry')
            `;
            const cfg = {};
            rows.forEach(r => { cfg[r.clave] = r.valor; });

            if (!cfg['session_token'] || cfg['session_token'] !== token) {
                return { statusCode: 401, headers, body: JSON.stringify({ error: 'No autorizado' }) };
            }

            if (newUsername) {
                await sql`
                    INSERT INTO configuracion (clave, valor, descripcion)
                    VALUES ('admin_username', ${newUsername}, 'Nombre de usuario administrador')
                    ON CONFLICT (clave) DO UPDATE SET valor = ${newUsername}, updated_at = NOW()
                `;
            }

            if (newPassword) {
                const newHash = hashPassword(newPassword);
                await sql`
                    INSERT INTO configuracion (clave, valor, descripcion)
                    VALUES ('admin_password_hash', ${newHash}, 'Hash de contraseña administrador')
                    ON CONFLICT (clave) DO UPDATE SET valor = ${newHash}, updated_at = NOW()
                `;
            }

            return {
                statusCode: 200, headers,
                body: JSON.stringify({ success: true, message: 'Credenciales actualizadas' })
            };
        }

        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

    } catch (error) {
        console.error('Error in auth:', error);
        return {
            statusCode: 500, headers,
            body: JSON.stringify({ error: error.message })
        };
    }
};
