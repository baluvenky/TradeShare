/**
 * Test expiry config: NIFTY weekly vs BANKNIFTY monthly
 */
import { 
  getNextOptionExpiryByInstrument,
  formatDateAsYYYYMMDD,
  getNSEWeeklyExpiries,
  getNSEMonthlyExpiries
} from '../src/utils/optionUtils';

const today = new Date();
console.log(`Today: ${today.toDateString()}\n`);

console.log('=== NIFTY (Weekly Expiry) ===');
const niftyWeekly = getNSEWeeklyExpiries(today);
for (let i = 0; i < Math.min(5, niftyWeekly.length); i++) {
  console.log(`  [${i}] ${niftyWeekly[i].toDateString()} → ${formatDateAsYYYYMMDD(niftyWeekly[i])}`);
}
const nextNifty = getNextOptionExpiryByInstrument('NIFTY', today);
console.log(`Next NIFTY expiry: ${nextNifty.toDateString()} → ${formatDateAsYYYYMMDD(nextNifty)}`);

console.log('\n=== NIFTY50 (Weekly Expiry - same as NIFTY) ===');
const nextNifty50 = getNextOptionExpiryByInstrument('NIFTY50', today);
console.log(`Next NIFTY50 expiry: ${nextNifty50.toDateString()} → ${formatDateAsYYYYMMDD(nextNifty50)}`);

console.log('\n=== BANKNIFTY (Monthly Expiry - Last Thursday of Month) ===');
const bankMonthly = getNSEMonthlyExpiries(today);
for (let i = 0; i < Math.min(5, bankMonthly.length); i++) {
  console.log(`  [${i}] ${bankMonthly[i].toDateString()} → ${formatDateAsYYYYMMDD(bankMonthly[i])}`);
}
const nextBankNifty = getNextOptionExpiryByInstrument('BANKNIFTY', today);
console.log(`Next BANKNIFTY expiry: ${nextBankNifty.toDateString()} → ${formatDateAsYYYYMMDD(nextBankNifty)}`);

console.log('\n✅ Summary:');
console.log(`NIFTY:      ${formatDateAsYYYYMMDD(nextNifty)} (Weekly)`);
console.log(`NIFTY50:    ${formatDateAsYYYYMMDD(nextNifty50)} (Weekly)`);
console.log(`BANKNIFTY:  ${formatDateAsYYYYMMDD(nextBankNifty)} (Monthly)`);
