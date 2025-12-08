/**
 * Option Utilities
 * Handles option symbol generation, expiry date resolution, and strike logic
 */

import { OptionType } from '../types/signals';
import { getCachedExpiryDates, refreshExpiryDates, fetchExpiryDatesNow } from './nseExpiryCache';

export const MONTH_CODES: { [key: number]: string } = {
  1: 'JAN', 2: 'FEB', 3: 'MAR', 4: 'APR',
  5: 'MAY', 6: 'JUN', 7: 'JUL', 8: 'AUG',
  9: 'SEP', 10: 'OCT', 11: 'NOV', 12: 'DEC',
};

/**
 * Expiry configuration for different instruments
 * NIFTY: Weekly expiry (every Thursday)
 * BANKNIFTY: Monthly expiry (last Thursday of month)
 */
export interface ExpiryConfig {
  type: 'weekly' | 'monthly'; // weekly = every Thursday, monthly = last Thursday
  skipCurrentWeek: boolean;    // If true, skip current week's Thursday when before Thu
}

export const EXPIRY_CONFIG = {
  NIFTY: { type: 'weekly', skipCurrentWeek: true } as ExpiryConfig,
  NIFTY50: { type: 'weekly', skipCurrentWeek: true } as ExpiryConfig,
  BANKNIFTY: { type: 'monthly', skipCurrentWeek: true } as ExpiryConfig,
};

/**
 * Get all NSE weekly expiry dates (every Thursday for next 12 weeks)
 */
export function getNSEWeeklyExpiries(baseDate: Date = new Date()): Date[] {
  const expiryDates: Date[] = [];
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  // Find the first upcoming Thursday from today
  let current = new Date(today);
  const dayOfWeek = current.getDay();
  const daysUntilThursday = (4 - dayOfWeek + 7) % 7;
  if (daysUntilThursday > 0) {
    current.setDate(current.getDate() + daysUntilThursday);
  } else if (daysUntilThursday === 0 && current > today) {
    // Today is Thursday, include it
  } else {
    current.setDate(current.getDate() + 7);
  }

  // Collect all Thursdays for next 12 weeks
  for (let i = 0; i < 12; i++) {
    expiryDates.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }

  return expiryDates;
}

/**
 * Get all NSE monthly expiry dates (last Thursday of each month for next 12 months)
 */
export function getNSEMonthlyExpiries(baseDate: Date = new Date()): Date[] {
  const expiryDates: Date[] = [];
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  // For next 12 months, find last Thursday of each month
  for (let i = 0; i < 12; i++) {
    const month = new Date(today.getFullYear(), today.getMonth() + i, 1);
    // Find last day of this month
    let lastDay = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    // Walk back to Thursday
    while (lastDay.getDay() !== 4) {
      lastDay.setDate(lastDay.getDate() - 1);
    }
    if (lastDay >= today) {
      expiryDates.push(new Date(lastDay));
    }
  }

  return expiryDates;
}

/**
 * Get next MCX monthly contract expiry (typical MCX contract day = 20th of month)
 * Returns the next 20th date (this month if today < 20, otherwise next month's 20th)
 */
export function getNextMCXExpiry(baseDate: Date = new Date()): Date {
  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  const year = today.getFullYear();
  const month = today.getMonth();

  const thisMonth20 = new Date(year, month, 20);
  thisMonth20.setHours(0, 0, 0, 0);

  if (today <= thisMonth20) return thisMonth20;

  // next month 20th
  const next = new Date(year, month + 1, 20);
  next.setHours(0, 0, 0, 0);
  return next;
}

/**
 * Get the next available expiry date based on instrument config
 * @param instrument - 'NIFTY', 'NIFTY50', or 'BANKNIFTY'
 * @param baseDate - Reference date (default: today)
 */
