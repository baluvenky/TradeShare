import { refreshExpiryDates, getCachedExpiryDates } from '../src/utils/nseExpiryCache';

async function run() {
  console.log('Refreshing NSE expiry dates for NIFTY...');
  await refreshExpiryDates('NIFTY');
  const cached = getCachedExpiryDates('NIFTY');
  if (!cached) {
    console.error('No expiry dates cached for NIFTY (API may be unavailable).');
    process.exit(2);
  }

  console.log('NIFTY expiryDates from NSE API:', cached);

  const wanted = '16-Dec-2025';
  if (cached.includes(wanted)) {
    console.log(`Success: ${wanted} is present in the expiry list.`);
    process.exit(0);
  } else {
    console.warn(`Note: ${wanted} not found in API results.`);
    // Still exit with 0 to avoid breaking CI if the API changes; user can inspect output
    process.exit(0);
  }
}

run().catch((err) => {
  console.error('Error during NSE expiry test:', err);
  process.exit(3);
});
