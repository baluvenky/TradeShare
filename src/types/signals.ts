/**
 * Trading Signal Enums
 * Defines all possible trading signals for buy and sell operations
 */

export enum TradeSignal {
  // Buy signals
  LONG = 'LONG',
  LONG_ADD = 'LONG_ADD',
  
  // Sell signals
  SHORT_ADD = 'SHORT_ADD',
  EXIT_LONG = 'EXIT_LONG',
  EXIT_SHORT = 'EXIT_SHORT',
}

export type BuySignal = TradeSignal.LONG | TradeSignal.LONG_ADD | TradeSignal.SHORT_ADD;
export type SellSignal = TradeSignal.EXIT_LONG | TradeSignal.EXIT_SHORT;
export type AllSignals = BuySignal | SellSignal;

/**
 * Trade type representing buy or sell action
 */
export enum TradeType {
  BUY = 'BUY',
  SELL = 'SELL',
  UNKNOWN = 'UNKNOWN',
}

/**
 * Instrument type: Equity, Futures, or Options
 */
export enum InstrumentType {
  EQ = 'EQ',        // Equity
  FUT = 'FUT',      // Futures
  OPT = 'OPT',      // Options
}

/**
 * Option type: Call or Put
 */
export enum OptionType {
  CE = 'CE',  // Call Option
  PE = 'PE',  // Put Option
}

/**
 * Market segments
 */
export enum Market {
  NSE = 'NSE',        // National Stock Exchange (Equity)
  BSE = 'BSE',        // Bombay Stock Exchange (Equity)
  NIFTY = 'NIFTY',    // NIFTY Index Options/Futures
  NIFTY50 = 'NIFTY50', // NIFTY 50 Options/Futures
  MCX = 'MCX',        // Multi Commodity Exchange
}

/**
 * Trade execution result
 */
export interface TradeExecution {
  signal: TradeSignal;
  tradeType: TradeType;
  timestamp: Date;
  quantity?: number;
  price?: number;
  symbol?: string;
  market?: string;
  instrumentType?: InstrumentType;
  optionType?: OptionType;
  strike?: number;
  expiry?: string;
}