export function getNextOptionExpiryByInstrument(
  instrument: 'NIFTY' | 'NIFTY50' | 'BANKNIFTY',
  baseDate: Date = new Date()
): Date {
  const config = EXPIRY_CONFIG[instrument];
  if (!config) {
    throw new Error(`Unknown instrument: ${instrument}`);
  }

  const today = new Date(baseDate);
  today.setHours(0, 0, 0, 0);

  // Map instrument to NSE API symbol (NIFTY50 data is available under NIFTY API)
  const apiSymbol = instrument === 'NIFTY50' ? 'NIFTY' : instrument;

  // Try to use cached NSE API expiryDates first (strings like "16-Dec-2025")
  const cached = getCachedExpiryDates(apiSymbol);
  let expiryDates: Date[] = [];
  if (cached && cached.length > 0) {
    // convert to Date objects
    expiryDates = cached
      .map((s) => parseNseDateString(s))
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());
  } else {
    // Trigger a background refresh to populate cache for next calls
    // (do not await to avoid blocking synchronous callers). Use API symbol mapping.
    void refreshExpiryDates(apiSymbol).catch(() => {});

    if (config.type === 'weekly') {
      expiryDates = getNSEWeeklyExpiries(baseDate);
    } else if (config.type === 'monthly') {
      expiryDates = getNSEMonthlyExpiries(baseDate);
    }
  }

  if (!expiryDates || expiryDates.length === 0) {
    return new Date(baseDate);
  }

  // Always skip the immediate expiry and return the next one
  // This ensures we never trade on the current expiry cycle
  if (expiryDates.length > 1) {
    return expiryDates[1];
  }

  // If only one expiry available, return it as fallback
  return expiryDates[0];
}

/**
 * Live resolver: always fetch fresh expiry dates from NSE for this instrument
 * and return the next expiry (skipping the immediate expiry).
 */
export async function getNextOptionExpiryByInstrumentLive(
  instrument: 'NIFTY' | 'NIFTY50' | 'BANKNIFTY',
  baseDate: Date = new Date()
): Promise<Date> {
  const config = EXPIRY_CONFIG[instrument];
  if (!config) throw new Error(`Unknown instrument: ${instrument}`);

  const apiSymbol = instrument === 'NIFTY50' ? 'NIFTY' : instrument;
  const fetched = await fetchExpiryDatesNow(apiSymbol);
  let expiryDates: Date[] = [];

  if (fetched && fetched.length > 0) {
    expiryDates = fetched
      .map((s) => parseNseDateString(s))
      .filter((d): d is Date => d instanceof Date)
      .sort((a, b) => a.getTime() - b.getTime());
  }

  // Fallback to generators if API didn't return usable data
  if (!expiryDates || expiryDates.length === 0) {
    if (config.type === 'weekly') expiryDates = getNSEWeeklyExpiries(baseDate);
    else expiryDates = getNSEMonthlyExpiries(baseDate);
  }

  // Always skip immediate expiry and return next one when possible
  if (expiryDates.length > 1) return expiryDates[1];
  return expiryDates[0];
}

/**
 * Parse NSE date string like "16-Dec-2025" or "30-Dec-2025" into a Date
 */
function parseNseDateString(s: string): Date | null {
  try {
    // Expect formats like DD-MMM-YYYY (e.g., 16-Dec-2025)
    const parts = s.split('-');
    if (parts.length !== 3) return null;
    const day = parseInt(parts[0], 10);
    const monthStr = parts[1].toUpperCase();
    const year = parseInt(parts[2], 10);
    const monthMap: { [k: string]: number } = {
      JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
      JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
    };
    const m = monthMap[monthStr];
    if (m === undefined || Number.isNaN(day) || Number.isNaN(year)) return null;
    const dt = new Date(year, m, day);
    dt.setHours(0, 0, 0, 0);
    return dt;
  } catch (e) {
    return null;
  }
}

/**
 * Get the next available expiry date (legacy, uses NIFTY weekly by default)
 * @param baseDate - Reference date (default: today)
 * @param _skipCurrentWeek - Deprecated parameter, kept for backward compatibility
 */
export function getNextOptionExpiry(baseDate: Date = new Date(), _skipCurrentWeek?: boolean): Date {
  return getNextOptionExpiryByInstrument('NIFTY', baseDate);
}

/**
 * Format date to YYYY-MM-DD without timezone conversion
 * (avoids UTC conversion issues for Indian markets)
 */
