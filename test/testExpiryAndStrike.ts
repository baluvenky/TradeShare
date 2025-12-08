/**
 * Test script to verify strike rounding and expiry date logic
 */

import { 
  roundToNearestStrike, 
  getNextOptionExpiry, 
  getNSEExpiryDates,
  formatExpiryDate 
} from '../src/utils/optionUtils';

console.log('=== Strike Rounding Tests ===');
console.log(`Price: 22933, Interval: 100 → Strike: ${roundToNearestStrike(22933, 100)} (should be 23000, not 22900)`);
console.log(`Price: 52400, Interval: 100 → Strike: ${roundToNearestStrike(52400, 100)} (should be 52500)`);
console.log(`Price: 24850, Interval: 100 → Strike: ${roundToNearestStrike(24850, 100)} (should be 24900)`);

console.log('\n=== NSE Expiry Date Tests ===');
const today = new Date();
console.log(`Today: ${today.toDateString()} (${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()]})`);

const expiryDates = getNSEExpiryDates(today);
console.log(`\nUpcoming NSE expiries (next 8 Thursdays):`);
for (let i = 0; i < Math.min(8, expiryDates.length); i++) {
  const d = expiryDates[i];
  const formatted = formatExpiryDate(d);
  console.log(`  [${i}] ${d.toDateString()} → ${formatted}`);
}

console.log(`\n=== Next Option Expiry (Skip Current Week) ===`);
const nextExpiry = getNextOptionExpiry(today, true);
console.log(`Next expiry (skip current week): ${nextExpiry.toDateString()} → ${formatExpiryDate(nextExpiry)}`);

const nextExpiryNoSkip = getNextOptionExpiry(today, false);
console.log(`Next expiry (no skip): ${nextExpiryNoSkip.toDateString()} → ${formatExpiryDate(nextExpiryNoSkip)}`);

console.log('\n=== Example: Message NIFTY50:OPT:NIFTY:LONG:22933 ===');
const price = 22933;
const strike = roundToNearestStrike(price, 100);
const expiry = getNextOptionExpiry(today, true);
console.log(`Price: ${price} → Strike: ${strike} (rounded UP to next 100)`);
console.log(`Expiry: ${expiry.toDateString()} → ${formatExpiryDate(expiry)}`);
console.log(`Expected symbol format: NIFTY${formatExpiryDate(expiry)}${String(strike).padStart(5, '0')}CE`);
