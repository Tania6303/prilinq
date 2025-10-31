const fs = require('fs');
const inputData = JSON.parse(fs.readFileSync('2511_input.txt', 'utf-8'));
const inputArray = inputData[0].input;

const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const items = AZURE_RESULT.data.fields.Items || [];

console.log('\nItems:');
console.log('Count:', items.length);
console.log('');

items.forEach((item, i) => {
    console.log(`[${i}]:`, JSON.stringify(item, null, 2));
});
