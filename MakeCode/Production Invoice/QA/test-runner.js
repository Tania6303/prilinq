// ============================================================================
// Test Runner - הרצת v1.0-production.js עם INPUT_3979.TXT
// ============================================================================

const fs = require('fs');
const path = require('path');

// קריאת הקוד והקלט
const codeFile = path.join(__dirname, '..', 'v1.0-production.js');
const inputFile = path.join(__dirname, 'INPUT_3979.TXT');

console.log('='.repeat(80));
console.log('Test Runner - Production Invoice v1.0');
console.log('='.repeat(80));
console.log('');

// בדיקה שהקבצים קיימים
if (!fs.existsSync(codeFile)) {
    console.error('❌ Error: Code file not found:', codeFile);
    process.exit(1);
}

if (!fs.existsSync(inputFile)) {
    console.error('❌ Error: Input file not found:', inputFile);
    process.exit(1);
}

console.log('✅ Code file:', codeFile);
console.log('✅ Input file:', inputFile);
console.log('');

// קריאת הקלט
let input;
try {
    const inputText = fs.readFileSync(inputFile, 'utf8');
    input = JSON.parse(inputText);
    console.log('✅ Input parsed successfully');
    console.log('   Input type:', Array.isArray(input) ? 'Array' : 'Object');
    console.log('   Input length:', Array.isArray(input) ? input.length : 'N/A');
    if (input[0]) {
        console.log('   Keys in first item:', Object.keys(input[0]).join(', '));
    }
} catch (error) {
    console.error('❌ Error parsing input:', error.message);
    process.exit(1);
}

console.log('');
console.log('-'.repeat(80));
console.log('Running code...');
console.log('-'.repeat(80));
console.log('');

// הרצת הקוד
try {
    const code = fs.readFileSync(codeFile, 'utf8');

    // עטיפת הקוד בפונקציה כדי לאפשר return
    const wrappedCode = `
        (function() {
            ${code}
        })()
    `;

    const result = eval(wrappedCode);

    console.log('');
    console.log('='.repeat(80));
    console.log('Result:');
    console.log('='.repeat(80));
    console.log('');
    console.log(JSON.stringify(result, null, 2));

    // שמירת התוצאה
    const outputFile = path.join(__dirname, 'OUTPUT_3979.json');
    fs.writeFileSync(outputFile, JSON.stringify(result, null, 2), 'utf8');
    console.log('');
    console.log('✅ Output saved to:', outputFile);

} catch (error) {
    console.error('');
    console.error('='.repeat(80));
    console.error('❌ Error running code:');
    console.error('='.repeat(80));
    console.error('');
    console.error(error.message);
    console.error('');
    console.error('Stack trace:');
    console.error(error.stack);
    process.exit(1);
}
