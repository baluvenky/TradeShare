import { getCachedExpiryDates, refreshExpiryDates } from '../src/utils/nseExpiryCache';

async function run() {
  console.log('Cached expiries before refresh:');
  console.log('NIFTY:', getCachedExpiryDates('NIFTY'));
  console.log('BANKNIFTY:', getCachedExpiryDates('BANKNIFTY'));

  console.log('\nForcing refresh of NIFTY and BANKNIFTY...');
  await refreshExpiryDates('NIFTY');
  await refreshExpiryDates('BANKNIFTY');

  console.log('\nCached expiries after refresh:');
  console.log('NIFTY:', getCachedExpiryDates('NIFTY'));
  console.log('BANKNIFTY:', getCachedExpiryDates('BANKNIFTY'));
}

run().catch(err => {
  console.error('Error while refreshing cache:', err);
  process.exit(1);
});
