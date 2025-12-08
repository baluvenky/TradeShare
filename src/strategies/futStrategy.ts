/**
 * Futures (FUT) Strategy Processor
 * Routes NIFTY futures to NIFTYFuturesService
 */

import { SignalProcessor } from '../services/signalProcessor';
import { NIFTYFuturesService } from '../services/niftyFuturesService';
import { TradeSignal } from '../types/signals';

interface FUTProcessingOptions {
  symbol: string;
  price?: number;
  quantity?: number;
  market?: 'NIFTY' | 'NIFTY50';
}

export class FUTStrategyProcessor {
  private niftyFuturesService: NIFTYFuturesService;

  constructor(signalProcessor: SignalProcessor) {
    this.niftyFuturesService = new NIFTYFuturesService(signalProcessor);
  }

  /**
   * Process futures trade
   * Example: NIFTY:FUT:NIFTY:LONG:24800 → Buy NIFTY Dec futures at 24800
   */
  process(signal: TradeSignal, options: FUTProcessingOptions) {
    const market = (options.market || 'NIFTY') as 'NIFTY' | 'NIFTY50';
    return this.niftyFuturesService.process(signal, {
      symbol: market,
      price: options.price,
    });
  }
}
