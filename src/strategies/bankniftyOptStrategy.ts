/**
 * BANKNIFTY Options Strategy Processor
 * Routes BANKNIFTY option messages to BANKNIFTY service
 */

import { SignalProcessor } from '../services/signalProcessor';
import { BANKNIFTYOptionsService } from '../services/bankniftyOptionsService';
import { TradeSignal, OptionType } from '../types/signals';

interface BANKNIFTYProcessingOptions {
  symbol: 'BANKNIFTY';
  price?: number;
  optionType?: OptionType;
  skipCurrentWeek?: boolean;
}

export class BANKNIFTYOptStrategyProcessor {
  private service: BANKNIFTYOptionsService;

  constructor(signalProcessor: SignalProcessor) {
    this.service = new BANKNIFTYOptionsService(signalProcessor);
  }

  process(signal: TradeSignal, options: BANKNIFTYProcessingOptions) {
    return this.service.process(signal, {
      symbol: 'BANKNIFTY',
      price: options.price,
      optionType: options.optionType,
      skipCurrentWeek: options.skipCurrentWeek,
    });
  }
}
