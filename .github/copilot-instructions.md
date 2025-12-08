# TradeShare - AI Coding Agent Instructions

## Project Overview

TradeShare is a TypeScript Node.js application for processing trading signals and converting them into buy/sell trade execution commands with an event-driven architecture.

**Key Purpose**: Convert trading signals (LONG, LONG_ADD, EXIT_LONG, EXIT_SHORT, SHORT_ADD) into actionable trade types (BUY/SELL) with proper execution tracking and real-time event notifications.

## Architecture

### Signal Processing Flow with Events

```
Trading Signal → SignalProcessor → TradeType Conversion → Emit Events → Listeners React
```

**Main Components**:
- `src/types/signals.ts` - Core enums and interfaces (TradeSignal, TradeType, TradeExecution)
- `src/services/signalProcessor.ts` - SignalProcessor class with event emitter support
- `src/utils/signalConverter.ts` - Pure utility functions for signal mapping
- `src/utils/eventEmitter.ts` - Custom TradeEventEmitter implementation (no external dependencies)
- `src/index.ts` - Example usage demonstrating event-driven patterns

### Signal Classification

**Buy Signals**: `LONG`, `LONG_ADD`
- Automatically emit 'buy' events and signal-specific events (signal:LONG, signal:LONG_ADD)

**Sell Signals**: `EXIT_LONG`, `EXIT_SHORT`
- Automatically emit 'sell' events and signal-specific events

**Contextual**: `SHORT_ADD`
- Treated as UNKNOWN unless handling short position context

## Key Patterns & Conventions

### 1. Event-Driven Architecture

All signals emit events through the custom `TradeEventEmitter`:

```typescript
// Listen to all trades
processor.on('trade', (execution) => { /* ... */ });

// Listen to specific types
processor.on('buy', (execution) => { /* ... */ });
processor.on('sell', (execution) => { /* ... */ });

// Listen to specific signals
processor.on('signal:LONG', (execution) => { /* ... */ });

// One-time listeners
processor.once('buy', (execution) => { /* ... */ });
```

### 2. Custom Event Emitter Implementation

Uses `TradeEventEmitter` in `src/utils/eventEmitter.ts` - no external event libraries. Methods:
- `on(event, listener)` - Persistent listener
- `once(event, listener)` - Auto-removes after first call
- `off(event, listener)` - Remove specific listener
- `emit(event, ...args)` - Emit event to all listeners
- `removeAllListeners(event?)` - Clear listeners
- `listenerCount(event)` - Get listener count

### 3. Type-Safe Signal Handling

Use discriminated union types with type guards:

```typescript
// In signalConverter.ts
export function isBuySignal(signal: TradeSignal): signal is BuySignal {
  return signal === TradeSignal.LONG || signal === TradeSignal.LONG_ADD;
}
```

### 4. SignalProcessor Class Pattern

Maintains execution history and provides event interface:
- `processSignal()` - Process single signal, emit events
- `processSignalBatch()` - Process multiple signals (fires events for each)
- `getExecutionHistory()` - Filter by trade type
- `getStatistics()` - Summary of trading activity
- Event listener methods: `on()`, `once()`, `off()`, `removeAllListeners()`

### 5. Adding New Signals

1. Add to `TradeSignal` enum in `src/types/signals.ts`
2. Update `convertSignalToTradeType()` in `src/utils/signalConverter.ts`
3. SignalProcessor automatically emits `signal:{NAME}` events
4. Update type unions (`BuySignal`, `SellSignal`) if needed

## Development Workflow

### Build and Run

```bash
npm install              # Install dependencies
npm run build           # Compile TypeScript → dist/
npm run dev             # Run with ts-node (no compilation)
npm start               # Run compiled version
npm run clean           # Remove dist/
```

### Project Structure

```
src/
  types/
    signals.ts           - Signal enums and interfaces
  services/
    signalProcessor.ts   - Main business logic with events
  utils/
    eventEmitter.ts      - Custom event emitter
    signalConverter.ts   - Helper functions
  index.ts               - Example usage with events
```

## Testing New Features

Example of event-driven signal processing:

```typescript
const processor = new SignalProcessor();

// Listen for buy trades
processor.on('buy', (execution) => {
  console.log(`Buy: ${execution.symbol} x${execution.quantity}`);
});

// Process signal - automatically emits 'trade' and 'buy' events
processor.processSignal(TradeSignal.LONG, {
  symbol: 'AAPL',
  quantity: 100,
  price: 150.25
});

// Batch processing with events
processor.processSignalBatch([
  { signal: TradeSignal.LONG_ADD, options: { symbol: 'AAPL', quantity: 50 } }
]);
```

## Dependencies

- `typescript@^5.0.0` - TypeScript compiler
- `ts-node@^10.9.0` - Development runtime
- `@types/node@^20.0.0` - Node.js type definitions
- `rimraf@^5.0.0` - Build cleanup utility

## Important Files

- `package.json` - Scripts and dependencies
- `tsconfig.json` - Strict TypeScript configuration
- `src/utils/eventEmitter.ts` - Core event system (zero external dependencies)
