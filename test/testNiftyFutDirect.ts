import { SignalProcessor } from '../src/services/signalProcessor';
import { NIFTYFuturesService } from '../src/services/niftyFuturesService';
import { TradeSignal } from '../src/types/signals';

(async function run() {
  const processor = new SignalProcessor();
  const fut = new NIFTYFuturesService(processor);

  try {
    const exec = fut.process(TradeSignal.LONG, { symbol: 'NIFTY', price: 24800 });
    console.log('NIFTY FUT Execution Result:');
    console.log(exec);
  } catch (e) {
    console.error('Error:', e);
  }
})();
