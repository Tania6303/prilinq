const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'QA', 'input.txt');
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const inputArray = inputData[0].input;

const learned_config = inputArray.find(item => item.name === 'learned_config').value;
const config = learned_config.config;

console.log('\n🔍 Structure configuration:');
console.log('═══════════════════════════════════════\n');

config.structure.forEach((struct, i) => {
    console.log(`Template ${i}:`);
    console.log(`  has_import: ${struct.has_import}`);
    console.log(`  has_doc: ${struct.has_doc}`);
    console.log(`  debit_type: ${struct.debit_type}`);
    console.log('');
});

console.log('\n🚗 Vehicle Rules:');
console.log('═══════════════════════════════════════\n');

const vehicleRules = config.rules?.critical_patterns?.vehicle_rules;
if (vehicleRules) {
    console.log('  enabled:', vehicleRules.enabled);
    console.log('  partname:', vehicleRules.partname);
    console.log('  vehicle_account_mapping:', Object.keys(vehicleRules.vehicle_account_mapping || {}).length, 'vehicles');
} else {
    console.log('  ❌ No vehicle rules found');
}
