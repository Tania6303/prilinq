const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function checkTechnicalConfig() {
    const inputPath = path.join(__dirname, 'QA', '2511_input.txt');
    const inputData = fs.readFileSync(inputPath, 'utf-8');
    const rawData = JSON.parse(inputData);
    const inputArray = rawData[0].input;

    const config = {};
    inputArray.forEach(item => {
        config[item.name] = item.value;
    });

    const result = await processInvoiceComplete(config);

    console.log('\n📋 What technical_config says about DOCUMENTS:');
    console.log('═'.repeat(70));

    const techConfig = result.technical_config;

    if (techConfig.extraction_rules && techConfig.extraction_rules.documents) {
        console.log('\n✅ extraction_rules.documents exists:');
        console.log(JSON.stringify(techConfig.extraction_rules.documents, null, 2));
    } else {
        console.log('\n❌ extraction_rules.documents DOES NOT EXIST!');
        console.log('\nThis means the NEXT code has NO instructions on:');
        console.log('  - Where to find document numbers in AZURE_RESULT');
        console.log('  - What pattern to search for (25XXXXXX)');
        console.log('  - Where to search (UnidentifiedNumbers? AZURE_TEXT? Items?)');
    }

    console.log('\n\n📋 What extraction_rules DO exist:');
    console.log('═'.repeat(70));
    console.log(Object.keys(techConfig.extraction_rules).join(', '));

    console.log('\n');
}

checkTechnicalConfig();
