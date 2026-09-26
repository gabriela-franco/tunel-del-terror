require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');

const app = express();
const port = process.env.PORT || 3001;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME || 'tunel_del_terror',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

app.use(express.json());

async function ensureDatabase() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS votes (
      id SERIAL PRIMARY KEY,
      alumno TEXT NOT NULL,
      propuesta TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE UNIQUE INDEX IF NOT EXISTS idx_votes_alumno_unique
    ON votes (LOWER(TRIM(alumno)));
  `);
}

app.post('/api/votos', async (req, res) => {
  try {
    const { alumno, propuesta } = req.body || {};

    if (typeof alumno !== 'string' || typeof propuesta !== 'string') {
      return res.status(400).json({ error: 'Faltan alumno o propuesta' });
    }

    const cleanAlumno = alumno.trim();
    const cleanPropuesta = propuesta.trim();

    if (!cleanAlumno || !cleanPropuesta) {
      return res.status(400).json({ error: 'Alumno o propuesta inválidos' });
    }

    await ensureDatabase();

    const result = await pool.query(
      'INSERT INTO votes (alumno, propuesta) VALUES ($1, $2) RETURNING *',
      [cleanAlumno, cleanPropuesta]
    );

    return res.status(200).json({ ok: true, vote: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Ya existe un voto para este alumno/a' });
    }
    console.error('POST /api/votos error:', error);
    return res.status(500).json({ error: 'Error al guardar el voto' });
  }
});

app.get('/api/resultados', async (_req, res) => {
  try {
    await ensureDatabase();

    const result = await pool.query(`
      SELECT propuesta, COUNT(*) AS total
      FROM votes
      GROUP BY propuesta
      ORDER BY total DESC, propuesta ASC;
    `);

    const counts = {};
    let total = 0;

    for (const row of result.rows) {
      counts[row.propuesta] = Number(row.total);
      total += Number(row.total);
    }

    return res.status(200).json({ total, counts });
  } catch (error) {
    console.error('GET /api/resultados error:', error);
    return res.status(500).json({ error: 'Error al leer los votos' });
  }
});

app.get('/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Health check failed:', error);
    return res.status(500).json({ ok: false, error: 'Database unavailable' });
  }
});

async function start() {
  await ensureDatabase();
  app.listen(port, () => {
    console.log(`Servidor activo en http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
  process.exit(1);
});
