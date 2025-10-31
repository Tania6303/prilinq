const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'QA', 'input.txt');
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const inputArray = inputData[0].input;

const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const items = AZURE_RESULT.data.fields.Items || [];

console.log('\n📦 Items Array:');
console.log('═══════════════════════════════════════\n');
console.log(`Total items: ${items.length}\n`);

items.slice(0, 3).forEach((item, i) => {
    console.log(`[${i}] Item:`);
    console.log(JSON.stringify(item, null, 2));
    console.log('');
});
