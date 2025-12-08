/**
 * Test the HTTP API directly
 */
import http from 'http';

function testAPI() {
  const postData = JSON.stringify({
    message: 'NIFTY50:OPT:NIFTY:LONG:22933'
  });

  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/message',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  };

  const req = http.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
      data += chunk;
    });

    res.on('end', () => {
      console.log('\n✅ API Response:');
      const response = JSON.parse(data);
      console.log(JSON.stringify(response, null, 2));
      
      if (response.ok && response.executions && response.executions.length > 0) {
        const exec = response.executions[0];
        console.log('\n📊 Execution Details:');
        console.log(`  Symbol: ${exec.symbol}`);
        console.log(`  Strike: ${exec.strike}`);
        console.log(`  Option Type: ${exec.optionType}`);
        console.log(`  Expiry: ${exec.expiry}`);
        console.log(`  Trade Type: ${exec.tradeType}`);
        
        // Check if expiry is correct (should be 2025-12-16, NOT 2025-12-09)
        if (exec.expiry === '2025-12-16') {
          console.log('\n✅ PASS: Expiry is correct (2025-12-16 - next expiry, not immediate)');
        } else {
          console.log(`\n❌ FAIL: Expiry is ${exec.expiry}, expected 2025-12-16`);
        }
      }
    });
  });

  req.on('error', (e) => {
    console.error(`❌ API Error: ${e.message}`);
  });

  req.write(postData);
  req.end();
}

console.log('Testing API endpoint: POST /message');
console.log('Request: {"message":"NIFTY50:OPT:NIFTY:LONG:22933"}');
testAPI();
