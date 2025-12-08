/**
 * MCX Commodity Trading Service
 * Handles Multi Commodity Exchange futures trading (GOLD, SILVER, CRUDE, COPPER, ZINC, LEAD, NICKEL)
 */

import { SignalProcessor } from './signalProcessor';
import { TradeSignal, InstrumentType, TradeExecution } from '../types/signals';
import { formatExpiryDate, getNextMCXExpiry, MONTH_CODES } from '../utils/optionUtils';

export interface MCXCommodityOptions {
  symbol: string; // e.g., GOLD, SILVER, CRUDE, COPPER, ZINC, LEAD, NICKEL
  price?: number;
}

const SUPPORTED_COMMODITIES = ['GOLD', 'SILVER', 'CRUDE', 'COPPER', 'ZINC', 'LEAD', 'NICKEL'];

export class MCXCommodityService {
  constructor(private processor: SignalProcessor) {}

  /**
   * Check if a commodity is supported on MCX
   */
  isValidCommodity(symbol: string): boolean {
    return SUPPORTED_COMMODITIES.includes(symbol.toUpperCase());
  }

  /**
   * Get list of supported commodities
   */
  getSupportedCommodities(): string[] {
    return [...SUPPORTED_COMMODITIES];
  }

  /**
   * Generate MCX commodity contract symbol with next expiry
   * Format: e.g., GOLDM25, SILVERM25, CRUDEM25 (month code + year)
   */
  private generateContractSymbol(commodity: string, expiryDate: Date): string {
    // Use month name and two-digit year for MCX contract symbol, e.g., GOLDDEC25
    const month = expiryDate.getMonth() + 1;
    const monthName = MONTH_CODES[month];
    const yearCode = expiryDate.getFullYear().toString().slice(-2);
    return `${commodity.toUpperCase()}${monthName}${yearCode}`;
  }

  /**
   * Process MCX commodity trading signal
   */
  process(signal: TradeSignal, options: MCXCommodityOptions): TradeExecution {
    if (!this.isValidCommodity(options.symbol)) {
      throw new Error(`Unsupported commodity: ${options.symbol}. Supported: ${SUPPORTED_COMMODITIES.join(', ')}`);
    }

    // Get next contract expiry (MCX monthly contract day = 20th)
    const expiryDate = getNextMCXExpiry(new Date());
    const contractSymbol = this.generateContractSymbol(options.symbol, expiryDate);
    const expiryFormatted = formatExpiryDate(expiryDate);

    // Process signal through SignalProcessor with MCX-specific details
    const execution = this.processor.processSignal(signal, {
      symbol: contractSymbol,
      price: options.price,
      market: 'MCX',
      instrumentType: InstrumentType.FUT,
      expiry: expiryFormatted,
    });

    return execution;
  }
}
