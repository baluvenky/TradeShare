/**
 * Message Controller
 * Parses incoming messages and delegates to appropriate strategy processors
 */

import { IncomingMessage, ServerResponse } from 'http';
import { SignalProcessor } from '../services/signalProcessor';
import { EquityService } from '../services/equityService';
import { MCXCommodityService } from '../services/mcxCommodityService';
import { NIFTYFuturesService } from '../services/niftyFuturesService';
import { NIFTYOptionsService } from '../services/niftyOptionsService';
import { BANKNIFTYOptionsService } from '../services/bankniftyOptionsService';
import { TradeSignal, InstrumentType } from '../types/signals';

function normalizeKey(raw: string): string {
  // Remove all non-alphanumeric characters and underscores, convert to lowercase
  // Then replace underscores with nothing to normalize both "long_exit" and "longexit" formats
  return raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().replace(/_/g, '');
}

interface ParsedMessage {
  signal: TradeSignal | null;
  market?: string;
  symbol?: string;
  price?: number;
  instrumentType?: InstrumentType;
}

/**
 * Convert action string to TradeSignal enum
 */
function actionToSignal(action: string): TradeSignal | null {
  // Normalized action has no underscores or special chars, all lowercase
  // Examples: "long", "longexit", "longadd", "shortadd", "exitlong", etc.
  console.log(`[DEBUG] actionToSignal received: "${action}"`);
  
  switch (action) {
    // Exit signals (check BEFORE entry signals to avoid partial matches)
    case 'exitlong':
    case 'longexit':
    case 'exitlong':  // typo variant
      return TradeSignal.EXIT_LONG;
    
    case 'exitshort':
    case 'shortexit':
      return TradeSignal.EXIT_SHORT;
    
    case 'longadd':
      return TradeSignal.LONG_ADD;
    // Entry signals
    case 'long':
      return TradeSignal.LONG;
    
    
    case 'shortadd':
    case 'short':
      return TradeSignal.SHORT_ADD;
    
    default:
      return null;
  }
}

/**
 * Parse message formats:
 * 1. MARKET:INSTRUMENT:SYMBOL:ACTION[:PRICE]
 *    e.g., NSE:EQ:INFY:LONG:2500, MCX:FUT:SILVER:LONG:25000, NIFTY:OPT:NIFTY:LONG:24800
 * 2. MARKET:SYMBOL:ACTION[:PRICE] (auto-detect instrument type)
 *    e.g., MCX:SILVER:LONG:25000, NIFTY:NIFTY:LONG:24800
 * 3. ACTION:PRICE (legacy)
 *    e.g., LONG:126489
 */
function parseMessage(message: string): ParsedMessage {
  if (!message) return { signal: null };
  const parts = message.split(':').map(p => p.trim()).filter(p => p.length > 0);
  console.log(`[DEBUG] parseMessage - message: "${message}", parts: ${JSON.stringify(parts)}`);

  // MARKET:INSTRUMENT:SYMBOL:ACTION[:PRICE]
  if (parts.length >= 4) {
    const market = parts[0].toUpperCase();
    const instrumentRaw = parts[1].toUpperCase();
    const symbol = parts[2];
    const action = normalizeKey(parts[3]);
    const rawPrice = parts[4];
    const price = rawPrice && /[0-9]/.test(rawPrice) ? Number(rawPrice.replace(/[^0-9.]/g, '')) : undefined;
    console.log(`[DEBUG] Format 1 - market: "${market}", instrument: "${instrumentRaw}", symbol: "${symbol}", action (normalized): "${action}", price: ${price}`);

    let instrumentType: InstrumentType | undefined;
    if (instrumentRaw === 'EQ') instrumentType = InstrumentType.EQ;
    else if (instrumentRaw === 'FUT') instrumentType = InstrumentType.FUT;
    else if (instrumentRaw === 'OPT') instrumentType = InstrumentType.OPT;

    const signal = actionToSignal(action);
    return { signal, market, symbol, price, instrumentType };
  }

  // MARKET:SYMBOL:ACTION[:PRICE] (auto-detect instrument type from market)
  /*if (parts.length >= 3) {
    const market = parts[0].toUpperCase();
    const symbol = parts[1];
    const action = normalizeKey(parts[2]);
    const rawPrice = parts[3];
    const price = rawPrice && /[0-9]/.test(rawPrice) ? Number(rawPrice.replace(/[^0-9.]/g, '')) : undefined;

    // Auto-detect instrument type from market
    let instrumentType: InstrumentType | undefined;
    if (['MCX'].includes(market)) {
      instrumentType = InstrumentType.FUT;
    } else if (['NIFTY', 'NIFTY50', 'BANKNIFTY'].includes(market)) {
      instrumentType = InstrumentType.OPT;
    } else if (['NSE', 'BSE'].includes(market)) {
      instrumentType = InstrumentType.EQ;
    }

    const signal = actionToSignal(action);
    return { signal, market, symbol, price, instrumentType };
  }*/

  // ACTION:PRICE (legacy/simple format)
  /*if (parts.length >= 1) {
    const action = normalizeKey(parts[0]);
    const rawPrice = parts[1];
    const price = rawPrice && /[0-9]/.test(rawPrice) ? Number(rawPrice.replace(/[^0-9.]/g, '')) : undefined;

    const signal = actionToSignal(action);
    return { signal, price };
  }*/

  return { signal: null };
}

function parseBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString('utf8').trim();
      if (raw.startsWith('{')) {
        try {
          const obj = JSON.parse(raw);
          if (typeof obj.message === 'string') return resolve(obj.message);
          return resolve(raw);
        } catch (err) {
          return resolve(raw);
        }
      }
      resolve(raw);
    });
    req.on('error', reject);
  });
}

function toSerializable(exec: any) {
  return {
    signal: exec.signal,
    tradeType: exec.tradeType,
    timestamp: exec.timestamp?.toISOString?.() ?? exec.timestamp,
    symbol: exec.symbol,
    quantity: exec.quantity,
    price: exec.price,
    market: exec.market,
    instrumentType: exec.instrumentType,
    optionType: exec.optionType,
    strike: exec.strike,
    expiry: exec.expiry,
  };
}

export function createMessageHandler(processor: SignalProcessor) {
  const eqService = new EquityService(processor);
  const mcxService = new MCXCommodityService(processor);
  const niftyFutService = new NIFTYFuturesService(processor);
  const niftyOptService = new NIFTYOptionsService(processor);
  const bankniftyOptService = new BANKNIFTYOptionsService(processor);

  return async function handleMessage(req: IncomingMessage, res: ServerResponse) {
    try {
      const message = await parseBody(req);
      const parsed = parseMessage(message);
      const signal = parsed.signal;

      // For message API requests always bypass expiry cache (force live fetch)

      if (!signal) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'Unknown signal format', received: message }));
        return;
      }

      const executions: any[] = [];

      // Route to appropriate service based on instrument type and market
      if (parsed.instrumentType === InstrumentType.EQ) {
        // Equity trade (NSE/BSE)
        const result = eqService.process(signal, {
          symbol: parsed.symbol || 'UNKNOWN',
          price: parsed.price,
          market: (parsed.market as 'NSE' | 'BSE') || 'NSE',
        });
        executions.push(toSerializable(result));
      } else if (parsed.instrumentType === InstrumentType.FUT) {
        // Futures trade (NIFTY or MCX)
        if (parsed.market === 'MCX') {
          const result = mcxService.process(signal, {
            symbol: parsed.symbol || 'UNKNOWN',
            price: parsed.price,
          });
          executions.push(toSerializable(result));
        } else if (['NIFTY', 'NIFTY50'].includes(parsed.market || '')) {
          const result = await niftyFutService.process(signal, {
            symbol: (parsed.market as 'NIFTY' | 'NIFTY50') || 'NIFTY',
            price: parsed.price,
          });
          executions.push(toSerializable(result));
        }
      } else if (parsed.instrumentType === InstrumentType.OPT) {
        // Options trade (NIFTY/NIFTY50)
        if (parsed.market === 'BANKNIFTY') {
          const result = await bankniftyOptService.process(signal, {
            symbol: 'BANKNIFTY',
            price: parsed.price,
          });
          executions.push(toSerializable(result));
        } else if (['NIFTY', 'NIFTY50'].includes(parsed.market || '')) {
          const result = await niftyOptService.process(signal, {
            symbol: (parsed.market as 'NIFTY' | 'NIFTY50') || 'NIFTY',
            price: parsed.price || (parsed.market === 'NIFTY50' ? 52000 : 24800),
          });
          executions.push(toSerializable(result));
        }
      } else {
        // Legacy behavior: process signal directly through SignalProcessor
        const exec = processor.processSignal(signal, {
          symbol: parsed.symbol,
          price: parsed.price,
          market: parsed.market,
          instrumentType: parsed.instrumentType,
        });
        executions.push(toSerializable(exec));
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, executions }));
      return;
    } catch (err: any) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: false, error: String(err) }));
      return;
    }
  };
}
