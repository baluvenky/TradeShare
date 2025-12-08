/**
 * Test HTTP API with corrected LONG_EXIT parsing
 */

import http from 'http';

function testMessage(message: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({ message });
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/message',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch (e) {
          resolve(body);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

(async () => {
  console.log('=== Testing API with corrected action parsing ===\n');

  const testCases = [
    { message: 'MCX:FUT:GOLD:LONG_EXIT:25000', expectedTradeType: 'SELL' },
    { message: 'MCX:FUT:SILVER:LONG:25000', expectedTradeType: 'BUY' },
    { message: 'NIFTY:OPT:NIFTY:SHORT_ADD:24800', expectedTradeType: 'BUY' },
    { message: 'NIFTY:OPT:NIFTY:EXIT_SHORT:24800', expectedTradeType: 'SELL' },
    { message: 'BANKNIFTY:OPT:BANKNIFTY:LONG_EXIT:43000', expectedTradeType: 'SELL' },
  ];

  for (const tc of testCases) {
    try {
      console.log(`Testing: ${tc.message}`);
      const response = await testMessage(tc.message);
      if (response.ok && response.executions && response.executions[0]) {
        const exec = response.executions[0];
        const passed = exec.tradeType === tc.expectedTradeType;
        const status = passed ? '✓ PASS' : '✗ FAIL';
        console.log(`  ${status}: tradeType=${exec.tradeType} (expected: ${tc.expectedTradeType}), signal=${exec.signal}`);
      } else {
        console.log(`  ✗ FAIL: ${JSON.stringify(response)}`);
      }
    } catch (err: any) {
      console.log(`  ✗ ERROR: ${err.message}`);
    }
    console.log();
  }

  console.log('=== Tests Completed ===');
  process.exit(0);
})().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
