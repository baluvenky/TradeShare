/**
 * Signal Conversion Utilities
 * Converts trading signals to buy/sell actions
 */

import { TradeSignal, TradeType, BuySignal, SellSignal } from '../types/signals';

/**
 * Converts a TradeSignal to its corresponding TradeType (BUY or SELL)
 * @param signal - The trading signal to convert
 * @returns TradeType - BUY, SELL, or UNKNOWN
 *
 * Signal Mapping:
 * - LONG / LONG_ADD → BUY (buy call / add to long)
 * - SHORT_ADD → BUY (buy put / add to short position)
 * - EXIT_LONG → SELL (sell call / exit long)
 * - EXIT_SHORT → SELL (sell put / exit short)
 */
export function convertSignalToTradeType(signal: TradeSignal): TradeType {
  switch (signal) {
    case TradeSignal.LONG:
    case TradeSignal.LONG_ADD:
    case TradeSignal.SHORT_ADD:
      return TradeType.BUY;
    
    case TradeSignal.EXIT_LONG:
    case TradeSignal.EXIT_SHORT:
      return TradeType.SELL;
    
    default:
      return TradeType.UNKNOWN;
  }
}

/**
 * Checks if a signal is a buy signal
 * @param signal - The trading signal to check
 * @returns boolean - true if signal is a buy signal
 *
 * Buy signals include LONG, LONG_ADD (for calls/longs) and SHORT_ADD (for puts/shorts)
 */
export function isBuySignal(signal: TradeSignal): signal is BuySignal {
  return signal === TradeSignal.LONG || signal === TradeSignal.LONG_ADD || signal === TradeSignal.SHORT_ADD;
}

/**
 * Checks if a signal is a sell signal
 * @param signal - The trading signal to check
 * @returns boolean - true if signal is a sell signal
 */
export function isSellSignal(signal: TradeSignal): signal is SellSignal {
  return signal === TradeSignal.EXIT_LONG || signal === TradeSignal.EXIT_SHORT;
}

/**
 * Gets a human-readable description of the signal
 * @param signal - The trading signal
 * @returns string - Description of the signal
 */
export function getSignalDescription(signal: TradeSignal): string {
  const descriptions: Record<TradeSignal, string> = {
    [TradeSignal.LONG]: 'Open long position',
    [TradeSignal.LONG_ADD]: 'Add to long position',
    [TradeSignal.SHORT_ADD]: 'Add to short position',
    [TradeSignal.EXIT_LONG]: 'Exit long position',
    [TradeSignal.EXIT_SHORT]: 'Exit short position',
  };
  
  return descriptions[signal] || 'Unknown signal';
}
