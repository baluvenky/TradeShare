/**
 * HTTP server to receive messages and forward trading signals
 * POST /message
 */

import http from 'http';
import { SignalProcessor } from './services/signalProcessor';
import { createMessageHandler } from './controllers/messageController';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const processor = new SignalProcessor();
const messageHandler = createMessageHandler(processor);

// Disabled automatic cache warming for message API — always use live NSE fetches
// (startAutoRefresh removed to avoid stale cached expiries)

const server = http.createServer(async (req, res) => {
  if (req.method === 'POST' && req.url === '/message') {
    return messageHandler(req, res);
  }

  // simple health
  if (req.method === 'GET' && req.url === '/healthz') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ ok: false, error: 'not found' }));
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`TradeShare HTTP server listening on http://localhost:${PORT}`);
});
