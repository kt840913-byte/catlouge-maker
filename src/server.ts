import 'dotenv/config';
import Fastify from 'fastify';
import { pool } from './db.js';

const app = Fastify({ logger: true });
const port = Number(process.env.PORT ?? 3000);

app.get('/health', async (_request, reply) => {
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', database: 'connected' };
  } catch {
    return reply.code(503).send({ status: 'error', database: 'unavailable' });
  }
});

app.get('/v1/genres', async (_request, reply) => {
  try {
    const result = await pool.query('SELECT id, name FROM genres ORDER BY name');
    return { data: result.rows };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: 'internal_server_error' });
  }
});

app.get<{
  Querystring: { q?: string; genre?: string; limit?: string; offset?: string }
}>('/v1/anime', async (request, reply) => {
  const limit = Math.min(Math.max(Number(request.query.limit ?? 20) || 20, 1), 100);
  const offset = Math.max(Number(request.query.offset ?? 0) || 0, 0);
  const q = request.query.q?.trim();
  const genre = request.query.genre?.trim();

  try {
    const result = await pool.query(
      `SELECT a.id, a.title, a.original_title, a.synopsis, a.format, a.status,
              a.season, a.season_year, a.episodes, a.release_date,
              COALESCE(
                ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
                ARRAY[]::text[]
              ) AS genres
       FROM anime a
       LEFT JOIN anime_genres ag ON ag.anime_id = a.id
       LEFT JOIN genres g ON g.id = ag.genre_id
       WHERE ($1::text IS NULL OR a.title ILIKE '%' || $1 || '%' OR a.original_title ILIKE '%' || $1 || '%')
         AND ($2::text IS NULL OR EXISTS (
           SELECT 1 FROM anime_genres ag2
           JOIN genres g2 ON g2.id = ag2.genre_id
           WHERE ag2.anime_id = a.id AND g2.name ILIKE $2
         ))
       GROUP BY a.id
       ORDER BY a.id
       LIMIT $3 OFFSET $4`,
      [q || null, genre || null, limit, offset]
    );
    return { data: result.rows, pagination: { limit, offset, count: result.rowCount } };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: 'internal_server_error' });
  }
});

app.get<{ Params: { id: string } }>('/v1/anime/:id', async (request, reply) => {
  if (!/^\d+$/.test(request.params.id)) {
    return reply.code(400).send({ error: 'invalid_id', message: 'ID must be a positive integer.' });
  }

  try {
    const result = await pool.query(
      `SELECT a.id, a.title, a.original_title, a.synopsis, a.format, a.status,
              a.season, a.season_year, a.episodes, a.release_date,
              COALESCE(
                ARRAY_AGG(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL),
                ARRAY[]::text[]
              ) AS genres
       FROM anime a
       LEFT JOIN anime_genres ag ON ag.anime_id = a.id
       LEFT JOIN genres g ON g.id = ag.genre_id
       WHERE a.id = $1
       GROUP BY a.id`,
      [request.params.id]
    );

    if (result.rowCount === 0) {
      return reply.code(404).send({ error: 'not_found', message: 'No anime found for this ID.' });
    }
    return { data: result.rows[0] };
  } catch (error) {
    app.log.error(error);
    return reply.code(500).send({ error: 'internal_server_error' });
  }
});

app.addHook('onClose', async () => {
  await pool.end();
});

try {
  await app.listen({ port, host: '0.0.0.0' });
} catch (error) {
  app.log.error(error);
  process.exit(1);
}
