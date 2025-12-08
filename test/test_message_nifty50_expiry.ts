import { SignalProcessor } from '../src/services/signalProcessor';
import { NIFTYOptionsService } from '../src/services/niftyOptionsService';
import { TradeSignal } from '../src/types/signals';

async function run() {
  const processor = new SignalProcessor();
  const niftyOpt = new NIFTYOptionsService(processor);

  console.log('Test: message -> "NIFTY50:OPT:NIFTY:LONG:22933"');

  // Simulate processing the message: NIFTY50 OPT NIFTY LONG 22933
  const exec = await niftyOpt.process(TradeSignal.LONG, {
    symbol: 'NIFTY50',
    price: 22933,
  });

  console.log('Execution:', exec);

  const expectedExpiry = '2025-12-16';
  if (exec.expiry !== expectedExpiry) {
    console.error(`FAIL: expected expiry ${expectedExpiry}, got ${exec.expiry}`);
    process.exit(1);
  }

  console.log('PASS: expiry matches expected', expectedExpiry);
  process.exit(0);
}

run().catch(err => {
  console.error('Test error:', err);
  process.exit(2);
});
