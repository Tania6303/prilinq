const fs = require('fs');
const path = require('path');

const inputPath = path.join(__dirname, 'QA', 'input.txt');
const inputData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
const inputArray = inputData[0].input;

const AZURE_RESULT = inputArray.find(item => item.name === 'AZURE_RESULT').value;
const ocrFields = AZURE_RESULT.data.fields;

console.log('\n🔍 OCR Fields Available:');
console.log('═══════════════════════════════════════\n');

Object.keys(ocrFields).forEach(key => {
    const value = ocrFields[key];
    if (Array.isArray(value)) {
        console.log(`${key}: [${value.length} items]`);
        if (value.length > 0 && value.length <= 5) {
            value.forEach((v, i) => {
                console.log(`  [${i}]: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
            });
        }
    } else if (typeof value === 'object') {
        console.log(`${key}: ${JSON.stringify(value)}`);
    } else {
        console.log(`${key}: ${value}`);
    }
});

console.log('\n\n🚗 VehicleNumbers field:');
console.log('═══════════════════════════════════════\n');
if (ocrFields.VehicleNumbers) {
    console.log(JSON.stringify(ocrFields.VehicleNumbers, null, 2));
} else {
    console.log('❌ VehicleNumbers field does not exist!');
}

console.log('\n\n📝 InvoiceDescription field:');
console.log('═══════════════════════════════════════\n');
if (ocrFields.InvoiceDescription) {
    console.log(ocrFields.InvoiceDescription);
} else {
    console.log('❌ InvoiceDescription field does not exist!');
}

console.log('\n\n🔢 UnidentifiedNumbers (first 10):');
console.log('═══════════════════════════════════════\n');
const unidentified = ocrFields.UnidentifiedNumbers || [];
unidentified.slice(0, 10).forEach((item, i) => {
    if (typeof item === 'object') {
        console.log(`[${i}] value: "${item.value}"`);
        console.log(`    label: "${item.label || 'N/A'}"`);
        if (item.context) {
            console.log(`    context: "${item.context.substring(0, 60)}..."`);
        }
        console.log('');
    } else {
        console.log(`[${i}] ${item}`);
    }
});
