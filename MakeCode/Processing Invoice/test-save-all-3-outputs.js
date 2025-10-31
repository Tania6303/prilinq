const fs = require('fs');
const path = require('path');
const { processInvoiceComplete } = require('./v4.2-COMPLETE.js');

async function testAndSaveAll3Outputs() {
    try {
        console.log('🚀 Running processInvoiceComplete with QA/input.txt...\n');

        const inputPath = path.join(__dirname, 'QA', 'input.txt');
        const inputData = fs.readFileSync(inputPath, 'utf-8');
        const rawData = JSON.parse(inputData);

        // המבנה הוא: [{ input: [{ name: "...", value: {...} }, ...] }]
        const inputArray = rawData[0].input;

        // המרה למבנה שהפונקציה מצפה לו
        const config = {};
        inputArray.forEach(item => {
            config[item.name] = item.value;
        });

        console.log('Config keys:', Object.keys(config));

        const result = await processInvoiceComplete(config);

        console.log('Result status:', result.status);

        if (result.status !== 'success') {
            console.error('❌ Processing failed:', result.error);
            console.error('Full result:', JSON.stringify(result, null, 2));
            return;
        }

        // שמירת 3 הפלטים לקבצים נפרדים
        console.log('💾 Saving all 3 outputs to separate files...\n');

        // 1. PINVOICES (invoice_data)
        const invoiceDataPath = path.join(__dirname, 'output-invoice-data.json');
        fs.writeFileSync(invoiceDataPath, JSON.stringify(result.invoice_data, null, 2));
        console.log(`✅ 1. INVOICE_DATA saved to: ${path.basename(invoiceDataPath)}`);
        console.log(`   PINVOICES count: ${result.invoice_data.PINVOICES.length}`);
        const firstItem = result.invoice_data.PINVOICES[0].PINVOICEITEMS_SUBFORM?.[0];
        console.log(`   PRICE (in items): ${firstItem?.PRICE || 'not found'}`);

        // 2. LLM Prompt
        const llmPromptPath = path.join(__dirname, 'output-llm-prompt.json');
        fs.writeFileSync(llmPromptPath, JSON.stringify(result.llm_prompt, null, 2));
        console.log(`\n✅ 2. LLM_PROMPT saved to: ${path.basename(llmPromptPath)}`);
        console.log(`   Fields explained: ${Object.keys(result.llm_prompt.instructions.fields).length}`);
        console.log(`   Processing steps: ${result.llm_prompt.instructions.processing_steps.length}`);

        // 3. Technical Config
        const techConfigPath = path.join(__dirname, 'output-technical-config.json');
        fs.writeFileSync(techConfigPath, JSON.stringify(result.technical_config, null, 2));
        console.log(`\n✅ 3. TECHNICAL_CONFIG saved to: ${path.basename(techConfigPath)}`);
        console.log(`   Extraction rules: ${Object.keys(result.technical_config.extraction_rules).length}`);
        console.log(`   Price formula: ${result.technical_config.extraction_rules.price.calculation.primary.formula}`);

        console.log('\n🎉 ALL 3 OUTPUTS SAVED SUCCESSFULLY!\n');

        // הצגת תקציר
        console.log('📊 SUMMARY:');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('1. output-invoice-data.json    → Priority ERP JSON');
        console.log('2. output-llm-prompt.json      → LLM Instructions');
        console.log('3. output-technical-config.json → Technical Rules');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error.stack);
    }
}

testAndSaveAll3Outputs();
