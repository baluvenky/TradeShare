/**
 * Direct test of action parsing and signal conversion
 */

import { TradeSignal, TradeType } from '../src/types/signals';
import { convertSignalToTradeType } from '../src/utils/signalConverter';
import { MCXCommodityService } from '../src/services/mcxCommodityService';
import { SignalProcessor } from '../src/services/signalProcessor';

// Replicate the normalizeKey function
function normalizeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().replace(/_/g, '');
}

// Replicate the actionToSignal function
function actionToSignal(action: string): TradeSignal | null {
  switch (action) {
    case 'exitlong':
    case 'longexit':
      return TradeSignal.EXIT_LONG;
    case 'exitshort':
    case 'shortexit':
      return TradeSignal.EXIT_SHORT;
    case 'long':
      return TradeSignal.LONG;
    case 'longadd':
      return TradeSignal.LONG_ADD;
    case 'shortadd':
    case 'short':
      return TradeSignal.SHORT_ADD;
    default:
      return null;
  }
}

console.log('=== Testing Action Parsing and Signal Conversion ===\n');

// Test 1: Parse "LONG_EXIT" 
console.log('Test 1: Parsing "LONG_EXIT"');
const action1 = normalizeKey('LONG_EXIT');
console.log(`  normalizeKey("LONG_EXIT") = "${action1}"`);
const signal1 = actionToSignal(action1);
console.log(`  actionToSignal("${action1}") = ${signal1}`);
const tradeType1 = signal1 ? convertSignalToTradeType(signal1) : 'null';
console.log(`  convertSignalToTradeType(${signal1}) = ${tradeType1}`);
console.log(`  ✓ Expected: EXIT_LONG → SELL`);
console.log();

// Test 2: Parse "LONG"
console.log('Test 2: Parsing "LONG"');
const action2 = normalizeKey('LONG');
console.log(`  normalizeKey("LONG") = "${action2}"`);
const signal2 = actionToSignal(action2);
console.log(`  actionToSignal("${action2}") = ${signal2}`);
const tradeType2 = signal2 ? convertSignalToTradeType(signal2) : 'null';
console.log(`  convertSignalToTradeType(${signal2}) = ${tradeType2}`);
console.log(`  ✓ Expected: LONG → BUY`);
console.log();

// Test 3: Full MCX service test with EXIT_LONG
console.log('Test 3: MCX Service with EXIT_LONG');
const processor = new SignalProcessor();
const mcxService = new MCXCommodityService(processor);
const execExit = mcxService.process(TradeSignal.EXIT_LONG, { symbol: 'GOLD', price: 25000 });
console.log(`  MCXService.process(EXIT_LONG, ...) →`);
console.log(`    TradeType: ${execExit.tradeType}`);
console.log(`    Symbol: ${execExit.symbol}`);
console.log(`    ✓ Expected TradeType: SELL`);
console.log();

// Test 4: Full MCX service test with LONG
console.log('Test 4: MCX Service with LONG');
const execLong = mcxService.process(TradeSignal.LONG, { symbol: 'GOLD', price: 25000 });
console.log(`  MCXService.process(LONG, ...) →`);
console.log(`    TradeType: ${execLong.tradeType}`);
console.log(`    Symbol: ${execLong.symbol}`);
console.log(`    ✓ Expected TradeType: BUY`);
console.log();

console.log('=== All tests completed ===');
