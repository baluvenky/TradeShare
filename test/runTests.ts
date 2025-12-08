import { SignalProcessor } from '../src/services/signalProcessor';
import { EquityService } from '../src/services/equityService';
import { NIFTYFuturesService } from '../src/services/niftyFuturesService';
import { MCXCommodityService } from '../src/services/mcxCommodityService';
import { NIFTYOptionsService } from '../src/services/niftyOptionsService';
import { TradeSignal, InstrumentType, OptionType, TradeType } from '../src/types/signals';

function assert(cond: boolean, message: string) {
  if (!cond) throw new Error('Assertion failed: ' + message);
}

async function run() {
  console.log('Running TradeShare tests...');

  const processor = new SignalProcessor();

  // Services
  const equity = new EquityService(processor);
  const niftyFut = new NIFTYFuturesService(processor);
  const mcx = new MCXCommodityService(processor);
  const niftyOpt = new NIFTYOptionsService(processor);

  // 1) Equity LONG
  const eqExec = equity.process(TradeSignal.LONG, { symbol: 'INFY', price: 2500, quantity: 10, market: 'NSE' });
  console.log('EQ Exec:', eqExec);
  assert(eqExec.tradeType === TradeType.BUY, 'Equity LONG should be BUY');
  assert(eqExec.instrumentType === InstrumentType.EQ, 'Equity instrumentType EQ');

  // 2) NIFTY Futures
  const futExec = niftyFut.process(TradeSignal.LONG, { symbol: 'NIFTY', price: 24800 });
  console.log('FUT Exec:', futExec);
  assert(futExec.instrumentType === InstrumentType.FUT, 'FUT instrumentType FUT');
  assert(typeof futExec.expiry === 'string' || futExec.expiry !== undefined, 'FUT expiry present');

  // 3) MCX Commodity
  const mcxExec = mcx.process(TradeSignal.LONG, { symbol: 'SILVER', price: 65000 });
  console.log('MCX Exec:', mcxExec);
  assert(mcxExec.market === 'MCX', 'MCX market');
  assert(mcxExec.instrumentType === InstrumentType.FUT, 'MCX is FUT');

  // 4) NIFTY Options LONG with paired orders
  const optExec = await niftyOpt.process(TradeSignal.LONG, { symbol: 'NIFTY', price: 24850, generatePairedOrders: true });
  console.log('OPT Exec:', optExec);
  assert(optExec.instrumentType === InstrumentType.OPT, 'Option instrumentType OPT');
  assert(optExec.optionType === OptionType.CE, 'Option type CE for LONG');
  assert((optExec as any).pairedOrders && (optExec as any).pairedOrders.length === 2, 'Paired orders returned');

  // 5) NIFTY Options EXIT_LONG (sell CE, paired buys PE)
  const optExit = await niftyOpt.process(TradeSignal.EXIT_LONG, { symbol: 'NIFTY', price: 24850, generatePairedOrders: true });
  console.log('OPT Exit Exec:', optExit);
  assert(optExit.optionType === OptionType.CE, 'Option type CE for EXIT_LONG (sell CE)');
  assert((optExit as any).pairedOrders && (optExit as any).pairedOrders.length === 2, 'Paired orders for exit returned');

  console.log('\nAll tests passed!');
}

run().catch(err => {
  console.error('Tests failed:', err);
  process.exit(1);
});
