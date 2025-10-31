const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function testProcessingScenario() {
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

        console.log('\n📊 PROCESSING SCENARIO:');
        console.log('═══════════════════════════════════════\n');

        const scenario = result.processing_scenario;

        console.log('🔍 What MAKE needs to fetch from the system:\n');
        console.log(`  ${scenario.check_docs ? '✅' : '❌'} check_docs: ${scenario.check_docs}`);
        console.log('     → Need to fetch list of DOCS for this supplier\n');

        console.log(`  ${scenario.check_import ? '✅' : '❌'} check_import: ${scenario.check_import}`);
        console.log('     → Need to fetch import files for this supplier\n');

        console.log(`  ${scenario.check_vehicles ? '✅' : '❌'} check_vehicles: ${scenario.check_vehicles}`);
        console.log('     → Need to fetch vehicle list for this supplier\n');

        console.log('═══════════════════════════════════════\n');
        console.log('💡 MAKE workflow based on scenario:\n');

        if (scenario.check_docs) {
            console.log('  1. Fetch DOCS list from Priority for supplier');
        }
        if (scenario.check_import) {
            console.log('  2. Fetch import files from system for supplier');
        }
        if (scenario.check_vehicles) {
            console.log('  3. Fetch vehicle mapping from system for supplier');
        }

        console.log('\n  4. Send to LLM/processing with all data');
        console.log('  5. Get back invoice_data JSON for Priority');

        // Save to file
        const outputPath = path.join(__dirname, 'output-processing-scenario.json');
        fs.writeFileSync(outputPath, JSON.stringify(scenario, null, 2));
        console.log(`\n💾 Saved to: ${path.basename(outputPath)}\n`);

    } catch (error) {
        console.error('\n❌ Error:', error.message);
    }
}

testProcessingScenario();
