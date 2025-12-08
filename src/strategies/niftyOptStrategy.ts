/**
 * NIFTY Options Strategy Processor
 * Routes NIFTY options to NIFTYOptionsService
 */

import { SignalProcessor } from '../services/signalProcessor';
import { NIFTYOptionsService } from '../services/niftyOptionsService';
import { TradeSignal, OptionType } from '../types/signals';

interface NIFTYOptProcessingOptions {
  symbol: 'NIFTY' | 'NIFTY50';
  price?: number;
  optionType?: OptionType;
  skipCurrentWeek?: boolean;
}

export class NIFTYOptStrategyProcessor {
  private niftyOptionsService: NIFTYOptionsService;

  constructor(signalProcessor: SignalProcessor) {
    this.niftyOptionsService = new NIFTYOptionsService(signalProcessor);
  }

  /**
   * Process NIFTY option trade
   * - Skips current week expiry if before Thursday (prevents near-expiry trading)
   * - Derives strike from price (rounded to nearest 100)
   * - Generates full symbol: NIFTY16DEC2524000CE
   */
  process(signal: TradeSignal, options: NIFTYOptProcessingOptions) {
    return this.niftyOptionsService.process(signal, {
      symbol: options.symbol,
      price: options.price,
      optionType: options.optionType,
      skipCurrentWeek: options.skipCurrentWeek,
    });
  }
}
