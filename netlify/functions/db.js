// netlify/functions/db.js - Shared database connection
// Note: This file is used as a shared module by other functions.
// Netlify will not expose it as an endpoint because it has no exports.handler.
const { neon } = require('@neondatabase/serverless');

function getDb() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please configure it in Netlify → Site settings → Environment variables.'
    );
  }
  return neon(connectionString);
}

// Initialize all tables
async function initDb() {
  const sql = getDb();

  // Tabla de artículos de infracción
  await sql`
    CREATE TABLE IF NOT EXISTS articulos (
      id SERIAL PRIMARY KEY,
      numero VARCHAR(20) NOT NULL,
      literal VARCHAR(10),
      descripcion TEXT NOT NULL,
      valor_ut DECIMAL(10, 2) NOT NULL DEFAULT 0,
      activo BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Tabla de multas/actas de infracción
  await sql`
    CREATE TABLE IF NOT EXISTS multas (
      id SERIAL PRIMARY KEY,
      numero_acta VARCHAR(20) UNIQUE NOT NULL,
      fecha DATE NOT NULL,
      hora TIME,
      turno VARCHAR(2) DEFAULT 'AM',
      
      -- Lugar de la infracción
      direccion_infraccion TEXT NOT NULL,
      
      -- Datos del infractor
      nombres VARCHAR(100) NOT NULL,
      apellidos VARCHAR(100) NOT NULL,
      cedula VARCHAR(20) NOT NULL,
      telefono VARCHAR(20),
      direccion_infractor TEXT,
      
      -- Datos del vehículo
      marca VARCHAR(50),
      modelo VARCHAR(50),
      anio VARCHAR(4),
      tipo VARCHAR(50),
      color VARCHAR(30),
      matricula VARCHAR(20),
      
      -- Fundamento legal
      articulo_id INTEGER REFERENCES articulos(id),
      articulo_numero VARCHAR(20),
      articulo_literal VARCHAR(10),
      descripcion_infraccion TEXT,
      
      -- Valores monetarios
      valor_ut DECIMAL(10, 2),
      valor_tcmmv DECIMAL(10, 2),
      importe_multa_bs DECIMAL(15, 2),
      
      -- Funcionario
      funcionario VARCHAR(100),
      ci_funcionario VARCHAR(20),
      
      -- Estado: PENDIENTE, PAGADO, ANULADO
      estado VARCHAR(20) DEFAULT 'PENDIENTE',
      
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Tabla de configuración del sistema
  await sql`
    CREATE TABLE IF NOT EXISTS configuracion (
      id SERIAL PRIMARY KEY,
      clave VARCHAR(50) UNIQUE NOT NULL,
      valor TEXT NOT NULL,
      descripcion TEXT,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `;

  // Valores por defecto
  await sql`
    INSERT INTO configuracion (clave, valor, descripcion)
    VALUES 
      ('valor_ut', '0.02', 'Valor de la Unidad Tributaria en Bs.'),
      ('valor_tcmmv', '1.00', 'Valor del TCMMV en USD'),
      ('ultimo_numero_acta', '0', 'Último número de acta generado')
    ON CONFLICT (clave) DO NOTHING
  `;

  return { success: true };
}

module.exports = { getDb, initDb };
