import { SignalProcessor } from '../src/services/signalProcessor';
import { MCXCommodityService } from '../src/services/mcxCommodityService';
import { TradeSignal } from '../src/types/signals';

(async function run() {
  const processor = new SignalProcessor();
  const mcx = new MCXCommodityService(processor);

  try {
    const exec = mcx.process(TradeSignal.LONG, { symbol: 'SILVER', price: 25000 });
    console.log('MCX Execution Result:');
    console.log(exec);
  } catch (e) {
    console.error('Error:', e);
  }
})();
