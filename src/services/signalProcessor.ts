/**
 * Signal Processor Service
 * Handles trading signal processing and execution with event emitters
 */

import { TradeSignal, TradeExecution, TradeType, InstrumentType, OptionType } from '../types/signals';
import { convertSignalToTradeType } from '../utils/signalConverter';
import { TradeEventEmitter } from '../utils/eventEmitter';

export interface ProcessingOptions {
  symbol?: string;
  quantity?: number;
  price?: number;
  market?: string;
  instrumentType?: InstrumentType;
  optionType?: OptionType;
  strike?: number;
  expiry?: string;
}

export class SignalProcessor {
  private executionHistory: TradeExecution[] = [];
  private eventEmitter: TradeEventEmitter;

  constructor() {
    this.eventEmitter = new TradeEventEmitter();
  }

  /**
   * Process a trading signal and execute the corresponding trade
   * @param signal - The trading signal to process
   * @param options - Additional trading options (symbol, quantity, price)
   * @returns TradeExecution - The execution result
   */
  public processSignal(signal: TradeSignal, options?: ProcessingOptions): TradeExecution {
    const tradeType = convertSignalToTradeType(signal);
    
    const execution: TradeExecution = {
      signal,
      tradeType,
      timestamp: new Date(),
      symbol: options?.symbol,
      quantity: options?.quantity,
      price: options?.price,
      market: options?.market,
      instrumentType: options?.instrumentType,
      optionType: options?.optionType,
      strike: options?.strike,
      expiry: options?.expiry,
    };

    this.executionHistory.push(execution);

    // Emit events based on trade type
    this.eventEmitter.emit('trade', execution);
    
    if (tradeType === TradeType.BUY) {
      this.eventEmitter.emit('buy', execution);
    } else if (tradeType === TradeType.SELL) {
      this.eventEmitter.emit('sell', execution);
    } else if (tradeType === TradeType.UNKNOWN) {
      this.eventEmitter.emit('unknown', execution);
    }

    // Emit signal-specific event
    this.eventEmitter.emit(`signal:${signal}`, execution);

    return execution;
  }

  /**
   * Process multiple signals in batch
   * @param signals - Array of trading signals with optional processing options
   * @returns Array of trade executions
   */
  public processSignalBatch(
    signals: Array<{ signal: TradeSignal; options?: ProcessingOptions }>
  ): TradeExecution[] {
    return signals.map(({ signal, options }) => this.processSignal(signal, options));
  }

  /**
   * Get execution history
   * @param filter - Optional filter by trade type
   * @returns Array of trade executions
   */
  public getExecutionHistory(filter?: TradeType): TradeExecution[] {
    if (!filter) return this.executionHistory;
    return this.executionHistory.filter(exec => exec.tradeType === filter);
  }

  /**
   * Get summary statistics of trading activity
   */
  public getStatistics() {
    const totalTrades = this.executionHistory.length;
    const buyTrades = this.executionHistory.filter(e => e.tradeType === TradeType.BUY).length;
    const sellTrades = this.executionHistory.filter(e => e.tradeType === TradeType.SELL).length;
    const unknownTrades = this.executionHistory.filter(e => e.tradeType === TradeType.UNKNOWN).length;

    return {
      totalTrades,
      buyTrades,
      sellTrades,
      unknownTrades,
    };
  }

  /**
   * Clear execution history
   */
  public clearHistory(): void {
    this.executionHistory = [];
  }

  /**
   * Register an event listener
   * @param event - Event name (e.g., 'trade', 'buy', 'sell', 'signal:LONG')
   * @param listener - Callback function
   */
  public on(event: string, listener: (execution: TradeExecution) => void): void {
    this.eventEmitter.on(event, listener);
  }

  /**
   * Register a one-time event listener
   * @param event - Event name
   * @param listener - Callback function
   */
  public once(event: string, listener: (execution: TradeExecution) => void): void {
    this.eventEmitter.once(event, listener);
  }

  /**
   * Remove an event listener
   * @param event - Event name
   * @param listener - Callback function
   */
  public off(event: string, listener: (execution: TradeExecution) => void): void {
    this.eventEmitter.off(event, listener);
  }

  /**
   * Remove all listeners for an event
   * @param event - Event name (omit to remove all listeners)
   */
  public removeAllListeners(event?: string): void {
    this.eventEmitter.removeAllListeners(event);
  }

  /**
   * Get number of listeners for an event
   */
  public listenerCount(event: string): number {
    return this.eventEmitter.listenerCount(event);
  }

  /**
   * Get detailed signal info
   */
  public getSignalInfo(signal: TradeSignal) {
    return {
      signal,
      tradeType: convertSignalToTradeType(signal),
    };
  }
}

export default SignalProcessor;
