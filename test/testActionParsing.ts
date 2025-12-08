/**
 * Quick test to verify LONG_EXIT parsing
 */

// Test normalizeKey function
function normalizeKey(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9_]/g, '').toLowerCase().replace(/_/g, '');
}

// Test actionToSignal cases
const testCases = [
  { input: 'LONG', expected: 'LONG' },
  { input: 'LONG_EXIT', expected: 'EXIT_LONG' },
  { input: 'longexit', expected: 'EXIT_LONG' },
  { input: 'exitlong', expected: 'EXIT_LONG' },
  { input: 'SHORT_ADD', expected: 'SHORT_ADD' },
  { input: 'exit_short', expected: 'EXIT_SHORT' },
  { input: 'LONG_ADD', expected: 'LONG_ADD' },
];

console.log('=== Testing normalizeKey and action parsing ===\n');

testCases.forEach(tc => {
  const normalized = normalizeKey(tc.input);
  console.log(`Input: "${tc.input}"`);
  console.log(`  Normalized: "${normalized}"`);
  console.log(`  Expected signal: "${tc.expected}"`);
  console.log();
});

console.log('Test message: "MCX:FUT:GOLD:LONG_EXIT:25000"');
const msg = 'MCX:FUT:GOLD:LONG_EXIT:25000';
const parts = msg.split(':');
console.log(`Parts: ${JSON.stringify(parts)}`);
console.log(`Action part (index 3): "${parts[3]}"`);
console.log(`Normalized action: "${normalizeKey(parts[3])}"`);
