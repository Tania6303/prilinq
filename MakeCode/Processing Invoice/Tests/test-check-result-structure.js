const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function checkResultStructure() {
    try {
        const inputPath = path.join(__dirname, 'QA', 'input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);

        const inputArray = rawData[0].input;
        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        const result = await processInvoiceComplete(config);

        console.log('\n📦 Result Structure:');
        console.log('===================\n');

        const keys = Object.keys(result);
        console.log(`Total fields: ${keys.length}\n`);

        keys.forEach((key, index) => {
            console.log(`${index + 1}. ${key}`);
        });

        console.log('\n✅ Expected: 4 fields (status + 3 outputs)');
        console.log(`✅ Actual: ${keys.length} fields`);

        if (keys.length === 4 && keys.includes('status') && keys.includes('invoice_data') && keys.includes('llm_prompt') && keys.includes('technical_config')) {
            console.log('\n🎉 PERFECT! Structure is clean with exactly 3 outputs + status');
        } else {
            console.log('\n⚠️  Structure has unexpected fields');
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

checkResultStructure();