export function formatDateAsYYYYMMDD(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date to DDMoYY format (e.g., 16DEC25 for Dec 16, 2025)
 */
export function formatExpiryDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = MONTH_CODES[date.getMonth() + 1];
  const year = String(date.getFullYear()).slice(-2);
  return `${day}${month}${year}`;
}

/**
 * Generate NIFTY option symbol
 * Format: NIFTY{EXPIRY}{STRIKE}{OPTIONTYPE}
 * Example: NIFTY16DEC2524000CE
 */
export function generateNIFTYOptionSymbol(
  strike: number,
  optionType: OptionType,
  expiryDate?: Date
): string {
  const expiry = expiryDate || getNextOptionExpiry();
  const expiryStr = formatExpiryDate(expiry);
  const strikeStr = String(strike).padStart(5, '0');
  return `NIFTY${expiryStr}${strikeStr}${optionType}`;
}

/**
 * Generate NIFTY50 option symbol (similar to NIFTY)
 * Format: NIFTY50{EXPIRY}{STRIKE}{OPTIONTYPE}
 */
export function generateNIFTY50OptionSymbol(
  strike: number,
  optionType: OptionType,
  expiryDate?: Date
): string {
  const expiry = expiryDate || getNextOptionExpiry();
  const expiryStr = formatExpiryDate(expiry);
  const strikeStr = String(strike).padStart(5, '0');
  return `NIFTY50${expiryStr}${strikeStr}${optionType}`;
}

/**
 * Generate option symbol for any index/stock
 */
export function generateOptionSymbol(
  underlying: string,
  strike: number,
  optionType: OptionType,
  expiryDate?: Date
): string {
  const expiry = expiryDate || getNextOptionExpiry();
  const expiryStr = formatExpiryDate(expiry);
  const strikeStr = String(strike).padStart(5, '0');
  return `${underlying}${expiryStr}${strikeStr}${optionType}`;
}

/**
 * Round price to NEXT higher strike (typically 100 for indices, 50 or 10 for stocks)
 * For price 22933 with interval 100 → rounds UP to 23000 (not down to 22900)
 */
export function roundToNearestStrike(price: number, strikeInterval: number = 100): number {
  return Math.ceil(price / strikeInterval) * strikeInterval;
}

/**
 * Get ATM (At The Money) and nearby strikes
 */
export function getNearbyStrikes(currentPrice: number, strikeInterval: number = 100, count: number = 3): number[] {
  const atm = roundToNearestStrike(currentPrice, strikeInterval);
  const strikes: number[] = [];

  for (let i = -count; i <= count; i++) {
    strikes.push(atm + i * strikeInterval);
  }

  return strikes.sort((a, b) => a - b);
}

/**
 * Get BANKNIFTY expiry dates
 * BANKNIFTY uses monthly expiry (last Thursday of each month)
 */
export function getBANKNIFTYExpiryDates(baseDate: Date = new Date()): Date[] {
  return getNSEMonthlyExpiries(baseDate);
}

/**
 * Get the next available expiry date for BANKNIFTY options
 * BANKNIFTY uses monthly expiry (last Thursday of each month)
 * @param baseDate - Reference date (default: today)
 * @param _skipCurrentWeek - Deprecated parameter, kept for backward compatibility
 */
export function getNextBANKNIFTYExpiry(baseDate: Date = new Date(), _skipCurrentWeek?: boolean): Date {
  return getNextOptionExpiryByInstrument('BANKNIFTY', baseDate);
}

/**
 * Generate BANKNIFTY option symbol
 * Format: BANKNIFTY{EXPIRY}{STRIKE}{OPTIONTYPE}
 * Example: BANKNIFTY16DEC2548000CE
 */
export function generateBANKNIFTYOptionSymbol(
  strike: number,
  optionType: OptionType,
  expiryDate?: Date
): string {
  const expiry = expiryDate || getNextBANKNIFTYExpiry();
  const expiryStr = formatExpiryDate(expiry);
  const strikeStr = String(strike).padStart(5, '0');
  return `BANKNIFTY${expiryStr}${strikeStr}${optionType}`;
}
