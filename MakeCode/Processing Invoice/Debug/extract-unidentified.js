const fs = require('fs');
const inputData = JSON.parse(fs.readFileSync('2511_input.txt', 'utf-8'));
const inputArray = inputData[0].input;

const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const unidentified = AZURE_RESULT.data.fields.UnidentifiedNumbers || [];

console.log('\nUnidentifiedNumbers:');
console.log('Count:', unidentified.length);
console.log('');

unidentified.forEach((item, i) => {
    console.log(`[${i}]:`, JSON.stringify(item, null, 2));
});
