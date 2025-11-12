#!/usr/bin/env node

/**
 * Generate claim codes for event badges
 * Usage: node scripts/generate-claim-codes.js <count>
 */

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Get count from command line args
const count = parseInt(process.argv[2]) || 10;

console.log(`🎫 Generating ${count} claim codes...\n`);

// Generate random claim codes
const codes = [];
for (let i = 0; i < count; i++) {
  const code = crypto.randomBytes(8).toString('hex').toUpperCase();
  codes.push(code);
}

// Display codes
console.log('Generated Claim Codes:');
console.log('═'.repeat(50));
codes.forEach((code, index) => {
  console.log(`${(index + 1).toString().padStart(3, '0')}. ${code}`);
});
console.log('═'.repeat(50));

// Save to file
const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
const filename = `claim-codes-${timestamp}.json`;
const filepath = path.join(process.cwd(), 'claim-codes', filename);

// Ensure directory exists
const dir = path.dirname(filepath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

// Save as JSON
fs.writeFileSync(
  filepath,
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      count: codes.length,
      codes: codes,
    },
    null,
    2
  )
);

console.log(`\n✅ Codes saved to: ${filename}`);

// Also save as CSV for easy import
const csvPath = filepath.replace('.json', '.csv');
fs.writeFileSync(
  csvPath,
  'Index,ClaimCode\n' + codes.map((code, i) => `${i + 1},${code}`).join('\n')
);

console.log(`✅ CSV saved to: ${path.basename(csvPath)}`);

// Generate QR codes info
console.log('\n📱 To generate QR codes for these claim codes:');
console.log('   1. Upload codes to your event dashboard');
console.log('   2. Use the QR Generator in the organizer portal');
console.log('   3. Print or display QR codes at your event\n');
