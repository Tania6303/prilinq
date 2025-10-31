const fs = require('fs');
const inputData = JSON.parse(fs.readFileSync('2511_input.txt', 'utf-8'));
const inputArray = inputData[0].input;

const AZURE_TEXT = inputArray.find(item => item.name === 'AZURE_TEXT').value;

console.log('\n🔍 Searching for DOC numbers in AZURE_TEXT:');
console.log('─'.repeat(60));

const docPattern = /25\d{6}/g;
const matches = AZURE_TEXT.match(docPattern);

if (matches) {
    console.log('\nFound DOCNO patterns (25XXXXXX):');
    matches.forEach((m, i) => {
        console.log(`  [${i}] ${m}`);
    });
} else {
    console.log('\n❌ No DOCNO patterns found');
}

console.log('\n');

const booknumPattern = /108\d{6}/g;
const booknumMatches = AZURE_TEXT.match(booknumPattern);

if (booknumMatches) {
    console.log('Found BOOKNUM patterns (108XXXXXX):');
    booknumMatches.forEach((m, i) => {
        console.log(`  [${i}] ${m}`);
    });
} else {
    console.log('❌ No BOOKNUM patterns found');
}

console.log('\n');
