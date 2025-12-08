/**
 * NIFTY Options Trading Service
 * Handles NIFTY and NIFTY50 options with intelligent expiry logic and CE/PE support
 */

import { SignalProcessor } from './signalProcessor';
import { TradeSignal, InstrumentType, OptionType, TradeExecution } from '../types/signals';
import {
  generateNIFTYOptionSymbol,
  generateNIFTY50OptionSymbol,
  roundToNearestStrike,
  getNextOptionExpiryByInstrument,
  getNextOptionExpiryByInstrumentLive,
  getNearbyStrikes,
  formatDateAsYYYYMMDD,
} from '../utils/optionUtils';

export interface NIFTYOptionsServiceOptions {
  symbol: 'NIFTY' | 'NIFTY50'; // Index symbol
  price?: number;
  optionType?: OptionType; // Override auto-assignment (CE for BUY, PE for SELL)
  // When true, generate paired orders (CE <-> PE) and include them in the return value.
  // NOTE: paired orders are returned as instructions and are NOT auto-executed by default.
  generatePairedOrders?: boolean;
  skipCurrentWeek?: boolean; // Default: true - skip current week's expiry if before Thursday
}

export class NIFTYOptionsService {
  constructor(private processor: SignalProcessor) {}

  /**
   * Check if symbol is valid NIFTY options index
   */
  isValidIndex(symbol: string): boolean {
    return ['NIFTY', 'NIFTY50'].includes(symbol.toUpperCase());
  }

  /**
   * Auto-assign option type based on signal
   * LONG/LONG_ADD → CE (Call), EXIT_LONG/EXIT_SHORT → PE (Put)
   */
  private autoAssignOptionType(signal: TradeSignal): OptionType {
    // Default mapping:
    // - LONG / LONG_ADD => CE (primary buy call)
    // - SHORT_ADD => PE (primary buy call for puts)
    // - EXIT_LONG => CE (sell CE to exit long)
    // - EXIT_SHORT => PE (sell PE to exit short)
    switch (signal) {
      case TradeSignal.LONG:
      case TradeSignal.LONG_ADD:
        return OptionType.CE;
      case TradeSignal.SHORT_ADD:
        return OptionType.PE;
      case TradeSignal.EXIT_LONG:
        return OptionType.CE;
      case TradeSignal.EXIT_SHORT:
        return OptionType.PE;
      default:
        return OptionType.CE;
    }
  }

  /**
   * Create paired option order instructions for CE <-> PE workflows.
   * Returns an array of order instructions in the form:
   * { action: 'BUY'|'SELL', optionType: OptionType, symbol: string, strike: number }
   * This does NOT execute the orders; it only returns instructions for callers to act upon.
   */
  public generatePairedOrders(
    signal: TradeSignal,
    strike: number,
    expiryDate: Date,
    underlying: 'NIFTY' | 'NIFTY50'
  ) {
    const ceSymbol = this.generateOptionSymbol(underlying, strike, OptionType.CE, expiryDate);
    const peSymbol = this.generateOptionSymbol(underlying, strike, OptionType.PE, expiryDate);

    // Define paired behavior:
    // - If primary is CE buy (LONG), paired should SELL PE (close existing put short or hedge)
    // - If primary is CE sell (EXIT_LONG), paired should BUY PE
    // - If primary is PE buy (SHORT_ADD), paired should SELL CE
    // - If primary is PE sell (EXIT_SHORT), paired should BUY CE
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
      // Fallback: primary CE buy
      orders.push({ action: 'BUY', optionType: OptionType.CE, symbol: ceSymbol, strike });
    }

    return orders;
  }

  /**
   * Generate full NIFTY option symbol with expiry logic
   */
  private generateOptionSymbol(
    underlying: 'NIFTY' | 'NIFTY50',
    strike: number,
    optionType: OptionType,
    expiryDate: Date
  ): string {
    if (underlying === 'NIFTY') {
      return generateNIFTYOptionSymbol(strike, optionType, expiryDate);
    }
    return generateNIFTY50OptionSymbol(strike, optionType, expiryDate);
  }

  /**
   * Get nearby strikes for option chain (ATM, ATM+100, ATM-100, etc.)
   */
  getNearbyOptionChain(
    underlying: 'NIFTY' | 'NIFTY50' = 'NIFTY',
    price: number,
    count: number = 5
  ): Array<{ strike: number; symbol: string; optionType: OptionType }> {
    const expiryDate = getNextOptionExpiryByInstrument(underlying, new Date());
    const strikes = getNearbyStrikes(price, 100, count);

    const chain: Array<{ strike: number; symbol: string; optionType: OptionType }> = [];
    strikes.forEach(strike => {
      chain.push({
        strike,
        symbol: this.generateOptionSymbol(underlying, strike, OptionType.CE, expiryDate),
        optionType: OptionType.CE,
      });
      chain.push({
        strike,
        symbol: this.generateOptionSymbol(underlying, strike, OptionType.PE, expiryDate),
        optionType: OptionType.PE,
      });
    });

    return chain;
  }

  /**
   * Process NIFTY options trading signal
   * Implements skip-current-week logic to prevent trading near-expiry contracts
   */
  async process(signal: TradeSignal, options: NIFTYOptionsServiceOptions): Promise<TradeExecution> {
    if (!this.isValidIndex(options.symbol)) {
      throw new Error(`Invalid NIFTY options symbol: ${options.symbol}. Use NIFTY or NIFTY50`);
    }

    const price = options.price || (options.symbol === 'NIFTY' ? 24800 : 52000);
    const strike = roundToNearestStrike(price, 100);

    // Always use live NSE API fetch (no cache)
    const expiryDate = await getNextOptionExpiryByInstrumentLive(
      options.symbol as 'NIFTY' | 'NIFTY50',
      new Date()
    );

    // Auto-assign or use provided option type
    const optionType = options.optionType || this.autoAssignOptionType(signal);

    // Generate full option symbol
    const optionSymbol = this.generateOptionSymbol(options.symbol, strike, optionType, expiryDate);

    // Process signal through SignalProcessor with NIFTY options details
    const execution = this.processor.processSignal(signal, {
      symbol: optionSymbol,
      price,
      market: options.symbol.toUpperCase() as 'NIFTY' | 'NIFTY50',
      instrumentType: InstrumentType.OPT,
      optionType,
      strike,
      expiry: formatDateAsYYYYMMDD(expiryDate), // Use local date without timezone conversion
    });

    // If caller requested paired orders, generate instructions (but do not auto-execute)
    if (options.generatePairedOrders) {
      const paired = this.generatePairedOrders(signal, strike, expiryDate, options.symbol);
      // Attach pairedOrders to execution result under a non-standard field so callers can act on it
      // Note: TradeExecution doesn't include pairedOrders in its type; we attach dynamically here.
      (execution as any).pairedOrders = paired;
    }

    return execution;
  }
}
