/**
 * Test all signal conversion logic
 * Verify:
 * - LONG/LONG_ADD → BUY + CE (call)
 * - SHORT_ADD → BUY + PE (put)
 * - EXIT_LONG → SELL + CE (call)
 * - EXIT_SHORT → SELL + PE (put)
 * - MCX:FUT:SILVER:LONG_EXIT → SELL (futures)
 */

import { TradeSignal, TradeType } from '../src/types/signals';
import { convertSignalToTradeType, isBuySignal, isSellSignal } from '../src/utils/signalConverter';
import { NIFTYOptionsService } from '../src/services/niftyOptionsService';
import { BANKNIFTYOptionsService } from '../src/services/bankniftyOptionsService';
import { MCXCommodityService } from '../src/services/mcxCommodityService';
import { NIFTYFuturesService } from '../src/services/niftyFuturesService';
import { SignalProcessor } from '../src/services/signalProcessor';

console.log('=== Signal Conversion Logic Tests ===\n');

// Test 1: Signal to TradeType conversion
console.log('1. Signal → TradeType Mapping:');
console.log(`   LONG → ${convertSignalToTradeType(TradeSignal.LONG)} (expected: BUY)`);
console.log(`   LONG_ADD → ${convertSignalToTradeType(TradeSignal.LONG_ADD)} (expected: BUY)`);
console.log(`   SHORT_ADD → ${convertSignalToTradeType(TradeSignal.SHORT_ADD)} (expected: BUY)`);
console.log(`   EXIT_LONG → ${convertSignalToTradeType(TradeSignal.EXIT_LONG)} (expected: SELL)`);
console.log(`   EXIT_SHORT → ${convertSignalToTradeType(TradeSignal.EXIT_SHORT)} (expected: SELL)`);

// Test 2: Buy/Sell signal checks
console.log('\n2. Buy Signal Checks:');
console.log(`   isBuySignal(LONG) → ${isBuySignal(TradeSignal.LONG)} (expected: true)`);
console.log(`   isBuySignal(LONG_ADD) → ${isBuySignal(TradeSignal.LONG_ADD)} (expected: true)`);
console.log(`   isBuySignal(SHORT_ADD) → ${isBuySignal(TradeSignal.SHORT_ADD)} (expected: true)`);
console.log(`   isBuySignal(EXIT_LONG) → ${isBuySignal(TradeSignal.EXIT_LONG)} (expected: false)`);

console.log('\n3. Sell Signal Checks:');
console.log(`   isSellSignal(EXIT_LONG) → ${isSellSignal(TradeSignal.EXIT_LONG)} (expected: true)`);
console.log(`   isSellSignal(EXIT_SHORT) → ${isSellSignal(TradeSignal.EXIT_SHORT)} (expected: true)`);
console.log(`   isSellSignal(LONG) → ${isSellSignal(TradeSignal.LONG)} (expected: false)`);

// Test 3: NIFTY Options with all signals
console.log('\n4. NIFTY Options - Option Type Assignment:');
const processor = new SignalProcessor();
const niftyOpt = new NIFTYOptionsService(processor);

(async () => {
  const testCases = [
    { signal: TradeSignal.LONG, desc: 'LONG' },
    { signal: TradeSignal.LONG_ADD, desc: 'LONG_ADD' },
    { signal: TradeSignal.SHORT_ADD, desc: 'SHORT_ADD (PE BUY)' },
    { signal: TradeSignal.EXIT_LONG, desc: 'EXIT_LONG (CE SELL)' },
    { signal: TradeSignal.EXIT_SHORT, desc: 'EXIT_SHORT (PE SELL)' },
  ];

  for (const tc of testCases) {
    const exec = await niftyOpt.process(tc.signal, {
      symbol: 'NIFTY',
      price: 24800,
      noCache: true,
    });
    console.log(`   ${tc.desc}:`);
    console.log(`     TradeType: ${exec.tradeType}, OptionType: ${exec.optionType}, Symbol: ${exec.symbol}`);
  }

  // Test 4: BANKNIFTY Options
  console.log('\n5. BANKNIFTY Options - Option Type Assignment:');
  const bankniftyOpt = new BANKNIFTYOptionsService(processor);
  const testCases2 = [
    { signal: TradeSignal.LONG, desc: 'LONG (CE BUY)' },
    { signal: TradeSignal.SHORT_ADD, desc: 'SHORT_ADD (PE BUY)' },
    { signal: TradeSignal.EXIT_SHORT, desc: 'EXIT_SHORT (PE SELL)' },
  ];

  for (const tc of testCases2) {
    const exec = await bankniftyOpt.process(tc.signal, {
      symbol: 'BANKNIFTY',
      price: 43000,
      noCache: true,
    });
    console.log(`   ${tc.desc}:`);
    console.log(`     TradeType: ${exec.tradeType}, OptionType: ${exec.optionType}, Symbol: ${exec.symbol}`);
  }

  // Test 5: MCX Futures
  console.log('\n6. MCX Futures - Trade Type:');
  const mcx = new MCXCommodityService(processor);
  const mcxLong = mcx.process(TradeSignal.LONG, { symbol: 'SILVER', price: 25000 });
  const mcxExit = mcx.process(TradeSignal.EXIT_LONG, { symbol: 'SILVER', price: 25000 });
  console.log(`   LONG: TradeType=${mcxLong.tradeType}, Symbol=${mcxLong.symbol}`);
  console.log(`   EXIT_LONG: TradeType=${mcxExit.tradeType}, Symbol=${mcxExit.symbol}`);

  // Test 6: NIFTY Futures
  console.log('\n7. NIFTY Futures - Trade Type:');
  const niftyFut = new NIFTYFuturesService(processor);
  const futLong = await niftyFut.process(TradeSignal.LONG, { symbol: 'NIFTY', noCache: true });
  const futExit = await niftyFut.process(TradeSignal.EXIT_LONG, { symbol: 'NIFTY', noCache: true });
  console.log(`   LONG: TradeType=${futLong.tradeType}, Symbol=${futLong.symbol}`);
  console.log(`   EXIT_LONG: TradeType=${futExit.tradeType}, Symbol=${futExit.symbol}`);

  console.log('\n=== All Tests Completed ===');
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
