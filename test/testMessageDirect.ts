/**
 * Direct test of the option service with the problematic message
 */
import { SignalProcessor } from '../src/services/signalProcessor';
import { NIFTYOptionsService } from '../src/services/niftyOptionsService';
import { TradeSignal } from '../src/types/signals';

const processor = new SignalProcessor();
const niftyOptService = new NIFTYOptionsService(processor);

console.log('=== Testing NIFTY50:OPT:NIFTY:LONG:22933 ===\n');

// Test the service directly
(async () => {
  const execution = await niftyOptService.process(TradeSignal.LONG, {
    symbol: 'NIFTY50',
    price: 22933,
    skipCurrentWeek: true,
  });

  console.log('Execution Result:');
  console.log(`  Signal: ${execution.signal}`);
  console.log(`  Trade Type: ${execution.tradeType}`);
  console.log(`  Symbol: ${execution.symbol}`);
  console.log(`  Strike: ${execution.strike}`);
  console.log(`  Option Type: ${execution.optionType}`);
  console.log(`  Expiry: ${execution.expiry}`);
  console.log(`  Market: ${execution.market}`);
  console.log(`  Instrument Type: ${execution.instrumentType}`);
  console.log(`  Price: ${execution.price}`);
  console.log(`  Timestamp: ${execution.timestamp}`);

  console.log('\n✅ Expected behavior:');
  console.log('  ✓ Strike should be 23000 (rounded UP from 22933)');
  console.log('  ✓ Expiry should be 2025-12-16 (Dec 16, from NSE API)');
  console.log('  ✓ Symbol should be NIFTY16DEC2523000CE');
  console.log('  ✓ Trade Type should be BUY (LONG signal)');
})();
