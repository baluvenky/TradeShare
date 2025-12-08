/**
 * Equity (EQ) Strategy Processor
 * Routes equity trades to EquityService
 */

import { SignalProcessor } from '../services/signalProcessor';
import { EquityService } from '../services/equityService';
import { TradeSignal } from '../types/signals';

interface EQProcessingOptions {
  symbol: string;
  price?: number;
  quantity?: number;
}

export class EQStrategyProcessor {
  private equityService: EquityService;

  constructor(signalProcessor: SignalProcessor) {
    this.equityService = new EquityService(signalProcessor);
  }

  /**
   * Process equity trade
   * Example: NSE:INFY:LONG:2500 → Buy INFY at 2500
   */
  process(signal: TradeSignal, options: EQProcessingOptions) {
    return this.equityService.process(signal, {
      symbol: options.symbol,
      price: options.price,
      quantity: options.quantity,
      market: 'NSE',
    });
  }
}
