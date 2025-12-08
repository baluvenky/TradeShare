/**
 * BANKNIFTY Options Trading Service
 * Handles BANKNIFTY options with MONTHLY expiry logic and CE/PE support
 */

import { SignalProcessor } from './signalProcessor';
import { TradeSignal, InstrumentType, OptionType, TradeExecution } from '../types/signals';
import {
  generateOptionSymbol,
  roundToNearestStrike,
  getNextOptionExpiryByInstrument,
  getNextOptionExpiryByInstrumentLive,
  getNearbyStrikes,
  formatDateAsYYYYMMDD,
} from '../utils/optionUtils';

export interface BANKNIFTYOptionsServiceOptions {
  symbol: 'BANKNIFTY';
  price?: number;
  optionType?: OptionType;
  generatePairedOrders?: boolean;
  skipCurrentWeek?: boolean;
}

export class BANKNIFTYOptionsService {
  constructor(private processor: SignalProcessor) {}

  isValidIndex(symbol: string): boolean {
    return symbol.toUpperCase() === 'BANKNIFTY';
  }

  private autoAssignOptionType(signal: TradeSignal): OptionType {
    if (signal === TradeSignal.LONG || signal === TradeSignal.LONG_ADD) return OptionType.CE;
    if (signal === TradeSignal.SHORT_ADD) return OptionType.PE;
    if (signal === TradeSignal.EXIT_LONG) return OptionType.CE;
    if (signal === TradeSignal.EXIT_SHORT) return OptionType.PE;
    return OptionType.CE;
  }

  public generatePairedOrders(signal: TradeSignal, strike: number, expiryDate: Date) {
    const ceSymbol = generateOptionSymbol('BANKNIFTY', strike, OptionType.CE, expiryDate);
    const peSymbol = generateOptionSymbol('BANKNIFTY', strike, OptionType.PE, expiryDate);

    const orders: Array<{ action: 'BUY' | 'SELL'; optionType: OptionType; symbol: string; strike: number }> = [];

    if (signal === TradeSignal.LONG || signal === TradeSignal.LONG_ADD) {
      orders.push({ action: 'BUY', optionType: OptionType.CE, symbol: ceSymbol, strike });
      orders.push({ action: 'SELL', optionType: OptionType.PE, symbol: peSymbol, strike });
    } else if (signal === TradeSignal.EXIT_LONG) {
      orders.push({ action: 'SELL', optionType: OptionType.CE, symbol: ceSymbol, strike });
      orders.push({ action: 'BUY', optionType: OptionType.PE, symbol: peSymbol, strike });
    } else if (signal === TradeSignal.SHORT_ADD) {
      orders.push({ action: 'BUY', optionType: OptionType.PE, symbol: peSymbol, strike });
      orders.push({ action: 'SELL', optionType: OptionType.CE, symbol: ceSymbol, strike });
    } else if (signal === TradeSignal.EXIT_SHORT) {
      orders.push({ action: 'SELL', optionType: OptionType.PE, symbol: peSymbol, strike });
      orders.push({ action: 'BUY', optionType: OptionType.CE, symbol: ceSymbol, strike });
    } else {
      orders.push({ action: 'BUY', optionType: OptionType.CE, symbol: ceSymbol, strike });
    }

    return orders;
  }

  getNearbyOptionChain(price: number, count: number = 5) {
    // BANKNIFTY uses MONTHLY expiry
    const expiryDate = getNextOptionExpiryByInstrument('BANKNIFTY', new Date());
    const strikes = getNearbyStrikes(price, 100, count);
    const chain: Array<{ strike: number; symbol: string; optionType: OptionType }> = [];
    strikes.forEach(strike => {
      chain.push({ strike, symbol: generateOptionSymbol('BANKNIFTY', strike, OptionType.CE, expiryDate), optionType: OptionType.CE });
      chain.push({ strike, symbol: generateOptionSymbol('BANKNIFTY', strike, OptionType.PE, expiryDate), optionType: OptionType.PE });
    });
    return chain;
  }

  async process(signal: TradeSignal, options: BANKNIFTYOptionsServiceOptions): Promise<TradeExecution> {
    if (!this.isValidIndex(options.symbol)) throw new Error('Invalid BANKNIFTY index');

    const price = options.price || 43000;
    const strike = roundToNearestStrike(price, 100);
    // BANKNIFTY uses MONTHLY expiry (last Thursday of month, always live fetch)
    const expiryDate = await getNextOptionExpiryByInstrumentLive('BANKNIFTY', new Date());
    const optionType = options.optionType || this.autoAssignOptionType(signal);
    const optionSymbol = generateOptionSymbol('BANKNIFTY', strike, optionType, expiryDate);

    const execution = this.processor.processSignal(signal, {
      symbol: optionSymbol,
      price,
      market: 'BANKNIFTY',
      instrumentType: InstrumentType.OPT,
      optionType,
      strike,
      expiry: formatDateAsYYYYMMDD(expiryDate),
    });

    if (options.generatePairedOrders) {
      (execution as any).pairedOrders = this.generatePairedOrders(signal, strike, expiryDate);
    }

    return execution;
  }
}
