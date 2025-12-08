/**
 * MCX (Multi Commodity Exchange) Strategy Processor
 * Routes commodity futures to MCXCommodityService
 */

import { SignalProcessor } from '../services/signalProcessor';
import { MCXCommodityService } from '../services/mcxCommodityService';
import { TradeSignal } from '../types/signals';

interface MCXProcessingOptions {
  symbol: string; // e.g., GOLD, SILVER, CRUDE
  price?: number;
  quantity?: number;
}

export class MCXStrategyProcessor {
  private mcxService: MCXCommodityService;

  constructor(signalProcessor: SignalProcessor) {
    this.mcxService = new MCXCommodityService(signalProcessor);
  }

  /**
   * Process MCX commodity futures trade
   * Example: MCX:FUT:SILVER:LONG:25000 → Buy SILVER contract at 25000
   */
  process(signal: TradeSignal, options: MCXProcessingOptions) {
    return this.mcxService.process(signal, {
      symbol: options.symbol,
      price: options.price,
    });
  }
}
