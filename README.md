# Anime Catalog API

An independent anime catalogue API built with Fastify and PostgreSQL.

## Stack
- Node.js 20+
- TypeScript
- Fastify
- PostgreSQL (Neon-compatible)

## Run locally
1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Put your Neon connection string in `DATABASE_URL` inside `.env`. Never commit this secret.
4. Install dependencies: `npm install`
5. Create the database tables by running `schema.sql` in the Neon SQL Editor.
6. Start development server: `npm run dev`

The API starts on `http://localhost:3000`.

## Endpoints
- `GET /health` — health check
- `GET /v1/anime` — list anime; supports `q`, `genre`, `limit`, and `offset`
- `GET /v1/anime/:id` — fetch one anime by our internal ID
- `GET /v1/genres` — list genres

Example: `GET /v1/anime?genre=Fantasy&limit=10`

## Data ownership and licensing
This project starts with a small set of original sample records for development. Add or import real catalogue data only when you have the right to use it, and record sources/licences as appropriate. Anime names and factual metadata may be treated differently from artwork, synopses, translations, and other copyrighted material. Do not scrape or republish another service's database without checking its terms and applicable law.

## Current stage
Starter project: add your own records to PostgreSQL, then expand the API, validation, tests, documentation, and deployment.
