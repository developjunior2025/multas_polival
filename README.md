# Sistema de Multas - IAPMLG

Sistema de gestión de multas para el **Instituto Autónomo de Policía del Municipio Los Guayos** (IAPMLG), Estado Carabobo, Venezuela.

## Características

- ✅ Registro de Actas de Infracción con número correlativo automático
- 📄 Generación de PDF del Acta de Infracción (fiel al modelo oficial)
- 📊 Dashboard con estadísticas en tiempo real
- 🔍 Búsqueda de multas por cédula, fecha, artículo y estado
- 📈 Histórico de multas por infractor y por artículo
- 📚 Gestión de artículos de la Ordenanza Municipal
- 📤 Exportación a CSV
- ⚙️ Configuración de parámetros (UT, TCMMV, numeración)

## Tecnologías

- **Frontend**: HTML5, CSS3, JavaScript Vanilla
- **Backend**: Netlify Functions (Node.js serverless)
- **Base de datos**: NeonDB (PostgreSQL)
- **PDF**: jsPDF
- **Gráficos**: Chart.js
- **Deploy**: Netlify

## Configuración

### 1. Crear base de datos en NeonDB

1. Ve a [neon.tech](https://neon.tech) y crea una cuenta gratuita
2. Crea un nuevo proyecto
3. Copia el **Connection String** (postgresql://...)

### 2. Instalar dependencias

```bash
npm install
```

### 3. Variables de entorno (desarrollo local)

Crea un archivo `.env` en la raíz del proyecto:

```
DATABASE_URL=postgresql://neondb_owner:TU_PASSWORD@ep-xxx.aws.neon.tech/neondb?sslmode=require
```

### 4. Ejecutar localmente

```bash
npm run dev
```

Esto iniciará Netlify Dev en http://localhost:8888

### 5. Inicializar la base de datos

Ve a la sección **Configuración** en la app y haz clic en **"Inicializar / Verificar Base de Datos"**.

Esto creará automáticamente todas las tablas necesarias.

## Deploy en Netlify

1. Haz push de tu código a GitHub/GitLab
2. Conecta el repositorio en [netlify.com](https://netlify.com)
3. En **Settings → Environment Variables**, agrega:
   - `DATABASE_URL` = tu connection string de NeonDB
4. La build se hace automáticamente (directorio `public/`)

## Estructura del proyecto

```
multas_poliguayos/
├── public/                    # Frontend estático
│   ├── index.html
│   ├── css/styles.css
│   ├── js/
│   │   ├── api.js             # Cliente HTTP
│   │   ├── utils.js           # Utilidades
│   │   ├── pdf.js             # Generación de actas PDF
│   │   ├── app.js             # Router principal
│   │   └── pages/
│   │       ├── dashboard.js
│   │       ├── multas.js
│   │       ├── nueva-multa.js
│   │       ├── historico.js
│   │       ├── articulos.js
│   │       └── configuracion.js
│   └── _redirects             # Redirects de Netlify
├── netlify/
│   └── functions/             # API Serverless
│       ├── db.js              # Conexión NeonDB
│       ├── init-db.js         # Inicializar tablas
│       ├── multas.js          # CRUD multas
│       ├── articulos.js       # CRUD artículos
│       ├── estadisticas.js    # Reportes
│       └── configuracion.js   # Config sistema
├── netlify.toml
├── package.json
└── .env.example
```
