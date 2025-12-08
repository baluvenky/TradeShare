/**
 * NIFTY Futures Trading Service
 * Handles NIFTY and NIFTY50 index futures trading
 */

import { SignalProcessor } from './signalProcessor';
import { TradeSignal, InstrumentType, TradeExecution } from '../types/signals';
import { formatExpiryDate, getNextOptionExpiryByInstrumentLive } from '../utils/optionUtils';

export interface NIFTYFuturesOptions {
  symbol: 'NIFTY' | 'NIFTY50'; // Index symbol
  price?: number;
}

export class NIFTYFuturesService {
  constructor(private processor: SignalProcessor) {}

  /**
   * Check if symbol is valid NIFTY futures index
   */
  isValidIndex(symbol: string): boolean {
    return ['NIFTY', 'NIFTY50'].includes(symbol.toUpperCase());
  }

  /**
   * Generate NIFTY futures contract symbol with next expiry
   * Format: e.g., NIFTY24DEC25, NIFTY5024DEC25
   */
  private generateContractSymbol(symbol: string, expiryDate: Date): string {
    const expiryFormatted = formatExpiryDate(expiryDate);
    return `${symbol.toUpperCase()}${expiryFormatted}`;
  }

  /**
   * Process NIFTY futures trading signal
   */
  async process(signal: TradeSignal, options: NIFTYFuturesOptions): Promise<TradeExecution> {
    if (!this.isValidIndex(options.symbol)) {
      throw new Error(`Invalid NIFTY futures symbol: ${options.symbol}. Use NIFTY or NIFTY50`);
    }

    // Get next futures contract expiry (always live fetch, no cache)
    const expiryDate = await getNextOptionExpiryByInstrumentLive(options.symbol, new Date());
    const contractSymbol = this.generateContractSymbol(options.symbol, expiryDate);
    const expiryFormatted = formatExpiryDate(expiryDate);

    // Process signal through SignalProcessor with NIFTY futures details
    const execution = this.processor.processSignal(signal, {
      symbol: contractSymbol,
      price: options.price,
      market: options.symbol.toUpperCase() as 'NIFTY' | 'NIFTY50',
      instrumentType: InstrumentType.FUT,
      expiry: expiryFormatted,
    });

    return execution;
  }
}
