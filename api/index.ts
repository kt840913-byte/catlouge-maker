import type { IncomingMessage, ServerResponse } from 'node:http';
import { app } from '../src/server.js';

let ready: Promise<void> | undefined;

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    ready ??= app.ready();
    await ready;
    app.server.emit('request', req, res);
  } catch (error) {
    console.error('API startup failed:', error);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.setHeader('content-type', 'application/json');
    }
    res.end(JSON.stringify({ error: 'api_startup_failed' }));
  }
}
