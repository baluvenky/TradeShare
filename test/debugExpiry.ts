/**
 * Debug: Check the exact expiry date calculation
 */
import { getNextOptionExpiry, formatExpiryDate, getNSEExpiryDates } from '../src/utils/optionUtils';

const today = new Date();
console.log('Today:', today.toDateString(), `(Day of week: ${today.getDay()}, ${['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][today.getDay()]})`);

const expiryDates = getNSEExpiryDates(today);
console.log('\nNSE Expiry Dates (first 5):');
for (let i = 0; i < 5 && i < expiryDates.length; i++) {
  console.log(`  [${i}] ${expiryDates[i].toDateString()} (${expiryDates[i].getDate()}) → ${formatExpiryDate(expiryDates[i])}`);
}

const nextExpiry = getNextOptionExpiry(today, true);
console.log('\nNext expiry (skip current week):');
console.log(`  Date: ${nextExpiry.toDateString()}`);
console.log(`  ISO: ${nextExpiry.toISOString().split('T')[0]}`);
console.log(`  Formatted: ${formatExpiryDate(nextExpiry)}`);
