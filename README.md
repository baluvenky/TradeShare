# TradeShare - Trading Signal Processing System

A TypeScript Node.js application that processes trading signals and converts them into buy/sell trade execution commands with event-driven architecture.

## Features

✅ **Type-Safe Signal Processing** - Full TypeScript with discriminated unions  
✅ **Event Emitters** - Real-time event notifications for all trade actions  
✅ **Batch Processing** - Handle multiple signals efficiently  
✅ **Execution History** - Track all trades with timestamps and metrics  
✅ **Signal Classification** - Automatic BUY/SELL categorization  

## Supported Signals

| Signal | Type | Meaning |
|--------|------|---------|
| `LONG` | Buy | Open a long position |
| `LONG_ADD` | Buy | Add to existing long position |
| `EXIT_LONG` | Sell | Close long position |
| `EXIT_SHORT` | Sell | Close short position |
| `SHORT_ADD` | Unknown | Add to short position (contextual) |

## Quick Start

```bash
npm install
npm run dev          # Run with ts-node
npm run build        # Compile TypeScript
npm start            # Run compiled version
```

## Event Emitter API

The `SignalProcessor` class emits events for real-time trade notifications.

### Available Events

```typescript
// Global trade event - fires for every trade
processor.on('trade', (execution) => {
  console.log(`Trade: ${execution.signal} → ${execution.tradeType}`);
});

// Buy signal events
processor.on('buy', (execution) => {
  console.log(`Buy: ${execution.symbol} x${execution.quantity}`);
});

// Sell signal events
processor.on('sell', (execution) => {
  console.log(`Sell: ${execution.symbol}`);
});

// Unknown signal events
processor.on('unknown', (execution) => {
  console.log(`Unknown: ${execution.signal}`);
});

// Signal-specific events
processor.on('signal:LONG', (execution) => {
  console.log(`Long position opened`);
});
```

## Incoming Message Formats (HTTP API)

# message API body sample formats
## {"message":"MCX:FUT:SILVER:LONG:25000"}
## {"message":"MCX:FUT:SILVER:LONG_ADD:25000"}
## {"message":"MCX:FUT:SILVER:LONG_EXIT:25000"}
## {"message":"MCX:FUT:SILVER:SHORT:25000"}
## {"message":"MCX:FUT:SILVER:SHORT_ADD:25000"}
## {"message":"MCX:FUT:SILVER:SHORT_EXIT:25000"}



## {"message":"MCX:FUT:SILVER:LONG:25000"}
## {"message":"MCX:FUT:SILVER:LONG_ADD:25000"}
## {"message":"MCX:FUT:SILVER:LONG_EXIT:25000"}
## {"message":"MCX:FUT:SILVER:SHORT:25000"}
## {"message":"MCX:FUT:SILVER:SHORT_ADD:25000"}
## {"message":"MCX:FUT:SILVER:SHORT_EXIT:25000"}


## {"message":"NIFTY50:OPT:NIFTY:LONG:22933"}
## {"message":"NIFTY50:OPT:NIFTY:LONG_EXIT:22933"}
## {"message":"NIFTY50:OPT:NIFTY:LONG_ADD:22933"}
## {"message":"NIFTY50:OPT:NIFTY:SHORT:22933"}
## {"message":"NIFTY50:OPT:NIFTY:SHORT_ADD:22933"}
## {"message":"NIFTY50:OPT:NIFTY:SHORT_EXIT:22933"}
#

The server accepts a variety of message formats via `POST /message`.

- Simple action format: `ACTION:PRICE` (e.g. `Long:126489`).
- Marketed format: `MARKET:SYMBOL:ACTION[:PRICE]` (e.g. `MCX:SILVER:LONG:12345` or `NIFTY:APPLE:LONG`).

Mapping rules:
- `LONG` / `Long` / `long` → `TradeSignal.LONG` (BUY)
- `LONG_ADD` / `Long Add` → `TradeSignal.LONG_ADD` (BUY + extra buy call)
- `SHORT_ADD` → `TradeSignal.SHORT_ADD` (contextual short add; triggers an extra EXIT_SHORT by default)
- `EXIT_LONG` / `LONG_EXIT` / `EXITLong` → `TradeSignal.EXIT_LONG` (SELL)
- `EXIT_SHORT` → `TradeSignal.EXIT_SHORT` (SELL)

Examples:

```bash
curl -X POST http://localhost:3000/message -H "Content-Type: application/json" -d '{"message":"MCX:SILVER:LONG:12345"}'
curl -X POST http://localhost:3000/message -H "Content-Type: application/json" -d '{"message":"NIFTY:APPLE:EXIT_LONG:12345"}'
curl -X POST http://localhost:3000/message -H "Content-Type: text/plain" --data "Long Add: 126015"
```

The response includes `market` and `symbol` when provided, and `price` if a numeric token is present.


### Event Listener Methods

```typescript
processor.on(event, callback);           // Persistent listener
processor.once(event, callback);         // One-time listener
processor.off(event, callback);          // Remove listener
processor.removeAllListeners(event);     // Remove all
processor.listenerCount(event);          // Get count
```

## Usage Examples

### Single Signal Processing

```typescript
const processor = new SignalProcessor();

processor.on('buy', (execution) => {
  console.log(`BUY: ${execution.symbol} at $${execution.price}`);
});

processor.processSignal(TradeSignal.LONG, {
  symbol: 'AAPL',
  quantity: 100,
  price: 150.25
});
```

### Batch Processing

```typescript
const signals = [
  { signal: TradeSignal.LONG, options: { symbol: 'AAPL', quantity: 50 } },
  { signal: TradeSignal.LONG_ADD, options: { symbol: 'AAPL', quantity: 25 } },
  { signal: TradeSignal.EXIT_LONG, options: { symbol: 'AAPL', quantity: 75 } },
];

processor.processSignalBatch(signals);
```

### Get Execution History

```typescript
const allTrades = processor.getExecutionHistory();
const buys = processor.getExecutionHistory(TradeType.BUY);
const stats = processor.getStatistics();
```

## Project Structure

```
src/
├── types/signals.ts
├── services/signalProcessor.ts
├── utils/
│   ├── eventEmitter.ts
│   └── signalConverter.ts
└── index.ts
```

## Core Interfaces

```typescript
interface TradeExecution {
  signal: TradeSignal;
  tradeType: TradeType;
  timestamp: Date;
  quantity?: number;
  price?: number;
  symbol?: string;
}

interface ProcessingOptions {
  symbol?: string;
  quantity?: number;
  price?: number;
}
```

## Dependencies

- `typescript@^5.0.0` - TypeScript compiler
- `ts-node@^10.9.0` - TypeScript runtime
- `@types/node@^20.0.0` - Node.js types
- `rimraf@^5.0.0` - Cross-platform file deletion

## Development Commands

```bash
npm run build        # Compile TypeScript → dist/
npm run dev          # Run with ts-node
npm start            # Run compiled version
npm run clean        # Remove dist/
```

## Running the Example

```bash
npm run dev    # Demonstrates all features including event emitters
```

Output shows:
- Event listener setup
- Individual signal processing with events
- Batch processing
- Trading statistics
- One-time listeners

## License

MIT
