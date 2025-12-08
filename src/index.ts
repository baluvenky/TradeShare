/**
 * TradeShare - Trading Signal Processing Application
 * Main entry point with Event Emitter demonstrations
 */

import SignalProcessor from './services/signalProcessor';
import { TradeSignal, TradeType } from './types/signals';

function main() {

  console.log('🚀 TradeShare - Trading Signal Processor with Event Emitters');
  console.log('==========================================================\n');

  const processor = new SignalProcessor();

  // Example 1: Register event listeners
  console.log('📡 Setting up Event Listeners:\n');

  // Listen to all trades
  processor.on('trade', (execution) => {
    console.log(`✓ Trade Event: ${execution.signal} → ${execution.tradeType}`);
  });

  // Listen to buy signals
  processor.on('buy', (execution) => {
    console.log(`💰 BUY Signal: ${execution.signal} for ${execution.symbol} x${execution.quantity} @ $${execution.price}`);
  });

  // Listen to sell signals
  processor.on('sell', (execution) => {
    console.log(`💸 SELL Signal: ${execution.signal} for ${execution.symbol} x${execution.quantity} @ $${execution.price}`);
  });

  // Listen to unknown signals
  processor.on('unknown', (execution) => {
    console.log(`❓ UNKNOWN Signal: ${execution.signal}`);
  });

  // Listen to specific signal type
  processor.on('signal:LONG', (execution) => {
    console.log(`🎯 LONG Position Opened: ${execution.symbol}`);
  });

  console.log('\n📊 Processing Individual Signals:\n');
  
  const signals = [
    TradeSignal.LONG,
    TradeSignal.LONG_ADD,
    TradeSignal.EXIT_LONG,
    TradeSignal.EXIT_SHORT,
    TradeSignal.SHORT_ADD,
  ];

  signals.forEach(signal => {
    processor.processSignal(signal, {
      symbol: 'AAPL',
      quantity: 100,
      price: 150.25,
    });
  });

  // Example 2: Batch processing with events
  console.log('\n\n📈 Batch Processing Example:\n');
  
  const batchSignals = [
    { signal: TradeSignal.LONG, options: { symbol: 'GOOGL', quantity: 50, price: 140.50 } },
    { signal: TradeSignal.LONG_ADD, options: { symbol: 'GOOGL', quantity: 25, price: 141.00 } },
    { signal: TradeSignal.EXIT_LONG, options: { symbol: 'GOOGL', quantity: 75, price: 142.75 } },
  ];

  const batchResults = processor.processSignalBatch(batchSignals);
  console.log(`\nProcessed ${batchResults.length} signals in batch\n`);

  // Example 3: View statistics
  console.log('\n📊 Trading Statistics:\n');
  const stats = processor.getStatistics();
  console.log(`Total Trades: ${stats.totalTrades}`);
  console.log(`Buy Signals: ${stats.buyTrades}`);
  console.log(`Sell Signals: ${stats.sellTrades}`);
  console.log(`Unknown Signals: ${stats.unknownTrades}\n`);

  // Example 4: View execution history
  console.log('📋 Buy Signal Execution History:\n');
  const buyExecutions = processor.getExecutionHistory(TradeType.BUY);
  buyExecutions.forEach((exec, idx) => {
    console.log(`${idx + 1}. ${exec.signal} on ${exec.symbol} - ${exec.timestamp.toLocaleTimeString()}`);
  });

  // Example 5: One-time event listener
  console.log('\n\n🎯 One-Time Event Listener (fires once):\n');
  processor.once('buy', (execution) => {
    console.log(`⚡ ONE-TIME: First buy signal received - ${execution.signal}`);
  });

  processor.processSignal(TradeSignal.LONG, { symbol: 'MSFT', quantity: 50, price: 380.00 });
  processor.processSignal(TradeSignal.LONG, { symbol: 'MSFT', quantity: 50, price: 381.00 });

  console.log('\n✅ TradeShare processing complete!');
}

// Automatic cache refresh disabled — message API will always fetch live expiries

main();
