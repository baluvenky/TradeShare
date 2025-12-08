/**
 * Equity Trading Service
 * Handles NSE (National Stock Exchange) and BSE (Bombay Stock Exchange) equity trading
 */

import { SignalProcessor } from './signalProcessor';
import { TradeSignal, InstrumentType, TradeExecution } from '../types/signals';

export interface EquityOptions {
  symbol: string; // Stock symbol, e.g., INFY, TCS, RELIANCE
  price?: number;
  quantity?: number;
  market?: 'NSE' | 'BSE'; // Default: NSE
}

export class EquityService {
  constructor(private processor: SignalProcessor) {}

  /**
   * Validate if symbol format looks reasonable (2-20 alphanumeric chars)
   */
  isValidSymbol(symbol: string): boolean {
    return /^[A-Z0-9]{2,20}$/.test(symbol.toUpperCase());
  }

  /**
   * Process equity trading signal for NSE/BSE
   */
  process(signal: TradeSignal, options: EquityOptions): TradeExecution {
    if (!this.isValidSymbol(options.symbol)) {
      throw new Error(`Invalid equity symbol: ${options.symbol}`);
    }

    const market = options.market || 'NSE';

    // Process signal through SignalProcessor with equity details
    const execution = this.processor.processSignal(signal, {
      symbol: options.symbol.toUpperCase(),
      price: options.price,
      quantity: options.quantity,
      market,
      instrumentType: InstrumentType.EQ,
    });

    return execution;
  }
}
